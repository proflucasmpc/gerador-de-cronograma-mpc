import { getStore } from '@netlify/blobs';

const COOKIE = 'mpc_student_session';
const clean = (value, max = 80) => String(value ?? '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, max);
const hex = bytes => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
const hash = async value => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || ''))));
const tokenFrom = req => {
  const match = (req.headers.get('cookie') || '').match(/(?:^|;\s*)mpc_student_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
};
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });

export default async req => {
  if (req.method !== 'GET') return json({ error: 'Método não permitido.' }, 405);
  const student = clean(new URL(req.url).searchParams.get('student')).toLowerCase();
  const token = tokenFrom(req);
  if (!student || !token) return json({ error: 'Ativação necessária.', code: 'ACTIVATION_REQUIRED' }, 401);
  const access = getStore({ name: 'mpc-student-access', consistency: 'strong' });
  const session = await access.get(`session/${await hash(token)}`, { type: 'json', consistency: 'strong' });
  if (!session || session.student !== student || session.active === false) return json({ error: 'Acesso não autorizado.', code: 'ACTIVATION_REQUIRED' }, 401);
  const plans = getStore({ name: 'mpc-public-plans', consistency: 'strong' });
  const plan = await plans.get(session.planId, { type: 'json', consistency: 'strong' });
  if (!plan) return json({ error: 'Cronograma não encontrado.' }, 404);
  const { _manageHash, ...safe } = plan;
  return json(safe);
};

export const config = { path: '/api/student-plan' };
