# ---------- stage 1: build ----------
FROM node:lts-alpine3.23 AS builder

WORKDIR /app

# зависимости
COPY package*.json ./
RUN npm ci

# исходники
COPY . .

# билд nest
RUN npm run build


# ---------- stage 2: production ----------
FROM node:lts-alpine3.23

WORKDIR /app

ENV NODE_ENV=production

# только package*.json для prod-зависимостей
COPY package*.json ./
RUN npm ci --omit=dev

# копируем результат сборки
COPY --from=builder /app/dist ./dist

# если есть prisma / assets / migrations — копируй явно
# COPY --from=builder /app/prisma ./prisma

CMD ["node", "dist/main.js"]

