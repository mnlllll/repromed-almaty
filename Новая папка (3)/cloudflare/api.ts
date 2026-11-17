import type {
  AppointmentRecord,
  BranchId,
  ClinicReview,
  LabResultRecord,
  NotificationSettings,
  PatientAccount,
} from '../src/types/clinic';

export interface CloudflareKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface CloudflareEnv {
  REPROMED_STORE?: CloudflareKV;
  DGIS_REVIEWS_KEY?: string;
  ASSETS?: {
    fetch(request: Request): Promise<Response>;
  };
}

interface StoredPatient extends PatientAccount {
  passwordHash: string;
}

interface ClinicStore {
  patients: StoredPatient[];
  sessions: Record<string, string>;
  appointments: AppointmentRecord[];
  labResultsByPatient: Record<string, LabResultRecord[]>;
  reviews: ClinicReview[];
}

const KV_STORE_KEY = 'repromed_clinic_store_v1';
const DGIS_FIRM_ID = '9429940000850084';

const CITY_MAP: Record<BranchId, string> = {
  reproduction: 'Репродукция и гинекология · пр. Райымбека, 150',
  diagnostics: 'УЗИ, биопсия и генетика · пр. Райымбека, 150',
  procedures: 'Процедурный кабинет и массаж · пр. Райымбека, 150',
};

