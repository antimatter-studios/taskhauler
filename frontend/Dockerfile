# syntax=docker/dockerfile:1.7

# ── Dev stage ───────────────────────────────────────────────────────────────
# Used by the Taskfile dev workflow with a bind mount over /app and an
# anonymous volume protecting /app/node_modules.
FROM node:22-alpine AS dev
WORKDIR /app
# Enable corepack-bundled pnpm so the image doesn't need a global npm install.
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# ── Builder stage ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# ── Prod stage ──────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
