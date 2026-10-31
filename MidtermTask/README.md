# Bounty Hunters API

REST API для охотников за головами: база разыскиваемых преступников и журнал охоты.

Стек: Node.js 22 (ESM) + Express 4 + PostgreSQL 16 (драйвер pg) + Docker Compose.

## Запуск

```
docker compose up --build
curl localhost:4001/health
```
## Эндпоинты

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/criminals/` | список; `min_reward`, `max_reward`, `armed`, `has_crew`, `escape_master`, `sort=reward\|-reward` |
| GET | `/api/criminals/{id}/` | один преступник |
| GET | `/api/hunts/` | список; `criminal_id` |
| GET | `/api/hunts/{id}/` | одна запись |
| POST | `/api/hunts/` | `{criminal_id, success, notes}` → 201 |
| PATCH | `/api/hunts/{id}/` | `success` и/или `notes` |
| DELETE | `/api/hunts/{id}/` | 204 |

Ошибки: 400 — неверный id/параметр, 404 — не найдено, 422 — невалидное тело.