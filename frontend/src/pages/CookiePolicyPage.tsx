import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { v } from "../shared/theme";

export function CookiePolicyPage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
          style={{ color: v("text-secondary") }}
        >
          <ArrowLeft size={16} />
          На главную
        </Link>

        <div className="mt-6 space-y-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: v("text-primary") }}>
              Политика использования файлов cookie
            </h1>
            <p className="mt-1 text-sm" style={{ color: v("text-muted") }}>
              Последняя редакция: 12 июня 2026 г.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
              1. Что такое файлы cookie
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: v("text-secondary") }}>
              <p>
                1.1. Cookie — это небольшие текстовые файлы, которые сохраняются на устройстве пользователя
                (компьютере, планшете, смартфоне) при посещении веб-сайта. Они позволяют запоминать действия
                и предпочтения пользователя, обеспечивать авторизацию и собирать статистику использования.
              </p>
              <p>
                1.2. Настоящая Политика описывает типы используемых cookie-файлов, цели их использования,
                а также способы управления ими.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
              2. Типы используемых cookie
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: v("text-secondary") }}>
              <p>2.1. Веб-приложение Конструктор бизнес-планов использует следующие категории cookie:</p>

              <div
                className="rounded-xl border p-4 space-y-3"
                style={{ borderColor: v("border-primary"), background: v("bg-secondary") }}
              >
                <div>
                  <p className="font-medium" style={{ color: v("text-primary") }}>Функциональные (обязательные)</p>
                  <p className="mt-1 text-sm" style={{ color: v("text-secondary") }}>
                    Необходимы для авторизации пользователя, обеспечения безопасности и корректной работы
                    базового функционала приложения. Без этих cookie использование приложения невозможно.
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-sm" style={{ color: v("text-muted") }}>
                    <li>access_token — токен авторизации (сессионный, до 5 дней);</li>
                    <li>session_id — идентификатор сессии.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium" style={{ color: v("text-primary") }}>Аналитические cookie</p>
                  <p className="mt-1 text-sm" style={{ color: v("text-secondary") }}>
                    Используются для сбора анонимной статистики о поведении пользователей: посещённые страницы,
                    время на сайте, источники трафика. Данные используются для улучшения качества сервиса.
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-sm" style={{ color: v("text-muted") }}>
                    <li>Яндекс.Метрика (_ym_*, _ga*, _gid);</li>
                    <li>Данные о просмотрах страниц и действиях (events).</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium" style={{ color: v("text-primary") }}>Технические cookie</p>
                  <p className="mt-1 text-sm" style={{ color: v("text-secondary") }}>
                    Обеспечивают корректное отображение интерфейса, сохранение настроек темы
                    (светлая/тёмная) и других предпочтений пользователя.
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-sm" style={{ color: v("text-muted") }}>
                    <li>theme — выбранная тема оформления;</li>
                    <li>sidebar_state — состояние бокового меню.</li>
                  </ul>
                </div>
              </div>

              <p className="mt-2">
                Маркетинговые и рекламные cookie на сайте не используются.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
              3. Срок хранения cookie
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: v("text-secondary") }}>
              <p>3.1. Используются следующие типы cookie по сроку хранения:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Сессионные</strong> — удаляются после закрытия браузера;</li>
                <li><strong>Постоянные</strong> — хранятся на устройстве до истечения срока действия
                (до 5 дней для токена авторизации, до 1 года для настроек темы).</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
              4. Управление cookie
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: v("text-secondary") }}>
              <p>4.1. Пользователь может управлять файлами cookie следующими способами:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Настройки браузера</strong> — большинство браузеров позволяют блокировать или
                удалять cookie через настройки конфиденциальности;</li>
                <li><strong>Блокировка аналитических cookie</strong> — можно отключить сбор данных
                Яндекс.Метрикой через соответствующие настройки браузера или расширения;</li>
                <li><strong>Удаление при выходе</strong> — при выходе из учётной записи сессионные cookie
                удаляются автоматически.</li>
              </ul>
              <p className="mt-2">
                4.2. Отключение функциональных cookie может привести к невозможности использования
                Веб-приложения (авторизация, сохранение данных).
              </p>
              <p>
                4.3. Инструкции по управлению cookie в популярных браузерах:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm" style={{ color: v("text-muted") }}>
                <li>Google Chrome: Настройки → Конфиденциальность и безопасность → Файлы cookie;</li>
                <li>Mozilla Firefox: Настройки → Приватность и защита → Куки и данные сайтов;</li>
                <li>Safari: Настройки → Конфиденциальность → Блокировать cookie;</li>
                <li>Edge: Настройки → Cookies и разрешения сайтов → Управление cookie.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
              5. Обработка данных с помощью cookie
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: v("text-secondary") }}>
              <p>
                5.1. Данные, собираемые с помощью cookie, обрабатываются в соответствии с Политикой обработки
                персональных данных. Сookie-файлы не используются для идентификации конкретного пользователя
                за пределами Веб-приложения.
              </p>
              <p>
                5.2. При первом посещении Веб-приложения пользователю отображается уведомление об
                использовании cookie. Продолжая использование приложения, пользователь подтверждает своё
                согласие на использование cookie в соответствии с настоящей Политикой.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
              6. Контактная информация
            </h2>
            <div className="space-y-2 text-sm leading-relaxed" style={{ color: v("text-secondary") }}>
              <p>
                По всем вопросам, связанным с использованием файлов cookie и обработкой данных,
                пользователь может обратиться:
              </p>
              <p>Email: business_planner@inbox.ru</p>
            </div>
          </section>

          <div
            className="rounded-xl border p-4 text-sm"
            style={{ borderColor: v("border-secondary"), background: v("bg-secondary") }}
          >
            <p style={{ color: v("text-muted") }}>
              Также ознакомьтесь с{" "}
              <Link to="/privacy" className="underline hover:opacity-80" style={{ color: v("text-secondary") }}>
                Политикой обработки персональных данных
              </Link>{" "}
              и{" "}
              <Link to="/terms" className="underline hover:opacity-80" style={{ color: v("text-secondary") }}>
                Пользовательским соглашением
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
