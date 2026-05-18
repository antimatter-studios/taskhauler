# ----------- Dev stage -----------
FROM node:22-alpine AS dev
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# Source is bind-mounted at runtime for HMR; copy is just to make the image
# usable standalone if needed.
COPY . .

EXPOSE 3001
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "3001"]

# ----------- Builder stage -----------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# ----------- Prod stage -----------
FROM nginx:1.27-alpine AS prod

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
