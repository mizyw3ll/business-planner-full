# Business Planner

## Быстрый старт (Docker)

```bash
git clone https://github.com/mizyw3ll/business-planner-full.git
cd business-planner-full
cp .env.example .env
nano .env                    # заполнить пароли и ключи
docker compose up -d --build
```

Приложение: http://localhost

---

## Что заполнять в .env

Искать строки `ЗДЕСЬ_ПАРОЛЬ` и `ВАШ_КЛЮЧ`:

| Переменная | Где взять |
|---|---|
| `POSTGRES_PASSWORD` | Придумать пароль |
| `APP_CONFIG__DB__URL` | Тот же пароль что выше |
| `APP_CONFIG__ACCESS_TOKEN__*` | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `APP_CONFIG__AI__API_KEY` | https://openrouter.ai/keys |
| `APP_CONFIG__EMAIL__SMTP_*` | Данные от почтового ящика |
| `APP_CONFIG__S3__*` | Данные от S3 хранилища |

> **Правило:** `POSTGRES_PASSWORD` в `.env` = пароль в `APP_CONFIG__DB__URL`

---

## Деплой на сервер

```bash
git clone https://github.com/mizyw3ll/business-planner-full.git /opt/bp
cd /opt/bp
cp .env.example .env
nano .env
docker compose up -d --build
```

---

## Деплой через Docker Hub

```bash
# Сборка и пуш образов
docker login
docker build -t anillen/bp-api:latest -f backend/Dockerfile ./backend
docker build -t anillen/bp-frontend:latest -f frontend/Dockerfile.prod ./frontend
docker push anillen/bp-api:latest
docker push anillen/bp-frontend:latest
```

Затем на сервере в `docker-compose.yml` заменить `build:` на `image:` и запустить `docker compose up -d`.

---

## Полезные команды

```bash
docker compose ps                    # статус
docker compose logs -f api           # логи бекенда
docker compose logs -f frontend      # логи фронта
docker compose up -d --build         # пересобрать и запустить
docker compose down                  # остановить
docker compose down -v               # остановить + удалить данные БД
```

---

## Структура проекта

```
business-planner-full/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   ├── entrypoint.sh
│   └── fastapi_application/
└── frontend/
    ├── Dockerfile
    ├── Dockerfile.prod
    ├── nginx.conf
    └── src/
```
