import { getStore } from '@netlify/blobs';

const STORE_NAME = 'mpc-public-plans';
const MAX_BODY_BYTES = 900_000;
const ID_RE = /^[A-Z0-9]{10}$/;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': status === 200 ? 'no-store' : 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function cleanString(value, max = 500) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

function cleanTask(task = {}) {
  return {
    id: cleanString(task.id, 100),
    date: cleanString(task.date, 20),
    day: Number.isFinite(Number(task.day)) ? Number(task.day) : null,
    start: cleanString(task.start, 10),
    end: cleanString(task.end, 10),
    subject: cleanString(task.subject, 220),
    activity: cleanString(task.activity, 2500),
    type: cleanString(task.type, 80),
    done: Boolean(task.done)
  };
}

function sanitizePlan(input = {}) {
  const tasks = Array.isArray(input.tasks) ? input.tasks.slice(0, 1600).map(cleanTask) : [];
  if (!tasks.length) throw new Error('O cronograma não possui atividades.');
  return {
    version: 1,
    studentName: cleanString(input.studentName, 180),
    createdByUser: Boolean(input.createdByUser),
    creatorName: cleanString(input.creatorName || input.studentName, 180),
    goal: cleanString(input.goal, 300),
    examDate: cleanString(input.examDate, 20),
    startDate: cleanString(input.startDate, 20),
    endDate: cleanString(input.endDate, 20),
    hoursPerDay: Math.max(0, Math.min(24, Number(input.hoursPerDay) || 0)),
    scheduleStyle: cleanString(input.scheduleStyle, 40),
    subjects: Array.isArray(input.subjects) ? input.subjects.slice(0, 80).map(s => ({
      name: cleanString(s?.name, 220),
      priority: Number(s?.priority) || 0,
      level: cleanString(s?.level, 40)
    })) : [],
    tasks,
    createdAt: new Date().toISOString(),
    brand: 'Professor Lucas MPC'
  };
}

function createId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return [...bytes].map(byte => alphabet[byte % alphabet.length]).join('');
}

export default async (req) => {
  const url = new URL(req.url);
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });

  if (req.method === 'GET') {
    const id = cleanString(url.searchParams.get('id'), 20).toUpperCase();
    if (!ID_RE.test(id)) return json({ error: 'Link de cronograma inválido.' }, 400);
    const plan = await store.get(id, { type: 'json', consistency: 'strong' });
    if (!plan) return json({ error: 'Cronograma não encontrado.' }, 404);
    return json(plan, 200);
  }

  if (req.method === 'POST') {
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ error: 'Cronograma grande demais para publicação.' }, 413);

    let body;
    try {
      const raw = await req.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
        return json({ error: 'Cronograma grande demais para publicação.' }, 413);
      }
      body = JSON.parse(raw);
    } catch {
      return json({ error: 'Dados inválidos.' }, 400);
    }

    let plan;
    try {
      plan = sanitizePlan(body);
    } catch (error) {
      return json({ error: error.message || 'Cronograma inválido.' }, 400);
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const id = createId();
      try {
        await store.setJSON(id, plan, { onlyIfNew: true, metadata: { createdAt: plan.createdAt } });
        return json({ id, path: `/plano/${id}` }, 201);
      } catch (error) {
        if (attempt === 4) throw error;
      }
    }
  }

  return json({ error: 'Método não permitido.' }, 405);
};

export const config = {
  path: '/api/plans'
};
