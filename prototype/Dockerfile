# Taskhauler v2 design prototype — pure-static nginx serve.
#
# The prototype is React + Babel-in-browser via CDN; no build step needed.
# `task prototype:dev` bind-mounts the source at runtime so edits show up
# on browser refresh. `task prototype:prod` builds an image with files
# baked in — useful for sharing a self-contained deploy.

FROM nginx:1.27-alpine AS dev

# In dev the directory is bind-mounted by the Taskfile at runtime. The
# image itself only needs nginx + a tiny config that disables caching so
# JSX edits show up immediately on refresh.
RUN printf '%s\n' \
    'server {' \
    '  listen 80;' \
    '  server_name _;' \
    '  root /usr/share/nginx/html;' \
    '  index index.html;' \
    '  # Babel-in-browser compiles JSX on every load — disable caching so' \
    '  # edits to *.jsx are picked up on refresh in dev mode.' \
    '  location / {' \
    '    add_header Cache-Control "no-store, no-cache, must-revalidate";' \
    '    try_files $uri $uri/ /index.html;' \
    '  }' \
    '}' > /etc/nginx/conf.d/default.conf

FROM nginx:1.27-alpine AS prod
RUN printf '%s\n' \
    'server {' \
    '  listen 80;' \
    '  server_name _;' \
    '  root /usr/share/nginx/html;' \
    '  index index.html;' \
    '  location / {' \
    '    try_files $uri $uri/ /index.html;' \
    '  }' \
    '  location ~* \.(?:jsx|html|css|js)$ {' \
    '    expires 1h;' \
    '    access_log off;' \
    '  }' \
    '}' > /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
