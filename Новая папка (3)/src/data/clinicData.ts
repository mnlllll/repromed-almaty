import type { ClinicBranch, ClinicService, DoctorProfile } from '../types/clinic';

export const REPROMED_CONTACTS = {
  clinicName: 'Медицинский центр Репро-Мед',
  city: 'Алматы',
  address: 'проспект Райымбека, 150, 1-й этаж',
  foundedYear: 2009,
  instagramHandle: '@repro.med',
  instagramUrl: 'https://www.instagram.com/repro.med/',
  taplinkUrl: 'https://taplink.cc/repro.med',
  whatsappDisplay: '+7 (701) 760-85-20',
  whatsappDigits: '77017608520',
  registryDisplay: '+7 (701) 760-85-20',
  registryHref: 'tel:+77017608520',
  mobileDisplay: '+7 (705) 148-62-08',
  mobileHref: 'tel:+77051486208',
  altMobileDisplay: '+7 (701) 760-85-40',
  altMobileHref: 'tel:+77017608540',
  dgisFirmId: '9429940000850084',
  dgisFirmUrl: 'https://2gis.kz/almaty/firm/9429940000850084',
  dgisReviewsUrl: 'https://2gis.kz/almaty/firm/9429940000850084/tab/reviews',
  dgisWidgetUrl:
    'https://widgets.2gis.com/widget?type=firmsonmap&options=%7B%22pos%22%3A%7B%22lat%22%3A43.26957%2C%22lon%22%3A76.937428%2C%22zoom%22%3A16%7D%2C%22opt%22%3A%7B%22city%22%3A%22almaty%22%7D%2C%22org%22%3A%229429940000850084%22%7D',
};

export function buildWhatsAppUrl(digits: string, message: string): string {
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const CLINIC_BRANCHES: ClinicBranch[] = [
  {
    id: 'reproduction',
    city: 'Алматы · пр. Райымбека, 150',
    name: 'Медицинский центр Репро-Мед',
    address: 'г. Алматы, проспект Райымбека, 150, 1-й этаж',
    hours: 'Пн–Вс: 08:00–20:00 (процедурный кабинет без выходных и перерыва)',
    phoneDisplay: '+7 (701) 760-85-20',
    phoneHref: 'tel:+77017608520',
    whatsappDigits: '77017608520',
    coordinatesLabel: 'пр. Райымбека, 150 · 1-й этаж',
  },
];

export const CLINIC_SERVICES: ClinicService[] = [
  {
    id: 'srv-ultrasound-all',
    code: '01',
    category: 'ultrasound',
    categoryLabel: 'Все виды УЗИ',
    title: 'Все виды УЗИ',
    subtitle:
      'Все виды УЗИ: органы малого таза, УЗИ простаты, УЗИ при беременности (в том числе все три скрининга), щитовидная железа, брюшная полость и почки.',
    durationMinutes: 30,
    priceKzt: 9000,
    priceFrom: true,
    includes: [
      'УЗИ простаты, малого таза и внутренних органов',
      'УЗИ при беременности, в том числе все три скрининга',
      'Заключение и снимки сразу после приема',
    ],
  },
  {
    id: 'srv-gynecology',
    code: '02',
    category: 'gynecology',
    categoryLabel: 'Гинекология',
    title: 'Прием гинеколога',
    subtitle: 'Лечение ИППП, введение и удаление ВМС, медикаментозный аборт и так далее...',
    durationMinutes: 40,
    priceKzt: 10000,
    priceFrom: true,
    includes: [],
  },
  {
    id: 'srv-biopsy-fast',
    code: '03',
    category: 'biopsy_genetics',
    categoryLabel: 'ИПД · Биопсия плода',
    title: 'Биопсия плода (результат в тот же день)',
    subtitle:
      'Инвазивная пренатальная диагностика (ИПД) и биопсия плода под УЗИ-контролем с выдачей результата в тот же день.',
    durationMinutes: 35,
    priceKzt: 64000,
    includes: [
      'Результат готов в тот же день',
      'Проведение под УЗИ-навигацией',
      'Консультация специалиста по итогам диагностики',
    ],
  },
  {
    id: 'srv-karyotype',
    code: '04',
    category: 'biopsy_genetics',
    categoryLabel: 'Генетика · 3–5 дней',
    title: 'Кариотипирование супружеских пар (результат 3–5 дней)',
    subtitle:
      'Цитогенетический анализ хромосомного набора супружеских пар при планировании беременности и оценке генетических рисков.',
    durationMinutes: 25,
    priceKzt: 16500,
    includes: [
      'Готовность результата за 3–5 дней',
      'Расшифровка у врача-генетика (стаж 25+ лет)',
      'Оценка генетических рисков для пары',
    ],
  },
  {
    id: 'srv-procedures-massage',
    code: '05',
    category: 'procedures_massage',
    categoryLabel: 'Процедурный кабинет и массаж',
    title: 'Процедурный кабинет (без выходных и перерыва) и массаж',
    subtitle:
      'Внутривенные капельницы, инъекции, забор анализов и массаж. Работаем ежедневно с понедельника по воскресенье с 08:00 до 20:00.',
    durationMinutes: 30,
    priceKzt: 350,
    priceFrom: true,
    includes: [
      'Пн–Вс: с 08:00 до 20:00, без выходных и перерыва',
      'Стерильный процедурный блок и опытные медсестры',
      'Забор анализов и курсовые процедуры',
    ],
  },
];

export const CLINIC_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-ayapova',
    name: 'Аяпова Сауле Калкамановна',
    role: 'Врач-генетик высшей категории · Кариотипирование и ИПД',
    specialtyKey: 'genetics',
    experienceYears: 25,
    rating: 5.0,
    reviewsCount: 184,
    isTop: true,
    branchId: 'reproduction',
    branchCity: 'Алматы · пр. Райымбека, 150',
    priceKzt: 12000,
    nearestSlot: 'Сегодня, 14:30',
    education: 'Стаж более 25 лет · Эксперт по кариотипированию (3–5 дней) и биопсии плода',
    availableSlots: ['10:00', '11:30', '14:30', '16:00', '17:30'],
  },
  {
    id: 'doc-baibossynova',
    name: 'Байбосынова Марьям Бежановна',
    role: 'Акушер-гинеколог высшей категории',
    specialtyKey: 'gynecology',
    experienceYears: 22,
    rating: 5.0,
    reviewsCount: 215,
    isTop: true,
    branchId: 'reproduction',
    branchCity: 'Алматы · пр. Райымбека, 150',
    priceKzt: 10000,
    nearestSlot: 'Сегодня, 15:30',
    education: 'Стаж более 20 лет · Лечение ИППП, ВМС, гинекологический прием',
    availableSlots: ['09:30', '11:00', '15:30', '17:00', '18:30'],
  },
  {
    id: 'doc-sailaukhan',
    name: 'Сайлаухан Гульназ Сайлауханкызы',
    role: 'Акушер-гинеколог, специалист УЗИ',
    specialtyKey: 'ultrasound',
    experienceYears: 10,
    experienceLabel: '10+ лет',
    rating: 5.0,
    reviewsCount: 167,
    isTop: false,
    branchId: 'reproduction',
    branchCity: 'Алматы · пр. Райымбека, 150',
    priceKzt: 10000,
    nearestSlot: 'Завтра, 10:30',
    education: 'Стаж 10+ лет · Все виды УЗИ, гинекология',
    availableSlots: ['10:30', '12:30', '15:00', '17:15'],
  },
];

