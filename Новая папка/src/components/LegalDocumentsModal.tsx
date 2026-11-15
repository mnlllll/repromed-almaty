import React from 'react';
import { FileCheck2, Lock, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { REPROMED_CONTACTS } from '../data/clinicData';

export type LegalDocTab = 'privacy' | 'pdn' | 'terms' | 'cookies' | 'medical';

interface LegalDocumentsModalProps {
  activeTab: LegalDocTab | null;
  onSelectTab: (tab: LegalDocTab) => void;
  onClose: () => void;
}

const LEGAL_TABS: Array<{ id: LegalDocTab; label: string }> = [
  { id: 'privacy', label: 'Политика конфиденциальности' },
  { id: 'pdn', label: 'Согласие на ПДн и ИИН' },
  { id: 'terms', label: 'Пользовательское соглашение' },
  { id: 'cookies', label: 'Cookies и Push' },
  { id: 'medical', label: 'Мед. дисклеймер' },
];

export const LegalDocumentsModal: React.FC<LegalDocumentsModalProps> = ({
  activeTab,
  onSelectTab,
  onClose,
}) => {
  if (!activeTab) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <div className="text-xs font-semibold text-[#0D9488]">
              Правовая информация · Республика Казахстан · МЦ «Репро-Мед»
            </div>
            <h2 id="legal-modal-title" className="mt-1 font-display text-lg font-bold text-[#0B2545]">
              Документы о конфиденциальности и защите данных пациентов
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть правовую информацию"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-[#F8FAFC] px-6 py-2.5">
          <div className="flex gap-1.5 overflow-x-auto">
            {LEGAL_TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTab(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-[#0B2545] text-white'
                      : 'text-slate-600 hover:bg-white hover:text-[#0B2545]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm leading-relaxed text-slate-700">
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0B2545]">
                <ShieldCheck className="h-5 w-5 text-[#0D9488]" />
                <h3 className="font-display text-base font-bold">
                  Политика конфиденциальности и защиты персональных данных
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Редакция от 15 ноября 2026 г. · Составлена в соответствии с Законом Республики
                Казахстан от 21 мая 2013 года № 94-V «О персональных данных и их защите» и Кодексом
                РК «О здоровье народа и системе здравоохранения».
              </p>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">1. Оператор персональных данных</h4>
                <p>
                  Оператором персональных данных является {REPROMED_CONTACTS.clinicName}, расположенный
                  по адресу: {REPROMED_CONTACTS.city}, {REPROMED_CONTACTS.address}. Телефон
                  регистратуры: {REPROMED_CONTACTS.registryDisplay}, мобильный:{' '}
                  {REPROMED_CONTACTS.mobileDisplay}.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">2. Состав обрабатываемых данных</h4>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    Идентификационные и контактные данные: ФИО, номер телефона Казахстана, адрес
                    электронной почты, ИИН (предоставляется добровольно при регистрации карты).
                  </li>
                  <li>
                    Данные онлайн-записи: выбранное отделение, услуга, врач, дата, время визита и
                    необязательный комментарий пациента для регистратуры.
                  </li>
                  <li>
                    Медицинские сведения в личном кабинете: результаты УЗИ, биопсии,
                    кариотипирования и история посещений (охраняются как врачебная тайна).
                  </li>
                  <li>
                    Отзывы, добровольно опубликованные пользователем через форму на сайте (имя,
                    оценка, текст отзыва).
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">3. Цели и безопасность обработки</h4>
                <p>
                  Данные используются исключительно для записи на прием, связи с регистратурой,
                  доступа пациента к собственным результатам обследований и отправки настроенных
                  push-напоминаний. Пароли учетных записей хранятся в хэшированном виде, доступ к
                  кабинету защищен токен-авторизацией.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">4. Взаимодействие со сторонними сервисами</h4>
                <p>
                  При самостоятельном нажатии кнопок «WhatsApp» или «2ГИС» пользователь переходит во
                  внешние сервисы (WhatsApp Messenger, 2ГИС Алматы), которые обрабатывают данные по
                  собственным политикам конфиденциальности. На сайте также встроен официальный
                  картографический виджет 2ГИС для отображения адреса клиники.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'pdn' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0B2545]">
                <Lock className="h-5 w-5 text-[#0D9488]" />
                <h3 className="font-display text-base font-bold">
                  Согласие на сбор, обработку ПДн, ИИН и соблюдение врачебной тайны
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Согласно ст. 7–8 Закона РК № 94-V и ст. 273 Кодекса РК от 7 июля 2020 года № 360-VI
                «О здоровье народа и системе здравоохранения».
              </p>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">1. Добровольное согласие субъекта</h4>
                <p>
                  Устанавливая отметку о согласии при онлайн-записи на прием или регистрации в
                  личном кабинете, пациент свободно, осознанно и по собственной воле дает согласие
                  МЦ «Репро-Мед» на сбор, запись, систематизацию, хранение, уточнение и использование
                  персональных данных для организации медицинской помощи.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">2. Врачебная тайна и ИИН</h4>
                <p>
                  Факт обращения за медицинской помощью, диагноз, результаты генетического
                  кариотипирования, биопсии и УЗИ составляют врачебную тайну и не передаются
                  третьим лицам без письменного согласия пациента, за исключением случаев, прямо
                  установленных законодательством Республики Казахстан. Указание ИИН необходимо
                  исключительно для однозначной идентификации медицинской карты в клинике и
                  оформляется добровольно.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">3. Срок действия и отзыв согласия</h4>
                <p>
                  Согласие действует в течение всего периода обслуживания в клинике и установленных
                  законодательством РК сроков хранения медицинской документации. Пациент вправе в
                  любой момент отозвать согласие на маркетинговые или push-уведомления в Личном
                  кабинете, а также подать заявление на уточнение или удаление учетной записи через
                  регистратуру: {REPROMED_CONTACTS.registryDisplay}.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0B2545]">
                <FileCheck2 className="h-5 w-5 text-[#0D9488]" />
                <h3 className="font-display text-base font-bold">
                  Пользовательское соглашение и правила онлайн-записи
                </h3>
              </div>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">1. Предмет соглашения</h4>
                <p>
                  Сервис онлайн-записи и Личный кабинет пациента предназначены для выбора услуги,
                  специалиста и ориентировочного времени визита в МЦ «Репро-Мед» по адресу г.
                  Алматы, пр. Райымбека, 150.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">2. Оформление и перенос записи</h4>
                <p>
                  После оформления заявки администратор регистратуры при необходимости подтверждает
                  время приема по телефону или в WhatsApp. Пациент может отменить визит в Личном
                  кабинете или по номеру {REPROMED_CONTACTS.registryDisplay}.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">3. Стоимость услуг</h4>
                <p>
                  Цены и акционные предложения на сайте носят информационный характер. Точный объем
                  диагностики (УЗИ, биопсия, кариотипирование, процедуры) и итоговая стоимость
                  определяются по утвержденному прейскуранту клиники на момент оказания услуги.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0B2545]">
                <ShieldCheck className="h-5 w-5 text-[#0D9488]" />
                <h3 className="font-display text-base font-bold">
                  Политика Cookies, локального хранилища и Push-уведомлений
                </h3>
              </div>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">1. Техническое хранилище браузера</h4>
                <p>
                  Для корректной работы Личного кабинета сайт сохраняет в{' '}
                  <code className="font-mono text-xs text-[#0B2545]">localStorage</code> токен
                  сессии (<code className="font-mono text-xs text-[#0B2545]">repromed_almaty_token</code>)
                  и статус ознакомления с настоящим уведомлением. Сторонние рекламные трекеры на
                  сайте не используются.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">2. Service Worker и Push-напоминания</h4>
                <p>
                  Если вы разрешили push-уведомления, браузерный Service Worker (
                  <code className="font-mono text-xs text-[#0B2545]">/sw.js</code>) используется
                  исключительно для напоминания о предстоящих приемах и готовности анализов. Вы
                  можете отключить уведомления в любое время во вкладке «Push-напоминания» Личного
                  кабинета или в настройках браузера.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0B2545]">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <h3 className="font-display text-base font-bold">
                  Медицинский дисклеймер и возрастное ограничение (18+)
                </h3>
              </div>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">1. Информационный характер материалов</h4>
                <p>
                  Вся информация о симптомах, сроках биопсии, кариотипирования, а также
                  интерактивный 3D-атлас репродукции человека и кариотипа размещены исключительно в
                  ознакомительных и образовательных целях. Материалы сайта не являются медицинской
                  консультацией, постановкой диагноза или руководством к самолечению.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">2. Экстренные состояния</h4>
                <p>
                  Онлайн-запись и форма WhatsApp предназначены только для плановых консультаций и
                  диагностики. При острых болях, кровотечении или угрозе прерывания беременности
                  незамедлительно обратитесь за скорой медицинской помощью по номеру{' '}
                  <strong className="font-mono text-[#0B2545]">103</strong> или{' '}
                  <strong className="font-mono text-[#0B2545]">112</strong>.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-[#0B2545]">3. Ответственность</h4>
                <p>
                  Имеются медицинские противопоказания — перед прохождением процедур, биопсии или
                  лечением необходима очная консультация профильного врача. Самостоятельная запись
                  на сайте доступна лицам, достигшим 18 лет (прием несовершеннолетних осуществляется
                  в сопровождении законных представителей).
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-[#F8FAFC] px-6 py-3.5">
          <span className="text-xs text-slate-500">
            МЦ «Репро-Мед» · г. Алматы, пр. Райымбека, 150 · Регистратура {REPROMED_CONTACTS.registryDisplay}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0B2545] px-5 py-2 text-xs font-semibold text-white hover:bg-[#133866]"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
