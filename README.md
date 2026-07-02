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

## ⚙️ документация

Актуальная документация доступна в основном репозитории: [svcLibs](https://github.com/FreedomDevs/svcLibs/blob/master/docs/svc-users.md)

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

Пожалуйста, соблюдай единый стиль кода и формат ответов из [ApiGuideline](https://github.com/FreedomDevs/API_Guidelines).
