# syntax=docker/dockerfile:1

# --- Base stage: dependencies installed with pnpm ---
FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- Dev stage: Vite dev server with hot reload (source bind-mounted) ---
FROM base AS dev
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# --- Builder stage: static build ---
FROM base AS builder
COPY . .
RUN pnpm build

# --- Prod stage: static assets served by Nginx ---
FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
