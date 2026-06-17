# svc-users

Микросервис для управления пользователями с использованием **NestJS** и **Prisma**. Поддерживает CRUD операции и возвращает **консистентный формат ответа** `{ success, message, data }`.

---

## 📦 Установка

```bash
# Клонируем репозиторий
git clone git@github.com:FreedomDevs/svc-users.git
cd svc-users

# Устанавливаем зависимости
npm install

# Генерация Prisma клиента
npx prisma generate

# Применяем миграции
npx prisma migrate dev --name init
```

---

## ⚡ Конфигурация

В `.env` укажи подключение к базе данных:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

---

## ⚙️ CRUD Методы (не актуально)

### 1. Создание пользователя

**POST** `/users`

**Body:**

```json
{
  "name": "John",
  "password": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "name": "John",
    "password": "hashedpassword",
    "roles": ["USER"],
    "createdAt": "2025-09-15T12:00:00.000Z",
    "updatedAt": "2025-09-15T12:00:00.000Z"
  }
}
```

---

### 2. Получение одного пользователя

**GET** `/users/:idOrName`

**Response:**

```json
{
  "success": true,
  "message": "User found successfully",
  "data": { ... }
}
```

Если пользователь не найден:

```json
{
  "success": false,
  "message": "User not found!"
}
```

---

### 3. Получение всех пользователей

**GET** `/users`

**Query Parameters:**
- `search` (optional) — часть имени для фильтрации
- `page` (optional, default = 0) — номер страницы
- `limit` (optional, default = 10) — количество пользователей на странице

**Response:**

```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": [
    {
      "id": "abc123",
      "name": "John",
      "roles": ["USER"],
      "createdAt": "2025-09-15T12:00:00.000Z",
      "updatedAt": "2025-09-15T12:00:00.000Z"
    }
  ]
}
```

**Example Request:**

```
GET /users?search=fok&page=1&limit=5
```

**Example Response:**

```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": [
    {
      "id": "abc123",
      "name": "foksik",
      "roles": ["USER"],
      "createdAt": "2025-09-15T12:00:00.000Z",
      "updatedAt": "2025-09-15T12:00:00.000Z"
    },
    {
      "id": "def456",
      "name": "Foks_f",
      "roles": ["USER"],
      "createdAt": "2025-09-15T12:05:00.000Z",
      "updatedAt": "2025-09-15T12:05:00.000Z"
    }
  ]
}
```

---

### 4. Удаление пользователя

**DELETE** `/users/:idOrName`

**Response:**

```json
{
  "success": true,
  "message": "User deleted"
}
```

Если пользователь не найден:

```json
{
  "success": false,
  "message": "User not found!"
}
```

---

## 🚀 Запуск

```bash
nest start --watch
# OR
nest start
```

---

## 🤝 Contributing

Если хочешь внести изменения или улучшения:

1. Форкни репозиторий
2. Создай ветку: `git checkout -b feature/your-feature`
3. Сделай изменения и закомить их
4. Сделай push в свою ветку и создай Pull Request

Пожалуйста, соблюдай единый стиль кода и формат ответов `{ success, message, data }`.

---

## 📝 Todos

* [ ] Добавить аутентификацию через svc-auth и svc-keys
* [X] Логирование действий пользователей
* [X] Тесты для всех CRUD методов
* [X] Добавить пагинацию и фильтрацию для `findAll`
* [X] Реализовать все методы в controller
* [X] Добавить роли и права доступа (RBAC)
