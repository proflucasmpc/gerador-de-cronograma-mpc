import { getStore } from '@netlify/blobs';

const STORE_NAME = 'mpc-public-plans';
const MAX_BODY_BYTES = 900_000;
const ID_RE = /^[A-Z0-9]{10}$/;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function cleanString(value, max = 500) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

function cleanMultiline(value, max = 16000) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, max);
}

function cleanRoutineWindow(window = {}) {
  return {
    moment: cleanString(window.moment, 120),
    time: cleanString(window.time, 10),
    duration: Math.max(5, Math.min(240, Number(window.duration) || 30)),
    environment: cleanString(window.environment, 80),
    types: Array.isArray(window.types) ? window.types.slice(0, 12).map(type => cleanString(type, 80)).filter(Boolean) : [],
    videoOnly: Boolean(window.videoOnly)
  };
}

function cleanStudyRoutine(input) {
  if (!input || typeof input !== 'object') return null;
  const mode = ['continuous', 'fragmented', '12x36', 'custom'].includes(input.mode) ? input.mode : 'continuous';
  return {
    mode,
    referenceDate: cleanString(input.referenceDate, 20),
    referenceStatus: input.referenceStatus === 'off' ? 'off' : 'work',
    windows: Array.isArray(input.windows) ? input.windows.slice(0, 30).map(cleanRoutineWindow) : [],
    workWindows: Array.isArray(input.workWindows) ? input.workWindows.slice(0, 30).map(cleanRoutineWindow) : [],
    offWindows: Array.isArray(input.offWindows) ? input.offWindows.slice(0, 30).map(cleanRoutineWindow) : []
  };
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
    notes: cleanString(task.notes, 500),
    done: Boolean(task.done)
  };
}

function sanitizePlan(input = {}) {
  const tasks = Array.isArray(input.tasks) ? input.tasks.slice(0, 1600).map(cleanTask) : [];
  if (!tasks.length) throw new Error('O cronograma não possui atividades.');
  return {
    version: 4,
    studentName: cleanString(input.studentName, 180),
    createdByUser: Boolean(input.createdByUser),
    creatorName: cleanString(input.creatorName || input.studentName, 180),
    goal: cleanString(input.goal, 300),
    examDate: cleanString(input.examDate, 20),
    startDate: cleanString(input.startDate, 20),
    endDate: cleanString(input.endDate, 20),
    hoursPerDay: Math.max(0, Math.min(24, Number(input.hoursPerDay) || 0)),
    scheduleStyle: cleanString(input.scheduleStyle, 40),
    generalGuidance: cleanMultiline(input.generalGuidance, 16000),
    studyRoutine: cleanStudyRoutine(input.studyRoutine),
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

function createRandomToken(length = 32) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map(byte => alphabet[byte % alphabet.length]).join('');
}

function createId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return [...bytes].map(byte => alphabet[byte % alphabet.length]).join('');
}

async function hashManageKey(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function publicPlan(plan = {}) {
  const { _manageHash, ...safe } = plan;
  return safe;
}

async function parseBody(req) {
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    const error = new Error('Cronograma grande demais para publicação.');
    error.status = 413;
    throw error;
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    const error = new Error('Cronograma grande demais para publicação.');
    error.status = 413;
    throw error;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('Dados inválidos.');
    error.status = 400;
    throw error;
  }
}

async function authorizeManagement(req, plan) {
  if (!plan?._manageHash) {
    return {
      ok: false,
      status: 409,
      error: 'Esta página foi publicada antes do gerenciamento seguro. Crie uma nova publicação uma vez para habilitar atualização e exclusão.'
    };
  }

  const key = cleanString(req.headers.get('x-plan-key'), 120);
  if (!key) return { ok: false, status: 401, error: 'Chave de gerenciamento ausente.' };

  const hash = await hashManageKey(key);
  if (hash !== plan._manageHash) return { ok: false, status: 403, error: 'Chave de gerenciamento inválida.' };
  return { ok: true };
}

export default async (req) => {
  const url = new URL(req.url);
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });
  const method = req.method.toUpperCase();

  if (method === 'GET') {
    const id = cleanString(url.searchParams.get('id'), 20).toUpperCase();
    if (!ID_RE.test(id)) return json({ error: 'Link de cronograma inválido.' }, 400);
    const plan = await store.get(id, { type: 'json', consistency: 'strong' });
    if (!plan) return json({ error: 'Cronograma não encontrado.' }, 404);
    return json(publicPlan(plan), 200);
  }

  if (method === 'POST') {
    let body;
    try {
      body = await parseBody(req);
    } catch (error) {
      return json({ error: error.message || 'Dados inválidos.' }, error.status || 400);
    }

    let plan;
    try {
      plan = sanitizePlan(body);
    } catch (error) {
      return json({ error: error.message || 'Cronograma inválido.' }, 400);
    }

    const manageKey = createRandomToken(36);
    plan._manageHash = await hashManageKey(manageKey);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const id = createId();
      try {
        await store.setJSON(id, plan, {
          onlyIfNew: true,
          metadata: { createdAt: plan.createdAt }
        });
        return json({ id, path: `/plano/${id}`, manageKey }, 201);
      } catch (error) {
        if (attempt === 4) throw error;
      }
    }
  }

  if (method === 'PUT') {
    const id = cleanString(url.searchParams.get('id'), 20).toUpperCase();
    if (!ID_RE.test(id)) return json({ error: 'Link de cronograma inválido.' }, 400);

    const existing = await store.get(id, { type: 'json', consistency: 'strong' });
    if (!existing) return json({ error: 'Cronograma não encontrado.' }, 404);

    const auth = await authorizeManagement(req, existing);
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    let body;
    try {
      body = await parseBody(req);
    } catch (error) {
      return json({ error: error.message || 'Dados inválidos.' }, error.status || 400);
    }

    let updated;
    try {
      updated = sanitizePlan(body);
    } catch (error) {
      return json({ error: error.message || 'Cronograma inválido.' }, 400);
    }

    updated.createdAt = existing.createdAt || updated.createdAt;
    updated.updatedAt = new Date().toISOString();
    updated._manageHash = existing._manageHash;

    await store.setJSON(id, updated, {
      metadata: {
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      }
    });

    return json({ id, path: `/plano/${id}`, updatedAt: updated.updatedAt }, 200);
  }

  if (method === 'DELETE') {
    const id = cleanString(url.searchParams.get('id'), 20).toUpperCase();
    if (!ID_RE.test(id)) return json({ error: 'Link de cronograma inválido.' }, 400);

    const existing = await store.get(id, { type: 'json', consistency: 'strong' });
    if (!existing) return json({ error: 'Cronograma não encontrado.' }, 404);

    const auth = await authorizeManagement(req, existing);
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    await store.delete(id);
    return json({ id, deleted: true }, 200);
  }

  return json({ error: 'Método não permitido.' }, 405);
};

export const config = {
  path: '/api/plans'
};
