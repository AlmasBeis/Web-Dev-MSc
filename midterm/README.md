# MyCompany API

REST API для HR-портала (сотрудники, оргструктура, отпуска).
Бэкенд для мобильного приложения
с сервером и в PostgreSQL.

Стек: Node.js 22 (ESM) + Express 4 + PostgreSQL 16 (драйвер pg, ручной SQL) + Docker Compose.


## Быстрый старт

Нужны Docker и Docker Compose.

docker compose up --build

Через несколько секунд:
curl localhost:4000/health

В логах api будет видно, что применились миграции и загрузились стартовые данные


Остановить: `docker compose down` или `docker compose down -v`.

## Архитектура

```
docker compose 
                                                 
host=db:5432                           
Node 22 Express  
API_PORT → 3000   
db Postgres 16
volume pgdata /var/lib/postgresql/data
Postman
```

## Переменные окружения

- `PORT` (`3000`) — порт Express внутри контейнера.
- `API_PORT` (`4000`) — порт API на хосте.
- `POSTGRES_USER` (`mycompany`) — пользователь БД, создаётся при первом старте `db`.
- `POSTGRES_PASSWORD` (`mycompany_secret`) — пароль пользователя БД.
- `POSTGRES_DB` (`mycompany`) — имя БД.
- `DB_HOST` (`db`) — хост БД для `api`, имя сервиса в Compose.
- `DB_PORT` (`5432`) — порт БД внутри сети.
- `DB_PORT_HOST` (`5433`) — порт БД на хосте.


## Структура репозитория

```
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── docs/            api.md, specs/site.md, plan.md
├── postman/         коллекция и environment
├── src/
    ├── server.js    запуск, graceful shutdown
    ├── app.js       Express, роуты, обработка ошибок
    ├── config.js    чтение env
    ├── db/          pool, миграции (migrate.js, migrations/*.sql), транзакции
    ├── routes/      HTTP-слой
    ├── services/    бизнес-правила, расчёт баланса и журнала
    ├── repositories/ SQL
    ├── validators/  проверка тел запросов
    ├── middleware/  обработка ошибок, 404
    └── utils/       работа с датами
```