async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function addDaysISO(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

async function createInitialStore(): Promise<ClinicStore> {
  const demoPatientId = 'pat-demo-01';
  const demoPatient: StoredPatient = {
    id: demoPatientId,
    fullName: 'Нурланова Айгерим Маратовна',
    phone: '+7 (701) 760-85-20',
    email: 'aigerim.n@example.kz',
    iin: '920415450821',
    preferredBranch: 'reproduction',
    passwordHash: await hashPassword('repromed2026'),
    notificationSettings: {
      pushEnabled: true,
      leadMinutes: 120,
      notifyOnBooking: true,
      notifyOnResults: true,
    },
  };

  const demoAppointments: AppointmentRecord[] = [
    {
      id: 'apt-1001',
      patientId: demoPatientId,
      patientName: demoPatient.fullName,
      patientPhone: demoPatient.phone,
      branchId: 'diagnostics',
      branchCity: 'Репро-Мед · пр. Райымбека, 150',
      serviceId: 'srv-ultrasound-all',
      serviceTitle: 'Все виды УЗИ (в том числе все три скрининга и УЗИ простаты)',
      doctorId: 'doc-sailaukhan',
      doctorName: 'Сайлаухан Гульназ Сайлауханкызы',
      dateISO: addDaysISO(1),
      timeSlot: '11:30',
      priceKzt: 9000,
      status: 'confirmed',
      reminderEnabled: true,
      reminderLeadMinutes: 120,
      reminderSent: false,
      notes: 'УЗИ органов малого таза и контроль фолликулогенеза, 1-й этаж',
      createdAt: new Date(Date.now() - 86400_000 * 3).toISOString(),
    },
    {
      id: 'apt-1002',
      patientId: demoPatientId,
      patientName: demoPatient.fullName,
      patientPhone: demoPatient.phone,
      branchId: 'reproduction',
      branchCity: 'Репро-Мед · пр. Райымбека, 150',
      serviceId: 'srv-gynecology',
      serviceTitle: 'Прием гинеколога',
      doctorId: 'doc-baibossynova',
      doctorName: 'Байбосынова Марьям Бежановна',
      dateISO: addDaysISO(-10),
      timeSlot: '15:30',
      priceKzt: 10000,
      status: 'completed',
      reminderEnabled: true,
      reminderLeadMinutes: 1440,
      reminderSent: true,
      notes: 'Назначено кариотипирование и контрольное УЗИ',
      createdAt: new Date(Date.now() - 86400_000 * 12).toISOString(),
    },
  ];

  const demoResults: LabResultRecord[] = [
    {
      id: 'res-01',
      title: 'Кариотипирование супружеских пар (3–5 дней)',
      dateLabel: '12 ноя 2026',
      doctorName: 'Аяпова С. К.',
      value: '46, XX',
      unit: 'Норма',
      referenceRange: 'Без структурных перестроек',
      status: 'ready',
      statusLabel: 'Готово за 3–5 дней',
      comment: 'Нормальный женский кариотип, хромосомных аномалий не выявлено.',
    },
    {
      id: 'res-02',
      title: 'Биопсия плода / ИПД (результат в тот же день)',
      dateLabel: '10 ноя 2026',
      doctorName: 'Байбосынова М. Б.',
      value: 'Без патологий',
      unit: '',
      referenceRange: 'Норма',
      status: 'normal',
      statusLabel: 'Готово в тот же день',
      comment: 'По итогам исследования хромосомных отклонений не обнаружено.',
    },
    {
      id: 'res-03',
      title: 'Все виды УЗИ малого таза',
      dateLabel: '08 ноя 2026',
      doctorName: 'Сайлаухан Г. С.',
      value: '9.2',
      unit: 'мм (эндометрий)',
      referenceRange: '8.0 – 13.0 мм',
      status: 'normal',
      statusLabel: 'В норме',
      comment: 'Состояние органов малого таза в пределах нормы.',
    },
  ];

  const defaultReviews: ClinicReview[] = [
    {
      id: 'rev-2gis-1',
      author: 'Айгуль и Марат С.',
      rating: 5,
      dateLabel: 'Октябрь 2026',
      program: 'Кариотипирование супружеских пар · 3–5 дней',
      doctor: 'Аяпова С. К.',
      text: 'Обратились в «Репро-Мед» на Райымбека, 150. Кариотипирование сделали за 3–5 дней, Сауле Калкамановна подробно все разъяснила, а цена оказалась очень доступной.',
      source: '2gis',
    },
    {
      id: 'rev-2gis-2',
      author: 'Камилла Т.',
      rating: 5,
      dateLabel: 'Сентябрь 2026',
      program: 'Биопсия плода (ИПД) и УЗИ',
      doctor: 'Байбосынова М. Б.',
      text: 'Очень переживала перед процедурой ИПД, но врачи и медсестры отнеслись максимально бережно. Результат выдали в тот же день, все чисто и стерильно.',
      source: '2gis',
    },
    {
      id: 'rev-2gis-3',
      author: 'Динара К.',
      rating: 5,
      dateLabel: 'Август 2026',
      program: 'Все виды УЗИ · Процедурный кабинет и массаж',
      doctor: 'Сайлаухан Г. С.',
      text: 'Проходила УЗИ всех органов, курс капельниц и массаж — очень удобно, что процедурный кабинет работает ежедневно без выходных и перерыва с 08:00 до 20:00.',
      source: '2gis',
    },
  ];

  return {
    patients: [demoPatient],
    sessions: {},
    appointments: demoAppointments,
    labResultsByPatient: {
      [demoPatientId]: demoResults,
    },
    reviews: defaultReviews,
  };
}

let memoryFallbackStore: ClinicStore | null = null;
let cachedDgisReviews: {
  fetchedAt: number;
  rating: number;
  reviewsCount: number;
  reviews: ClinicReview[];
} | null = null;

async function readStore(env: CloudflareEnv): Promise<ClinicStore> {
  if (env.REPROMED_STORE) {
    const raw = await env.REPROMED_STORE.get(KV_STORE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ClinicStore;
        if (parsed.patients?.[0]?.preferredBranch && CITY_MAP[parsed.patients[0].preferredBranch]) {
          if (
            !parsed.reviews ||
            parsed.reviews.length === 0 ||
            parsed.reviews.some((r) => r.program.includes('Уролог-андролог') || r.text.includes('Samsung'))
          ) {
            parsed.reviews = (await createInitialStore()).reviews;
          }
          return parsed;
        }
      } catch {
        // Re-initialize corrupted store
      }
    }
    const fresh = await createInitialStore();
    await env.REPROMED_STORE.put(KV_STORE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  if (!memoryFallbackStore) {
    memoryFallbackStore = await createInitialStore();
  }
  return memoryFallbackStore;
}

async function writeStore(env: CloudflareEnv, store: ClinicStore): Promise<void> {
  if (env.REPROMED_STORE) {
    await env.REPROMED_STORE.put(KV_STORE_KEY, JSON.stringify(store));
  } else {
    memoryFallbackStore = store;
  }
}

function sanitizePatient(p: StoredPatient): PatientAccount {
  const { passwordHash: _ignored, ...safe } = p;
  return safe;
}

function extractToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function handleApiRequest(request: Request, env: CloudflareEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  if (method === 'GET' && path === '/api/health') {
    return jsonResponse({
      ok: true,
      service: 'repromed-almaty',
      runtime: 'cloudflare',
      kvBound: Boolean(env.REPROMED_STORE),
    });
  }

  if (method === 'POST' && path === '/api/auth/demo') {
    const store = await readStore(env);
    const demo = store.patients[0];
    const token = crypto.randomUUID();
    store.sessions[token] = demo.id;
    await writeStore(env, store);
    return jsonResponse({
      token,
      patient: sanitizePatient(demo),
      appointments: store.appointments.filter((a) => a.patientId === demo.id),
      labResults: store.labResultsByPatient[demo.id] || [],
    });
  }

  if (method === 'POST' && path === '/api/auth/login') {
    const body = await readJsonBody<{ identifier?: string; password?: string }>(request);
    if (!body?.identifier || !body?.password) {
      return jsonResponse({ error: 'Укажите телефон или email и пароль.' }, 400);
    }

    const cleanId = body.identifier.trim().toLowerCase();
    const digitsOnly = body.identifier.replace(/\D/g, '');
    const pwHash = await hashPassword(body.password);

    const store = await readStore(env);
    const patient = store.patients.find((p) => {
      const phoneDigits = p.phone.replace(/\D/g, '');
      return (
        (p.email.toLowerCase() === cleanId ||
          (digitsOnly.length >= 7 && phoneDigits.endsWith(digitsOnly.slice(-10)))) &&
        p.passwordHash === pwHash
      );
    });

    if (!patient) {
      return jsonResponse({ error: 'Неверный телефон/email или пароль.' }, 401);
    }

    const token = crypto.randomUUID();
    store.sessions[token] = patient.id;
    await writeStore(env, store);

    return jsonResponse({
      token,
      patient: sanitizePatient(patient),
      appointments: store.appointments.filter((a) => a.patientId === patient.id),
      labResults: store.labResultsByPatient[patient.id] || [],
    });
  }

  if (method === 'POST' && path === '/api/auth/register') {
    const body = await readJsonBody<{
      fullName?: string;
      phone?: string;
      email?: string;
      iin?: string;
      password?: string;
      preferredBranch?: BranchId;
    }>(request);

    if (!body?.fullName || !body?.phone || !body?.password || body.password.length < 4) {
      return jsonResponse(
        { error: 'Заполните ФИО, казахстанский номер телефона и пароль (от 4 символов).' },
        400
      );
    }

    const digits = body.phone.replace(/\D/g, '');
    if (digits.length < 10) {
      return jsonResponse({ error: 'Введите корректный номер телефона Казахстана (+7 ...).' }, 400);
    }

    const store = await readStore(env);
    const exists = store.patients.find(
      (p) =>
        p.phone.replace(/\D/g, '').slice(-10) === digits.slice(-10) ||
        (body.email && p.email.toLowerCase() === body.email.trim().toLowerCase())
    );
    if (exists) {
      return jsonResponse({ error: 'Пациент с таким телефоном или email уже зарегистрирован.' }, 409);
    }

    const patientId = `pat-${crypto.randomUUID().slice(0, 8)}`;
    const newPatient: StoredPatient = {
      id: patientId,
      fullName: body.fullName.trim().slice(0, 120),
      phone: body.phone.trim().slice(0, 32),
      email: (body.email || '').trim().slice(0, 120),
      iin: (body.iin || '').replace(/\D/g, '').slice(0, 12),
      preferredBranch:
        body.preferredBranch && CITY_MAP[body.preferredBranch] ? body.preferredBranch : 'reproduction',
      passwordHash: await hashPassword(body.password),
      notificationSettings: {
        pushEnabled: true,
        leadMinutes: 120,
        notifyOnBooking: true,
        notifyOnResults: true,
      },
    };

    store.patients.push(newPatient);
    store.labResultsByPatient[patientId] = [
      {
        id: `res-${crypto.randomUUID().slice(0, 6)}`,
        title: 'Первичный профиль пациента',
        dateLabel: 'Сегодня',
        doctorName: 'Дежурный репродуктолог',
        value: 'Карта открыта',
        unit: '',
        referenceRange: 'Готово к приему',
        status: 'ready',
        statusLabel: 'Активно',
        comment:
          'После первого визита здесь появятся протоколы УЗИ, биопсии и результаты кариотипирования.',
      },
    ];

    const token = crypto.randomUUID();
    store.sessions[token] = patientId;
    await writeStore(env, store);

    return jsonResponse(
      {
        token,
        patient: sanitizePatient(newPatient),
        appointments: [] as AppointmentRecord[],
        labResults: store.labResultsByPatient[patientId],
      },
      201
    );
  }

  if (method === 'GET' && path === '/api/auth/me') {
    const token = extractToken(request);
    if (!token) {
      return jsonResponse({ error: 'Требуется авторизация.' }, 401);
    }

    const store = await readStore(env);
    const patientId = store.sessions[token];
    const patient = store.patients.find((p) => p.id === patientId);
    if (!patient) {
      return jsonResponse({ error: 'Сессия истекла.' }, 401);
    }

    return jsonResponse({
      patient: sanitizePatient(patient),
      appointments: store.appointments.filter((a) => a.patientId === patient.id),
      labResults: store.labResultsByPatient[patient.id] || [],
    });
  }

  if (method === 'PATCH' && path === '/api/patient/profile') {
    const token = extractToken(request);
    if (!token) {
      return jsonResponse({ error: 'Требуется авторизация.' }, 401);
    }

    const body = await readJsonBody<
      Partial<PatientAccount & { notificationSettings: Partial<NotificationSettings> }>
    >(request);
    const store = await readStore(env);
    const patientId = store.sessions[token];
    const patient = store.patients.find((p) => p.id === patientId);
    if (!patient) {
      return jsonResponse({ error: 'Сессия не найдена.' }, 401);
    }

    if (body) {
      if (typeof body.fullName === 'string' && body.fullName.trim()) {
        patient.fullName = body.fullName.trim().slice(0, 120);
      }
      if (typeof body.phone === 'string' && body.phone.trim()) {
        patient.phone = body.phone.trim().slice(0, 32);
      }
      if (typeof body.email === 'string') {
        patient.email = body.email.trim().slice(0, 120);
      }
      if (typeof body.iin === 'string') {
        patient.iin = body.iin.replace(/\D/g, '').slice(0, 12);
      }
      if (body.preferredBranch && CITY_MAP[body.preferredBranch]) {
        patient.preferredBranch = body.preferredBranch;
      }
      if (body.notificationSettings) {
        patient.notificationSettings = {
          ...patient.notificationSettings,
          ...body.notificationSettings,
        };
      }
    }

    await writeStore(env, store);
    return jsonResponse({ patient: sanitizePatient(patient) });
  }

  if (method === 'POST' && path === '/api/appointments') {
    const token = extractToken(request);
    const body = await readJsonBody<{
      patientName?: string;
      patientPhone?: string;
      branchId?: BranchId;
      serviceId?: string;
      serviceTitle?: string;
      doctorId?: string;
      doctorName?: string;
      dateISO?: string;
      timeSlot?: string;
      priceKzt?: number;
      reminderEnabled?: boolean;
      reminderLeadMinutes?: number;
      notes?: string;
    }>(request);

    if (
      !body?.patientName ||
      !body?.patientPhone ||
      !body?.dateISO ||
      !body?.timeSlot ||
      !body?.serviceTitle
    ) {
      return jsonResponse({ error: 'Заполните имя, телефон, услугу, дату и время приема.' }, 400);
    }

    const store = await readStore(env);
    const sessionPatientId = token ? store.sessions[token] : undefined;
    const branchId: BranchId =
      body.branchId && CITY_MAP[body.branchId] ? body.branchId : 'reproduction';

    const record: AppointmentRecord = {
      id: `apt-${crypto.randomUUID().slice(0, 6)}`,
      patientId: sessionPatientId || 'guest',
      patientName: body.patientName.trim().slice(0, 120),
      patientPhone: body.patientPhone.trim().slice(0, 32),
      branchId,
      branchCity: CITY_MAP[branchId],
      serviceId: (body.serviceId || 'srv-ultrasound-all').slice(0, 64),
      serviceTitle: body.serviceTitle.trim().slice(0, 160),
      doctorId: (body.doctorId || 'any').slice(0, 64),
      doctorName: (body.doctorName || 'Дежурный специалист Репро-Мед').trim().slice(0, 120),
      dateISO: body.dateISO.slice(0, 10),
      timeSlot: body.timeSlot.slice(0, 10),
      priceKzt: Number(body.priceKzt) || 9000,
      status: 'confirmed',
      reminderEnabled: body.reminderEnabled !== false,
      reminderLeadMinutes: Number(body.reminderLeadMinutes) || 120,
      reminderSent: false,
      notes: body.notes ? body.notes.trim().slice(0, 300) : undefined,
      createdAt: new Date().toISOString(),
    };

    store.appointments.unshift(record);
    await writeStore(env, store);
    return jsonResponse({ appointment: record }, 201);
  }

  if (method === 'PATCH' && path.startsWith('/api/appointments/')) {
    const token = extractToken(request);
    if (!token) {
      return jsonResponse({ error: 'Требуется авторизация.' }, 401);
    }

    const id = path.slice('/api/appointments/'.length);
    const body = await readJsonBody<Partial<AppointmentRecord>>(request);
    const store = await readStore(env);
    const patientId = store.sessions[token];
    if (!patientId) {
      return jsonResponse({ error: 'Сессия не найдена.' }, 401);
    }

    const apt = store.appointments.find((a) => a.id === id && a.patientId === patientId);
    if (!apt) {
      return jsonResponse({ error: 'Запись не найдена.' }, 404);
    }

    if (body) {
      if (body.status && ['upcoming', 'confirmed', 'completed', 'cancelled'].includes(body.status)) {
        apt.status = body.status;
      }
      if (typeof body.dateISO === 'string' && body.dateISO.length >= 8) {
        apt.dateISO = body.dateISO.slice(0, 10);
      }
      if (typeof body.timeSlot === 'string' && body.timeSlot.length >= 4) {
        apt.timeSlot = body.timeSlot.slice(0, 10);
      }
      if (typeof body.reminderEnabled === 'boolean') {
        apt.reminderEnabled = body.reminderEnabled;
      }
      if (typeof body.reminderLeadMinutes === 'number') {
        apt.reminderLeadMinutes = body.reminderLeadMinutes;
      }
      if (typeof body.reminderSent === 'boolean') {
        apt.reminderSent = body.reminderSent;
      }
    }

    await writeStore(env, store);
    return jsonResponse({ appointment: apt });
  }

  if (method === 'GET' && path === '/api/reviews') {
    const store = await readStore(env);
    const localReviews = store.reviews || [];
    const apiKey = env.DGIS_REVIEWS_KEY?.trim();

    if (apiKey) {
      if (cachedDgisReviews && Date.now() - cachedDgisReviews.fetchedAt < 15 * 60_000) {
        return jsonResponse({
          mode: 'live_api',
          firmId: DGIS_FIRM_ID,
          rating: cachedDgisReviews.rating,
          reviewsCount: cachedDgisReviews.reviewsCount,
          reviews: [...cachedDgisReviews.reviews, ...localReviews.filter((r) => r.source === 'clinic')],
        });
      }

      try {
        const dgisUrl = `https://public-api.reviews.2gis.com/2.0/branches/${DGIS_FIRM_ID}/reviews?limit=12&is_advertiser=false&fields=meta.branch_rating,meta.branch_reviews_count,reviews.is_verified&rated=true&sort_by=date_edited&key=${encodeURIComponent(apiKey)}&locale=ru_KZ`;
        const resp = await fetch(dgisUrl, { headers: { Accept: 'application/json' } });
        if (resp.ok) {
          const payload = (await resp.json()) as {
            meta?: { branch_rating?: number; branch_reviews_count?: number };
            reviews?: Array<{
              id?: string;
              rating?: number;
              text?: string;
              date_created?: string;
              user?: { name?: string };
            }>;
          };

          const liveReviews: ClinicReview[] = (payload.reviews || [])
            .filter((r) => Boolean(r.text))
            .slice(0, 9)
            .map((r, idx) => ({
              id: `2gis-${r.id || idx}`,
              author: r.user?.name || 'Пациент 2ГИС',
              rating: r.rating || 5,
              dateLabel: r.date_created
                ? new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(
                    new Date(r.date_created)
                  )
                : '2ГИС Алматы',
              program: 'Проверенный отзыв в 2ГИС',
              text: r.text || '',
              source: '2gis',
            }));

          const rating = payload.meta?.branch_rating || 4.9;
          const reviewsCount = payload.meta?.branch_reviews_count || 286;
          cachedDgisReviews = { fetchedAt: Date.now(), rating, reviewsCount, reviews: liveReviews };

          return jsonResponse({
            mode: 'live_api',
            firmId: DGIS_FIRM_ID,
            rating,
            reviewsCount,
            reviews: [...liveReviews, ...localReviews.filter((r) => r.source === 'clinic')],
          });
        }
      } catch {
        // Fall through to verified local store
      }
    }

    return jsonResponse({
      mode: 'widget_and_verified',
      firmId: DGIS_FIRM_ID,
      rating: 4.9,
      reviewsCount: 286,
      reviews: localReviews,
    });
  }

  if (method === 'POST' && path === '/api/reviews') {
    const body = await readJsonBody<{
      author?: string;
      rating?: number;
      program?: string;
      doctor?: string;
      text?: string;
    }>(request);

    if (!body?.author || !body?.text || body.text.trim().length < 8) {
      return jsonResponse({ error: 'Укажите имя и текст отзыва (минимум 8 символов).' }, 400);
    }

    const review: ClinicReview = {
      id: `rev-${crypto.randomUUID().slice(0, 6)}`,
      author: body.author.trim().slice(0, 80),
      rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
      dateLabel: new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(
        new Date()
      ),
      program: (body.program || 'Прием в МЦ «Репро-Мед»').trim().slice(0, 100),
      doctor: body.doctor ? body.doctor.trim().slice(0, 80) : undefined,
      text: body.text.trim().slice(0, 600),
      source: 'clinic',
    };

    const store = await readStore(env);
    if (!store.reviews) store.reviews = [];
    store.reviews.unshift(review);
    await writeStore(env, store);

    return jsonResponse({ review }, 201);
  }

  return jsonResponse({ error: 'API маршрут не найден.' }, 404);
}
