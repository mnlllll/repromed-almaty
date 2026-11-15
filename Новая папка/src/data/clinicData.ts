import clinicLabImg from '../assets/images/clinic_embryology_lab_1794687737378.jpg';
import docReproImg from '../assets/images/doctor_reproductologist_female_1794687737652.jpg';
import docAndroImg from '../assets/images/doctor_andrologist_male_1794687738502.jpg';
import docEmbryoImg from '../assets/images/doctor_embryologist_female_1794687738273.jpg';
import docGynImg from '../assets/images/doctor_gynecologist_female_1794687739425.jpg';

import type { ClinicBranch, ClinicService, DoctorProfile } from '../types/clinic';

export const CLINIC_LAB_IMAGE = clinicLabImg;

export const REPROMED_CONTACTS = {
  clinicName: 'Медицинский центр «Репро-Мед»',
  city: 'Алматы',
  address: 'проспект Райымбека, 150 (уг. ул. Чайковского), 1-й этаж',
  foundedYear: 2009,
  instagramHandle: '@repro.med',
  instagramUrl: 'https://www.instagram.com/repro.med/',
  taplinkUrl: 'https://taplink.cc/repro.med',
  whatsappDisplay: '+7 (701) 760-85-20',
  whatsappDigits: '77017608520',
  registryDisplay: '+7 (727) 233-50-70',
  registryHref: 'tel:+77272335070',
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
    city: 'Репродукция и гинекология',
    name: 'Отделение репродуктологии, гинекологии и андрологии',
    address: 'г. Алматы, проспект Райымбека, 150 (уг. ул. Чайковского)',
    hours: 'Пн–Сб: 08:00–19:00 · Запись по регистратуре',
    phoneDisplay: '+7 (727) 233-50-70',
    phoneHref: 'tel:+77272335070',
    whatsappDigits: '77017608520',
    coordinatesLabel: 'Регистратура · 1-й этаж',
  },
  {
    id: 'diagnostics',
    city: 'УЗИ, биопсия и генетика',
    name: 'Отделение УЗИ (Samsung H-60), биопсии и кариотипирования',
    address: 'г. Алматы, проспект Райымбека, 150, диагностический блок',
    hours: 'Пн–Сб: 08:00–19:00 · Биопсия в день обращения',
    phoneDisplay: '+7 (705) 148-62-08',
    phoneHref: 'tel:+77051486208',
    whatsappDigits: '77017608520',
    coordinatesLabel: 'Кариотип 5 дней · Биопсия 1 день',
  },
  {
    id: 'procedures',
    city: 'Процедурный кабинет и массаж',
    name: 'Процедурный кабинет (инъекции, капельницы) и массаж',
    address: 'г. Алматы, проспект Райымбека, 150, 1-й этаж',
    hours: 'Пн–Сб: 08:00–20:00 · Вс: 08:00–15:00',
    phoneDisplay: '+7 (701) 760-85-40',
    phoneHref: 'tel:+77017608540',
    whatsappDigits: '77017608520',
    coordinatesLabel: 'Без выходных · Забор анализов',
  },
];

