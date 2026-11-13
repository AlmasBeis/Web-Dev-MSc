# Документация эндпоинтов

Базовый URL: `http://localhost:4003`. Формат JSON (`Content-Type: application/json`), поля в camelCase, даты `YYYY-MM-DD`.
Списки возвращают `{ "items": [...], "total": N }`.
Ошибка: `{ "error": { "code": "...", "message": "...", "details": { "поле": "причина" } } }`.

| Код | Когда |
|---|---|
| 400 | неверный id / query-параметр, битый JSON |
| 404 | запись не найдена |
| 409 | дубликат, удаление записи со связями, недопустимая смена статуса |
| 422 | невалидное тело запроса (`details` — по полям) |

## Health

| Метод | URL | Ответ |
|---|---|---|
| GET | `/health` | `200 { "status": "ok", "db": "up" }`, `503` если БД недоступна |

## Departments

Объект: `{ "id": 1, "name": "Разработка" }`

| Метод | URL | Параметры / тело | Ответ |
|---|---|---|---|
| GET | `/api/departments` | — | 200 список |
| GET | `/api/departments/{id}` | path `id` | 200 объект; 400; 404 |
| POST | `/api/departments` | `{ "name": "Legal" }` (2–100 символов) | 201 объект; 409 имя занято; 422 |
| PUT | `/api/departments/{id}` | `{ "name": "..." }` | 200 объект; 404; 409; 422 |
| DELETE | `/api/departments/{id}` | path `id` | 204; 404; 409 если есть сотрудники |
| GET | `/api/departments/{id}/employees` | path `id` | 200 список сотрудников отдела; 404 |

## Employees

Объект: `{ "id": 1, "firstName": "Анна", "lastName": "Иванова", "position": "Backend-разработчик", "email": "anna@mycompany.kz", "hireDate": "2022-03-14", "departmentId": 1, "createdAt": "2026-11-13T07:19:36.981Z" }`

Тело POST/PUT (все поля обязательны):
`{ "firstName": "Test", "lastName": "User", "position": "QA", "email": "t@mycompany.kz", "hireDate": "2025-01-15", "departmentId": 1 }`
— `firstName`/`lastName` 1–50 символов, `position` 2–100, корректный уникальный `email`, `hireDate` не в будущем, `departmentId` существующий отдел.

| Метод | URL | Параметры / тело | Ответ |
|---|---|---|---|
| GET | `/api/employees` | query: `departmentId`, `q` (поиск по имени/фамилии) | 200 список; 400 |
| GET | `/api/employees/{id}` | path `id` | 200 объект; 400; 404 |
| POST | `/api/employees` | тело выше | 201 объект; 409 email занят; 422 |
| PUT | `/api/employees/{id}` | тело выше | 200 объект; 404; 409; 422 |
| DELETE | `/api/employees/{id}` | path `id` | 204; 404 (записи на обучение удаляются каскадом) |
| GET | `/api/employees/{id}/enrollments` | query: `status` | 200 список записей сотрудника; 400; 404 |

## Courses

Объект: `{ "id": 1, "title": "Основы PostgreSQL", "description": "...", "hours": 16, "createdAt": "..." }`

Тело POST/PUT: `{ "title": "Docker", "description": "Basics", "hours": 8 }` — `title` 2–150 символов (уникальный), `description` необязательно (до 500), `hours` целое 1–500.

| Метод | URL | Параметры / тело | Ответ |
|---|---|---|---|
| GET | `/api/courses` | — | 200 список |
| GET | `/api/courses/{id}` | path `id` | 200 объект; 400; 404 |
| POST | `/api/courses` | тело выше | 201 объект; 409 название занято; 422 |
| PUT | `/api/courses/{id}` | тело выше | 200 объект; 404; 409; 422 |
| DELETE | `/api/courses/{id}` | path `id` | 204; 404; 409 если есть записи на курс |
| GET | `/api/courses/{id}/enrollments` | query: `status` | 200 список записей на курс; 400; 404 |

## Enrollments

Объект: `{ "id": 1, "employeeId": 1, "courseId": 1, "status": "COMPLETED", "score": 92, "createdAt": "..." }`
`status`: `ENROLLED` | `COMPLETED` | `DROPPED`; `score`: 0–100 или `null`.

| Метод | URL | Параметры / тело | Ответ |
|---|---|---|---|
| GET | `/api/enrollments` | query: `employeeId`, `courseId`, `status` | 200 список; 400 |
| GET | `/api/enrollments/{id}` | path `id` | 200 объект; 400; 404 |
| POST | `/api/enrollments` | `{ "employeeId": 1, "courseId": 3 }` | 201 объект (`ENROLLED`, `score: null`); 409 уже записан; 422 сотрудник/курс не найден |
| PATCH | `/api/enrollments/{id}` | `{ "status": "COMPLETED", "score": 90 }` — `status` и/или `score` | 200 объект; 404; 409 статус менять нельзя (запись уже `COMPLETED`/`DROPPED`); 422 пустое тело, неверные значения или `score` без `COMPLETED` |
| DELETE | `/api/enrollments/{id}` | path `id` | 204; 404 |
