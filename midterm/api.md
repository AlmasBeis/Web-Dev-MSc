# MyCompany API — документация

REST API HR-портала: справочники, сотрудники, заявки на отпуск, баланс и журнал дней.

- [Общие правила](#общие-правила)
- [Health](#health)
- [Offices](#offices) · [Departments](#departments) · [Employees](#employees)
- [Leave balance и ledger](#leave-balance-и-ledger)
- [Leave requests](#leave-requests) · [Решения: approve / reject / cancel](#решения-approve--reject--cancel)
- [Коды ошибок](#коды-ошибок)

## Общие правила

| | |
|---|---|
| Базовый URL | `http://localhost:3000` (порт задаётся `API_PORT` в `.env`) |
| Формат | JSON, заголовок `Content-Type: application/json` у запросов с телом |
| Даты | строки `YYYY-MM-DD`, без времени |
| Имена полей | camelCase |


### Все эндпоинты

| Метод | Путь | Описание | Успех |
|---|---|---|---|
| GET | `/health` | статус API и БД | 200 / 503 |
| GET | `/api/offices` | список офисов | 200 |
| GET | `/api/offices/:id` | офис по коду | 200 |
| POST | `/api/offices` | создать офис | 201 |
| PUT | `/api/offices/:id` | обновить офис | 200 |
| DELETE | `/api/offices/:id` | удалить офис | 204 |
| GET | `/api/departments` | список подразделений | 200 |
| GET | `/api/departments/:id` | подразделение по коду | 200 |
| POST | `/api/departments` | создать подразделение | 201 |
| PUT | `/api/departments/:id` | обновить подразделение | 200 |
| DELETE | `/api/departments/:id` | удалить подразделение | 204 |
| GET | `/api/employees` | список сотрудников с фильтрами | 200 |
| GET | `/api/employees/:id` | карточка сотрудника | 200 |
| POST | `/api/employees` | создать сотрудника | 201 |
| PUT | `/api/employees/:id` | обновить сотрудника | 200 |
| DELETE | `/api/employees/:id` | удалить сотрудника | 204 |
| GET | `/api/employees/:id/leave-balance` | баланс дней отпуска | 200 |
| GET | `/api/employees/:id/leave-ledger` | журнал начислений и списаний | 200 |
| GET | `/api/leave-requests` | список заявок с фильтрами | 200 |
| GET | `/api/leave-requests/:id` | заявка по id | 200 |
| POST | `/api/leave-requests` | создать заявку | 201 |
| PUT | `/api/leave-requests/:id` | изменить заявку (только PENDING) | 200 |
| DELETE | `/api/leave-requests/:id` | удалить заявку | 204 |
| POST | `/api/leave-requests/:id/approve` | согласовать | 200 |
| POST | `/api/leave-requests/:id/reject` | отклонить | 200 |
| POST | `/api/leave-requests/:id/cancel` | отозвать | 200 |

---

## Offices

Объект:

| Поле | Тип | Правила |
|---|---|---|
| `id` | string | код из 3 заглавных латинских букв (`ALA`); задаётся клиентом при создании, потом не меняется |
| `city` | string | 2–100 символов |
| `address` | string | 5–200 символов |

### `GET /api/offices`
Список, отсортирован по городу.
```json
{
  "items": [
    { "id": "ALA", "city": "Алматы", "address": "пр. Аль-Фараби, 77/7, 12 этаж" },
    { "id": "AST", "city": "Астана", "address": "пр. Мангилик Ел, 55/20, офис 304" }
  ],
  "total": 2
}
```

### `GET /api/offices/:id`
`200` — объект офиса. `404` — «Офис не найден».

### `POST /api/offices`
Тело: `id`, `city`, `address` (все обязательны).
```json
{ "id": "SHY", "city": "Шымкент", "address": "ул. Байтурсынова, 1" }
```
- `201` + `Location: /api/offices/SHY`, тело — созданный офис.
- `409` — «Офис с кодом SHY уже существует».
- `422` — ошибки полей:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Проверьте введённые данные",
  "details": { "id": "Код офиса — 3 заглавные латинские буквы", "city": "Укажите город", "address": "Укажите адрес" } } }
```

### `PUT /api/offices/:id`
Тело: `city`, `address`. Код (`id`) берётся из пути и не меняется.
`200` — обновлённый офис; `404`; `422`.

### `DELETE /api/offices/:id`
`204`; `404`; `409` — «В офисе есть сотрудники: 10».

---

## Departments

Подразделения образуют дерево через `parentId`.

| Поле | Тип | Правила |
|---|---|---|
| `id` | string | код `^[a-z][a-z0-9-]{1,19}$` (`mobile`); задаётся клиентом, не меняется |
| `name` | string | 2–100 символов |
| `parentId` | string \| null | `null` (корень) или код существующего подразделения |

### `GET /api/departments`
Плоский список, отсортирован по названию.
```json
{ "items": [ { "id": "mobile", "name": "Мобильная команда", "parentId": "dev" } ], "total": 6 }
```

### `GET /api/departments/:id`
`200`; `404` — «Подразделение не найдено».

### `POST /api/departments`
Тело: `id`, `name`, `parentId` (необязателен, по умолчанию `null`).
- `201` + `Location`.
- `409` — код уже занят.
- `422` — `details.parentId`: «Родительское подразделение не найдено».

### `PUT /api/departments/:id`
Тело: `name`, `parentId`.
`422` с `details.parentId`:
- «Подразделение не может быть вложено само в себя»;
- «Подразделение не может быть вложено в своё дочернее» (защита от циклов);
- «Родительское подразделение не найдено».

### `DELETE /api/departments/:id`
`204`; `404`; `409` — «У подразделения есть дочерние подразделения: 2» или «В подразделении есть сотрудники: 5».

---

## Employees

Объект сотрудника:

| Поле | Тип | Правила при создании и обновлении |
|---|---|---|
| `id` | string | генерирует сервер: `E15`, `E16`, … |
| `firstName`, `lastName` | string | обязательны, 1–50 |
| `middleName` | string \| null | необязательно, до 50 |
| `position` | string | 2–100 |
| `departmentId` | string | существующее подразделение |
| `officeId` | string | существующий офис |
| `managerId` | string \| null | `null` или существующий сотрудник; не сам себе; без циклов в цепочке руководителей |
| `email` | string | формат email, уникален без учёта регистра |
| `phone` | string | `+7` и 10 цифр, пробелы допускаются |
| `hireDate` | string | `YYYY-MM-DD`, не в будущем |
| `carryOverDays` | integer | 0–60, по умолчанию 0: остаток дней, перенесённый на 1 января текущего года |
| `languages` | array | до 10 элементов `{ "language": "Русский", "level": "свободно" }`; языки не повторяются; порядок сохраняется |

Допустимые `level`: `родной`, `свободно`, `базовый`, `A1`, `A2`, `B1`, `B2`, `C1`, `C2`.

Только в ответах: `fullName` («Фамилия Имя Отчество»), `manager` `{ id, fullName }`, `subordinatesCount`.

### `GET /api/employees`

| Параметр | Описание |
|---|---|
| `q` | поиск по ФИО, должности и email, без учёта регистра |
| `departmentId` | подразделение вместе со всеми вложенными |
| `officeId` | офис |
| `managerId` | прямые подчинённые руководителя |
| `limit` | 1–200, по умолчанию 50 |
| `offset` | с 0, по умолчанию 0 |

Сортировка: фамилия, имя. `total` — число совпадений без учёта `limit`/`offset`.
В элементах списка нет `languages`, `manager` и `subordinatesCount` — они есть только в карточке.
Некорректный параметр (`limit=0`, повтор `q=a&q=b`) → `400`.

```http
GET /api/employees?departmentId=dev&limit=2
```
```json
{
  "items": [
    {
      "id": "E06", "firstName": "Алия", "lastName": "Жумабаева", "middleName": "Нуржановна",
      "position": "QA-инженер", "departmentId": "mobile", "officeId": "ALA", "managerId": "E03",
      "email": "a.zhumabayeva@alfasoft.kz", "phone": "+7 727 355 01 06",
      "hireDate": "2023-05-22", "carryOverDays": 5, "fullName": "Жумабаева Алия Нуржановна"
    }
  ],
  "total": 8
}
```

### `GET /api/employees/:id`
```json
{
  "id": "E04",
  "firstName": "Айгерим", "lastName": "Сапарова", "middleName": "Канатовна",
  "fullName": "Сапарова Айгерим Канатовна",
  "position": "Android-разработчик",
  "departmentId": "mobile", "officeId": "ALA", "managerId": "E03",
  "manager": { "id": "E03", "fullName": "Нурланов Ерлан Маратович" },
  "email": "a.saparova@alfasoft.kz", "phone": "+7 727 355 01 04",
  "hireDate": "2024-03-15", "carryOverDays": 6,
  "subordinatesCount": 0,
  "languages": [
    { "language": "Казахский", "level": "родной" },
    { "language": "Русский", "level": "свободно" },
    { "language": "Английский", "level": "B2" }
  ]
}
```
`404` — «Сотрудник не найден».

### `POST /api/employees`
Тело: все поля из таблицы выше, кроме `id`.
```json
{
  "firstName": "Тест", "lastName": "Тестов", "middleName": null,
  "position": "QA-инженер", "departmentId": "mobile", "officeId": "ALA", "managerId": "E03",
  "email": "t.testov@alfasoft.kz", "phone": "+7 727 355 01 99",
  "hireDate": "2026-10-01", "carryOverDays": 2,
  "languages": [{ "language": "Русский", "level": "родной" }]
}
```
- `201` + `Location: /api/employees/E15`, тело — карточка.
- `422` — все ошибки полей сразу, например:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Проверьте введённые данные", "details": {
  "email": "Некорректный email",
  "phone": "Телефон в формате +7 XXX XXX XX XX",
  "departmentId": "Подразделение не найдено",
  "languages": "Неизвестный уровень языка" } } }
```
- `409` — «Сотрудник с таким email уже есть» (проверяется после успешной валидации).

Сотрудник и его языки сохраняются в одной транзакции: при ошибке не создаётся ничего.

### `PUT /api/employees/:id`
Тело — как при создании; `languages` заменяются целиком. Возвращает карточку.
Дополнительные `422` по `managerId`: «Сотрудник не может быть руководителем сам себе», «Цикл в подчинении…».
`404`, `409` (email занят другим сотрудником).

### `DELETE /api/employees/:id`
`204`. `404`. `409`:
- «У сотрудника есть подчинённые: 4»;
- «Сотрудник назначен согласующим в заявках на отпуск: 3».

Заявки самого сотрудника удаляются вместе с ним.

---

## Leave balance и ledger

Считаются сервером при каждом запросе (в БД не хранятся) по правилам мобильного приложения, за **текущий год**:

- перенос остатка (`carryOverDays`) на 1 января;
- **+2 дня** за каждый месяц с начала года (но не раньше месяца приёма и не позже текущего);
- списание дней за согласованные (`APPROVED`) ежегодные (`ANNUAL`) отпуска, датой начала отпуска.

### `GET /api/employees/:id/leave-balance`
```json
{ "employeeId": "E04", "year": 2026, "accrued": 26, "used": 10, "reserved": 5, "available": 11 }
```
- `accrued` — перенос + начисления;
- `used` — дни согласованных заявок;
- `reserved` — дни заявок на согласовании (`PENDING`);
- `available = accrued − used − reserved`.

`404` — сотрудник не найден.

### `GET /api/employees/:id/leave-ledger`
Журнал, **новые записи сверху**. Параметр `type` — фильтр: `CARRY_OVER`, `ACCRUAL` или `USAGE` (иначе `400`).
`balanceAfter` — остаток после операции.
```json
{
  "items": [
    { "employeeId": "E04", "date": "2026-10-01", "type": "ACCRUAL", "days": 2,
      "title": "Начисление за октябрь", "requestId": null, "balanceAfter": 16 },
    { "employeeId": "E04", "date": "2026-05-04", "type": "USAGE", "days": -10,
      "title": "Отпуск 04.05–13.05 (заявка №1)", "requestId": 1, "balanceAfter": 6 },
    { "employeeId": "E04", "date": "2026-01-01", "type": "CARRY_OVER", "days": 6,
      "title": "Перенос остатка с 2025 года", "requestId": null, "balanceAfter": 6 }
  ],
  "total": 3
}
```
(в примере показаны не все записи).

---

## Leave requests

Объект заявки:

| Поле | Тип | Описание |
|---|---|---|
| `id` | integer | |
| `employeeId` | string | кто просит отпуск |
| `approverId` | string | согласующий — всегда руководитель сотрудника, проставляет сервер |
| `type` | string | `ANNUAL` (оплачиваемый) или `UNPAID` (без сохранения з/п) |
| `startDate`, `endDate` | string | границы включительно |
| `days` | integer | `endDate − startDate + 1`, считает сервер |
| `substituteId` | string \| null | заместитель |
| `comment` | string | до 300 символов; для `UNPAID` обязателен |
| `status` | string | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `createdAt` | string | дата создания |
| `decidedAt` | string \| null | дата решения руководителя |
| `decisionComment` | string \| null | комментарий или причина отклонения |

### `GET /api/leave-requests`
Фильтры (необязательные, сочетаются): `employeeId`, `approverId`, `status`, `type`.
`status` и `type` вне списка допустимых значений → `400`. Сортировка по `id`.
```http
GET /api/leave-requests?approverId=E03&status=PENDING
```

### `GET /api/leave-requests/:id`
`200`; `404` — «Заявка не найдена»; `400` — id не число («Некорректный id заявки»).

### `POST /api/leave-requests`
Тело:

| Поле | Обязательно |
|---|---|
| `employeeId` | да |
| `type` | да |
| `startDate`, `endDate` | да |
| `substituteId` | нет |
| `comment` | нет (для `UNPAID` — да) |

```json
{
  "employeeId": "E09", "type": "ANNUAL",
  "startDate": "2026-12-07", "endDate": "2026-12-11",
  "substituteId": "E10", "comment": "Поездка к родителям"
}
```
`201` + `Location: /api/leave-requests/7`:
```json
{
  "id": 7, "employeeId": "E09", "approverId": "E08", "type": "ANNUAL",
  "startDate": "2026-12-07", "endDate": "2026-12-11", "substituteId": "E10",
  "comment": "Поездка к родителям", "status": "PENDING", "createdAt": "2026-10-29",
  "decidedAt": null, "decisionComment": null, "days": 5
}
```

Правила (ошибки приходят `422` сразу по всем полям):

| Поле в `details` | Сообщение |
|---|---|
| `employeeId` | «Сотрудник не найден»; «У сотрудника нет руководителя — отпуск оформляется через HR-отдел» |
| `type` | «Тип отпуска: ANNUAL или UNPAID» |
| `startDate` | «Выберите дату начала»; «Отпуск можно оформить начиная с завтрашнего дня» |
| `endDate` | «Выберите дату окончания»; «Дата окончания раньше даты начала» |
| `period` | `ANNUAL`: «Недостаточно дней: доступно 11, запрошено 12» · `UNPAID`: «Отпуск без сохранения з/п — не больше 30 дней» · пересечение с заявками `PENDING`/`APPROVED` того же сотрудника: «Пересекается с заявкой 16.11–20.11» |
| `comment` | «Не больше 300 символов»; для `UNPAID` — «Укажите причину» |
| `substituteId` | «Заместитель не найден»; «Нельзя назначить заместителем себя» |

### `PUT /api/leave-requests/:id`
Только для заявок `PENDING`. Тело: `type`, `startDate`, `endDate` (обязательны), `substituteId`, `comment`. Сотрудник и согласующий не меняются.
Правила те же; собственные дни заявки не считаются ни занятыми, ни зарезервированными.
`409` — «Заявка уже не на согласовании (статус: APPROVED)».

### `DELETE /api/leave-requests/:id`
`204`. `409` — «Согласованную заявку нельзя удалить». Заявки в остальных статусах удалить можно.

---

## Решения: approve / reject / cancel

Статус меняется только этими эндпоинтами, и только из `PENDING`:

```
PENDING ──approve──▶ APPROVED
   ├─────reject───▶ REJECTED
   └─────cancel───▶ CANCELLED
```

Переход выполняется одним атомарным `UPDATE … WHERE status = 'PENDING'`: при двух одновременных запросах сработает только один, второй получит `409`.
Из любого другого статуса — `409` «Заявка уже не на согласовании (статус: …)». Нет заявки — `404`.

### `POST /api/leave-requests/:id/approve`
Тело необязательно: `{ "comment": "Хорошего отдыха" }` (до 300 символов).
`200` — заявка со `status: "APPROVED"`, `decidedAt` = сегодня, `decisionComment` = комментарий или `null`.
После этого дни попадают из `reserved` в `used`, а в журнале появляется запись `USAGE`.

### `POST /api/leave-requests/:id/reject`
Тело: `{ "reason": "Релиз 15.12, перенеси" }` — **причина обязательна** (1–300 символов).
`200` — `status: "REJECTED"`, `decidedAt` = сегодня, `decisionComment` = причина.
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Проверьте введённые данные",
  "details": { "reason": "Причина отклонения обязательна" } } }
```

### `POST /api/leave-requests/:id/cancel`
Без тела. Сотрудник отзывает свою заявку. `200` — `status: "CANCELLED"`; `decidedAt` остаётся `null` (решения руководителя не было, как в мобильном приложении).
---

## Коды ошибок

| HTTP | `error.code` | Когда |
|---|---|---|
| 400 | `BAD_REQUEST` | битый JSON; тело не объект; id заявки не число; недопустимое значение query-параметра |
| 404 | `NOT_FOUND` | ресурс или маршрут не найден |
| 409 | `CONFLICT` | дубликат; переход статуса из не-`PENDING`; удаление записи, на которую есть ссылки |
| 422 | `VALIDATION_ERROR` | ошибки полей (все сразу, `details` по именам полей) |