export const PATIENT_REVIEWS = [
  {
    id: 'rev-1',
    author: 'Айгуль и Марат С.',
    city: 'Алматы · пр. Райымбека, 150',
    program: 'Кариотипирование супружеских пар · 3–5 дней',
    date: 'Октябрь 2026',
    doctor: 'Аяпова С. К.',
    text: 'Обратились в Репро-Мед на Райымбека, 150. Кариотипирование сделали быстро, Сауле Калкамановна подробно все разъяснила. Цены действительно выгодные, а push-напоминания о визите помогают не забыть о приеме.',
  },
  {
    id: 'rev-2',
    author: 'Камилла Т.',
    city: 'Алматы · пр. Райымбека, 150',
    program: 'Биопсия плода (в тот же день) + УЗИ',
    date: 'Сентябрь 2026',
    doctor: 'Байбосынова М. Б.',
    text: 'Очень переживала перед процедурой ИПД, но здесь результат выдали уже в тот же день, без недель ожидания. Записалась через WhatsApp за пять минут, все четко по времени.',
  },
  {
    id: 'rev-3',
    author: 'Динара К.',
    city: 'Алматы · пр. Райымбека, 150',
    program: 'Все виды УЗИ + Процедурный кабинет и массаж',
    date: 'Август 2026',
    doctor: 'Сайлаухан Г. С.',
    text: 'Проходила УЗИ всех органов, курс капельниц и массаж — очень удобно, что процедурный кабинет работает с 08:00 до 20:00 ежедневно без выходных и перерыва.',
  },
];

export function formatKzt(amount: number, priceFrom?: boolean): string {
  const formatted = `${new Intl.NumberFormat('ru-KZ').format(amount)} ₸`;
  return priceFrom ? `от ${formatted}` : formatted;
}
