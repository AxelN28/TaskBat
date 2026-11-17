const pool = require('../config/db');
const { timingSafeEqual } = require('node:crypto');

const config = {
    clientId: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
    refreshToken: process.env.ZOHO_REFRESH_TOKEN,
    accountId: process.env.ZOHO_ACCOUNT_ID,
    from: process.env.ZOHO_FROM,
    to: process.env.MAIL_RECIPIENT,
    jobToken: process.env.MAIL_JOB_TOKEN,
};

const enabled = Boolean(config.clientId && config.clientSecret && config.refreshToken &&
    /^\d+$/.test(config.accountId || '') && config.from && config.to && config.jobToken);

const bogotaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' });
const oneDay = 86_400_000;

let cachedAccess;
let flushing;

async function getAccessToken() {
    if (cachedAccess?.until > Date.now()) return cachedAccess.token;

    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: config.clientId,
            client_secret: config.clientSecret,
            refresh_token: config.refreshToken,
        }),
        signal: AbortSignal.timeout(10_000),
    });

    const data = await response.json();
    if (!response.ok || !data.access_token) throw new Error('Zoho rechazó la renovación OAuth');

    cachedAccess = { token: data.access_token, until: Date.now() + (Number(data.expires_in) - 60) * 1000 };
    return cachedAccess.token;
}

async function sendEmail({ subject, content }) {
    const token = await getAccessToken();
    const response = await fetch(`https://mail.zoho.com/api/accounts/${config.accountId}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fromAddress: config.from,
            toAddress: config.to,
            subject,
            content,
            mailFormat: 'plaintext',
            encoding: 'UTF-8',
        }),
        signal: AbortSignal.timeout(10_000),
    });

    const result = await response.json();
    if (response.status === 401) cachedAccess = undefined;
    if (!response.ok || result.status?.code !== 200) {
        throw new Error(`Zoho rechazó el envío (HTTP ${response.status})`);
    }
}

async function enqueueTaskEmail(kind, task) {
    if (!enabled) return;

    const subject = kind === 'created' ? 'TaskBat · Tarea creada' : 'TaskBat · ¡Tarea completada!';
    const content = kind === 'created'
        ? `«${task.title}» ya está en tu lista de tareas.`
        : `¡Buen trabajo! Terminaste «${task.title}».`;

    // Agrupa cada evento por tarea y limita los avisos del tablero público.
    const { rowCount } = await pool.query(
        `INSERT INTO mail_outbox (message_key, subject, content)
         SELECT $1, $2, $3
         WHERE (SELECT count(*) FROM mail_outbox
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                AND message_key NOT LIKE 'daily:%') < 20
         ON CONFLICT (message_key) DO NOTHING`,
        [`${kind}:${task.id}`, subject, content],
    );

    if (rowCount) await flushEmails();
}

async function deliverQueuedEmails() {
    const client = await pool.connect();
    let acquired = false;
    let brokenConnection;
    try {
        await client.query('SELECT pg_advisory_lock(741831)');
        acquired = true;

        const { rows } = await client.query(
            `WITH sent AS (
                 SELECT count(*)::int AS total FROM mail_outbox
                 WHERE sent_at >= NOW() - INTERVAL '24 hours' AND message_key NOT LIKE 'daily:%'
             )
             (SELECT message_key, subject, content FROM mail_outbox
              WHERE sent_at IS NULL AND created_at >= NOW() - INTERVAL '2 days'
                AND message_key LIKE 'daily:%' ORDER BY created_at LIMIT 2)
             UNION ALL
             (SELECT message_key, subject, content FROM mail_outbox
              WHERE sent_at IS NULL AND created_at >= NOW() - INTERVAL '2 days'
                AND message_key NOT LIKE 'daily:%' ORDER BY created_at
              LIMIT (SELECT GREATEST(0, LEAST(3, 20 - total)) FROM sent))`,
        );
        for (const message of rows) {
            await sendEmail(message);
            await client.query("UPDATE mail_outbox SET sent_at = NOW(), content = '' WHERE message_key = $1", [message.message_key]);
        }
    } finally {
        if (acquired) {
            try {
                await client.query('SELECT pg_advisory_unlock(741831)');
            } catch (error) {
                brokenConnection = error;
            }
        }
        client.release(brokenConnection);
    }
}

function flushEmails() {
    const next = (flushing?.catch(() => {}) ?? Promise.resolve()).then(deliverQueuedEmails);
    flushing = next;
    return next.finally(() => {
        if (flushing === next) flushing = undefined;
    });
}

function isAuthorized(request) {
    const supplied = Buffer.from(request.get('Authorization') ?? '');
    const expected = Buffer.from(`Bearer ${config.jobToken}`);
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

async function sendDailySummary(request, response) {
    if (!enabled || !isAuthorized(request)) return response.sendStatus(404);

    try {
        const now = Date.now();
        const { rows } = await pool.query(
            'SELECT title, created_at FROM tasks WHERE completed IS NOT TRUE ORDER BY created_at LIMIT 101',
        );
        const lines = rows.slice(0, 100).map(task => {
            const label = now - new Date(task.created_at).getTime() >= oneDay ? ' [más de 24 h pendiente]' : '';
            return `- ${task.title}${label}`;
        });
        if (rows.length > 100) lines.push('- Hay más tareas pendientes en TaskBat.');

        await pool.query(
            `INSERT INTO mail_outbox (message_key, subject, content) VALUES ($1, $2, $3)
             ON CONFLICT (message_key) DO NOTHING`,
            [
                `daily:${bogotaDate.format(now)}`,
                'TaskBat · Resumen diario de pendientes',
                lines.length ? `Tus tareas pendientes:\n\n${lines.join('\n')}` : '¡Estás al día! No quedan tareas pendientes.',
            ],
        );
        await flushEmails();
        return response.json({ status: 'processed' });
    } catch (error) {
        console.error('Error procesando el correo de TaskBat:', error.message);
        return response.sendStatus(502);
    }
}

module.exports = { enqueueTaskEmail, sendDailySummary };
