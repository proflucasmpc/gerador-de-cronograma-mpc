import { getStore } from '@netlify/blobs';

const ACCESS_STORE = 'mpc-student-access';
const PLAN_STORE = 'mpc-public-plans';
const COOKIE = 'mpc_student_session';
const STUDENT_RE = /^[a-z0-9-]{2,60}$/;
const PLAN_RE = /^[A-Z0-9]{10}$/;

// Acessos iniciais provisionados no servidor. Somente o hash do código fica no código-fonte.
const BOOTSTRAP_STUDENTS = {
  everton: {
    planId: 'TWTFC9GZ56',
    codeHash: '19781524ccbc5ca1084c11b3f91ee357bad78df33c84e328fe5eac1025fdc6ce',
    maxDevices: 2
  }
};

const json = (data, status = 200, headers = {}) => Response.json(data, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
});
const clean = (value, max = 160) => String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
const hex = bytes => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
const hash = async value => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || ''))));
const randomToken = (length = 48) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map(byte => alphabet[byte % alphabet.length]).join('');
};
const cookieValue = req => {
  const match = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : '';
};
const sessionFor = async (req, store, student) => {
  const token = cookieValue(req); if (!token) return null;
  const session = await store.get(`session/${await hash(token)}`, { type: 'json', consistency: 'strong' });
  return session?.student === student && session?.active !== false ? session : null;
};
const normalizedDeviceLimit = value => Math.min(5, Math.max(1, Number.parseInt(value, 10) || 1));

async function studentRecord(store, student) {
  let record = await store.get(`student/${student}`, { type: 'json', consistency: 'strong' });
  if (record) return record;
  const bootstrap = BOOTSTRAP_STUDENTS[student];
  if (!bootstrap) return null;
  record = {
    student,
    planId: bootstrap.planId,
    codeHash: bootstrap.codeHash,
    maxDevices: normalizedDeviceLimit(bootstrap.maxDevices),
    sessions: 0,
    createdAt: new Date().toISOString(),
    provisionedBy: 'server-bootstrap'
  };
  await store.setJSON(`student/${student}`, record);
  return record;
}

export default async req => {
  const action = new URL(req.url).pathname.split('/').filter(Boolean).at(-1);
  const store = getStore({ name: ACCESS_STORE, consistency: 'strong' });

  if (action === 'status' && req.method === 'GET') {
    const student = clean(new URL(req.url).searchParams.get('student'), 60).toLowerCase();
    if (!STUDENT_RE.test(student)) return json({ error: 'Aluno inválido.' }, 400);
    const record = await studentRecord(store, student);
    return json({
      authorized: Boolean(await sessionFor(req, store, student)),
      maxDevices: record?.maxDevices || 1
    });
  }

  if (action === 'activate' && req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const student = clean(body.student, 60).toLowerCase();
    const code = clean(body.code, 80).toUpperCase();
    if (!STUDENT_RE.test(student) || !code) return json({ error: 'Informe o código de ativação.' }, 400);
    const record = await studentRecord(store, student);
    if (!record || record.codeHash !== await hash(code)) return json({ error: 'Código de ativação inválido.' }, 403);
    const existing = await sessionFor(req, store, student);
    if (existing) return json({ authorized: true, planId: record.planId, maxDevices: record.maxDevices || 1 });
    if ((record.sessions || 0) >= (record.maxDevices || 1)) return json({ error: `Este código já atingiu o limite de ${record.maxDevices || 1} dispositivo(s) autorizado(s). Solicite a redefinição do acesso.` }, 409);
    const token = randomToken();
    const sessionHash = await hash(token);
    await store.setJSON(`session/${sessionHash}`, { student, planId: record.planId, active: true, createdAt: new Date().toISOString() });
    await store.setJSON(`student/${student}`, { ...record, sessions: (record.sessions || 0) + 1, activatedAt: new Date().toISOString() });
    return json({ authorized: true, planId: record.planId, maxDevices: record.maxDevices || 1 }, 200, {
      'Set-Cookie': `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=15552000; HttpOnly; Secure; SameSite=Lax`
    });
  }

  if (action === 'provision' && req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const student = clean(body.student, 60).toLowerCase();
    const planId = clean(body.planId, 20).toUpperCase();
    const activationCode = clean(body.activationCode, 80).toUpperCase();
    const maxDevices = normalizedDeviceLimit(body.maxDevices);
    if (!STUDENT_RE.test(student) || !PLAN_RE.test(planId) || activationCode.length < 8) return json({ error: 'Dados de provisionamento inválidos.' }, 400);
    const plans = getStore({ name: PLAN_STORE, consistency: 'strong' });
    const plan = await plans.get(planId, { type: 'json', consistency: 'strong' });
    if (!plan) return json({ error: 'Plano não encontrado.' }, 404);
    const manageHash = await hash(clean(req.headers.get('x-plan-key'), 120));
    if (!plan._manageHash || manageHash !== plan._manageHash) return json({ error: 'Não autorizado.' }, 403);
    const listed = await store.list({ prefix: 'session/' });
    for (const item of listed.blobs) {
      const session = await store.get(item.key, { type: 'json', consistency: 'strong' });
      if (session?.student === student) await store.delete(item.key);
    }
    await store.setJSON(`student/${student}`, {
      student, planId, codeHash: await hash(activationCode), maxDevices, sessions: 0, createdAt: new Date().toISOString()
    });
    return json({ provisioned: true, student, planId, maxDevices });
  }

  return json({ error: 'Método não permitido.' }, 405);
};

export const config = { path: ['/api/student-access/activate', '/api/student-access/provision', '/api/student-access/status'] };