export const CLINIC_SERVICES: ClinicService[] = [
  {
    id: 'srv-ultrasound-all',
    code: '01',
    category: 'ultrasound',
    categoryLabel: 'Все виды УЗИ',
    title: 'Экспертное УЗИ (Samsung H-60) и пренатальный скрининг',
    subtitle:
      'Все виды УЗИ: органы малого таза, УЗИ при беременности, скрининг хромосомных патологий, щитовидная железа, почки и суставы.',
    durationMinutes: 30,
    priceKzt: 9000,
    oldPriceKzt: 12000,
    includes: [
      'Аппарат экспертного класса Samsung H-60',
      'Пренатальный скрининг 1–3 триместра',
      'Заключение и снимки сразу после приема',
    ],
  },
  {
    id: 'srv-biopsy-fast',
    code: '02',
    category: 'biopsy_genetics',
    categoryLabel: 'Биопсия · В тот же день',
    title: 'Биопсия (результат готов в тот же день)',
    subtitle:
      'Малоинвазивный забор материала под УЗИ-контролем с ускоренным цитологическим и гистологическим ответом.',
    durationMinutes: 35,
    priceKzt: 22000,
    oldPriceKzt: 26000,
    includes: [
      'Результат в день проведения процедуры',
      'Безболезненный забор под УЗИ-навигацией',
      'Консультация профильного специалиста',
    ],
  },
  {
    id: 'srv-karyotype',
    code: '03',
    category: 'biopsy_genetics',
    categoryLabel: 'Генетика · За 5 дней',
    title: 'Кариотипирование пары и генетика (результат 5 дней)',
    subtitle:
      'Цитогенетический анализ хромосомного набора супругов при планировании беременности, невынашивании и подготовке к ЭКО.',
    durationMinutes: 25,
    priceKzt: 28000,
    oldPriceKzt: 34000,
    includes: [
      'Готовность результата за 5 дней',
      'Расшифровка у генетика со стажем 25+ лет',
      'Оценка генетических рисков для пары',
    ],
  },
  {
    id: 'srv-gynecology',
    code: '04',
    category: 'gynecology',
    categoryLabel: 'Гинекология и репродукция',
    title: 'Прием гинеколога-репродуктолога и сохранение беременности',
    subtitle:
      'Диагностика и лечение бесплодия, коррекция невынашивания беременности, кольпоскопия и индивидуальный план ВРТ.',
    durationMinutes: 40,
    priceKzt: 11000,
    oldPriceKzt: 14000,
    includes: [
      'Врачи со стажем более 10–15 лет',
      'Подготовка пары к беременности и ЭКО',
      'Ведение сложных беременностей',
    ],
  },
  {
    id: 'srv-andrology',
    code: '05',
    category: 'andrology',
    categoryLabel: 'Уролог-андролог',
    title: 'Консультация уролога-андролога и мужская репродукция',
    subtitle:
      'Комплексная оценка мужской фертильности, лечение простатита, варикоцеле и гормональных нарушений.',
    durationMinutes: 40,
    priceKzt: 11000,
    oldPriceKzt: 13500,
    includes: [
      'Диагностика мужского фактора бесплодия',
      'УЗИ предстательной железы и мошонки',
      'Персональный курс терапии',
    ],
  },
  {
    id: 'srv-procedures-massage',
    code: '06',
    category: 'procedures_massage',
    categoryLabel: 'Процедурный кабинет и массаж',
    title: 'Процедурный кабинет (капельницы, инъекции) и лечебный массаж',
    subtitle:
      'Внутривенные инфузии, внутримышечные инъекции, забор анализов крови и программы оздоровительного массажа.',
    durationMinutes: 45,
    priceKzt: 6500,
    oldPriceKzt: 8500,
    includes: [
      'Работаем Пн–Сб 08:00–20:00, Вс 08:00–15:00',
      'Стерильный процедурный блок и опытные медсестры',
      'Выгодные акционные пакеты курсового лечения',
    ],
  },
];

