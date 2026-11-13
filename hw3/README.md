# HW3 REST API и база данных

REST API для учёта обучения сотрудников. Хранит отделы, сотрудников, курсы и записи сотрудников на курсы (статус и оценка). Данные лежат в PostgreSQL, доступ через CRUD-эндпоинты с валидацией запросов и обработкой ошибок.

Стек: Node.js 22 (ESM) + Express 4 + PostgreSQL 16 (драйвер `pg`) + Docker Compose.

## Запуск

```
docker compose up --build
curl localhost:4003/health
```

## Модель данных


| Таблица | Поля |
|---|---|
| `departments` | id, name (уникальное) |
| `employees` | id, firstName, lastName, position, email (уникальный), hireDate, departmentId → departments |
| `courses` | id, title (уникальное), description, hours (1–500) |
| `enrollments` | id, employeeId → employees, courseId → courses, status (`ENROLLED` / `COMPLETED` / `DROPPED`), score (0–100 или `null`) |

Связи (one-to-many):
1. отдел → сотрудники (`ON DELETE RESTRICT`);
2. сотрудник → записи на обучение (`ON DELETE CASCADE`);
3. курс → записи на обучение (`ON DELETE RESTRICT`).



## Postman


Импортируйте оба файла, выберите окружение «HW3 local»

## Структура

```
src/
  server.js, app.js, config.js, errors.js
  db/            pool.js, migrate.js, migrations/
  routes/        departments, employees, courses, enrollments
  validators/    валидация тел запросов
  repositories/  SQL-запросы
  middleware/    asyncHandler, notFound, errorHandler
```
