# ---------- stage 1: build ----------
FROM node:18-alpine AS builder
RUN apk add --no-cache python3 make g++

WORKDIR /app

# зависимости
RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=package-lock.json,target=package-lock.json \
  npm ci

COPY src prisma test eslint-config.mjs tsconfig.build.json tsconfig.json \
  ./
RUN npx prisma generate
RUN npm run build


# ---------- stage 2: production ----------
FROM node:lts-alpine3.23
RUN apk add --no-cache python3 make g++

WORKDIR /app

ENV NODE_ENV=production

RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=package-lock.json,target=package-lock.json \
  RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]