export const CLINIC_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-ayapova',
    name: 'Аяпова Сауле Калкамановна',
    role: 'Врач-генетик высшей категории · Кариотипирование и пренатальный скрининг',
    specialtyKey: 'genetics',
    experienceYears: 25,
    rating: 5.0,
    reviewsCount: 184,
    isTop: true,
    branchId: 'diagnostics',
    branchCity: 'Репро-Мед · пр. Райымбека, 150',
    priceKzt: 12000,
    nearestSlot: 'Сегодня, 14:30',
    education: 'Стаж более 25 лет · Эксперт по кариотипированию (5 дней) и хромосомным рискам',
    imageUrl: docReproImg,
    availableSlots: ['10:00', '11:30', '14:30', '16:00', '17:30'],
  },
  {
    id: 'doc-baibossynova',
    name: 'Байбосынова Марьям Бежановна',
    role: 'Акушер-гинеколог, репродуктолог · Лечение невынашивания беременности',
    specialtyKey: 'gynecology',
    experienceYears: 16,
    rating: 5.0,
    reviewsCount: 215,
    isTop: true,
    branchId: 'reproduction',
    branchCity: 'Репро-Мед · пр. Райымбека, 150',
    priceKzt: 11000,
    nearestSlot: 'Сегодня, 15:30',
    education: 'Стаж 16 лет · Специалист по репродуктивному здоровью и сохранению беременности',
    imageUrl: docGynImg,
    availableSlots: ['09:30', '11:00', '15:30', '17:00', '18:30'],
  },
  {
    id: 'doc-arepyev',
    name: 'Арепьев Владимир Эдуардович',
    role: 'Врач уролог-андролог · Мужское репродуктивное здоровье',
    specialtyKey: 'andrology',
    experienceYears: 14,
    rating: 4.9,
    reviewsCount: 148,
    isTop: true,
    branchId: 'reproduction',
    branchCity: 'Репро-Мед · пр. Райымбека, 150',
    priceKzt: 11000,
    nearestSlot: 'Сегодня, 16:45',
    education: 'Стаж 14 лет · Андрологическое обследование пар и подготовка к зачатию',
    imageUrl: docAndroImg,
    availableSlots: ['09:00', '12:00', '14:00', '16:45', '18:00'],
  },
  {
    id: 'doc-sailaukhan',
    name: 'Сайлаухан Гульназ Сайлауханкызы',
    role: 'Акушер-гинеколог, специалист УЗИ экспертного класса',
    specialtyKey: 'ultrasound',
    experienceYears: 12,
    rating: 5.0,
    reviewsCount: 167,
    isTop: false,
    branchId: 'diagnostics',
    branchCity: 'Репро-Мед · пр. Райымбека, 150',
    priceKzt: 10000,
    nearestSlot: 'Завтра, 10:30',
    education: 'Стаж 12 лет · Все виды УЗИ (Samsung H-60), биопсия и гинекология',
    imageUrl: docEmbryoImg,
    availableSlots: ['10:30', '12:30', '15:00', '17:15'],
  },
];

export const PATIENT_REVIEWS = [
  {
    id: 'rev-1',
    author: 'Айгуль и Марат С.',
    city: 'Алматы · пр. Райымбека, 150',
    program: 'Кариотипирование + ведение беременности',
    date: 'Октябрь 2026',
    doctor: 'Аяпова С. К.',
    text: 'Обратились в «Репро-Мед» после долгого поиска причины невынашивания. Кариотипирование сделали за 5 дней, Сауле Калкамановна подробно все разъяснила. Цены действительно выгодные, а напоминания в кабинете не дают забыть о визитах.',
  },
  {
    id: 'rev-2',
    author: 'Камилла Т.',
    city: 'Алматы · пр. Райымбека, 150',
    program: 'Биопсия (результат в тот же день) + УЗИ',
    date: 'Сентябрь 2026',
    doctor: 'Байбосынова М. Б.',
    text: 'Очень переживала перед биопсией, но здесь результат выдали уже в тот же день, без недель ожидания. Записалась через WhatsApp за пять минут, все четко по времени.',
  },
  {
    id: 'rev-3',
    author: 'Руслан Н.',
    city: 'Алматы · пр. Райымбека, 150',
    program: 'Уролог-андролог + процедурный кабинет',
    date: 'Август 2026',
    doctor: 'Арепьев В. Э.',
    text: 'Проходил обследование у уролога-андролога и курс капельниц в процедурном кабинете — удобно, что процедурный работает до вечера и даже в воскресенье.',
  },
];

export function formatKzt(amount: number): string {
  return `${new Intl.NumberFormat('ru-KZ').format(amount)} ₸`;
}
