# ----------- Dev stage -----------
FROM node:22-alpine AS dev
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Source is bind-mounted at runtime for HMR; copy is just to make the image
# usable standalone if needed.
COPY . .

EXPOSE 3002
CMD ["pnpm", "exec", "vite", "--host", "0.0.0.0", "--port", "3002"]

# ----------- Builder stage -----------
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ----------- Prod stage -----------
FROM nginx:1.27-alpine AS prod

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
