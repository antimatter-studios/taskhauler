# syntax=docker/dockerfile:1.7

# ── Builder ────────────────────────────────────────────────────────────────────
FROM golang:1.26-alpine AS builder

RUN apk add --no-cache git gcc musl-dev

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /taskhauler-backend . \
 && CGO_ENABLED=1 GOOS=linux go build -trimpath -ldflags="-s -w -linkmode external -extldflags=-static" -o /taskhauler-import-sqlite ./cmd/import-sqlite \
 && CGO_ENABLED=1 GOOS=linux go build -trimpath -ldflags="-s -w -linkmode external -extldflags=-static" -o /taskhauler-import-users ./cmd/import-users

# ── Dev (hot reload via air) ───────────────────────────────────────────────────
FROM golang:1.26-alpine AS dev

RUN apk add --no-cache git gcc musl-dev curl

ENV GOFLAGS=-buildvcs=false
RUN go install github.com/air-verse/air@latest

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .

EXPOSE 8080
CMD ["air"]

# ── Production ─────────────────────────────────────────────────────────────────
FROM alpine:3.19 AS prod

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S taskhauler \
    && adduser -S -G taskhauler taskhauler

COPY --from=builder /taskhauler-backend /usr/local/bin/taskhauler-backend
COPY --from=builder /taskhauler-import-sqlite /usr/local/bin/taskhauler-import-sqlite
COPY --from=builder /taskhauler-import-users /usr/local/bin/taskhauler-import-users

USER taskhauler
EXPOSE 8080
CMD ["/usr/local/bin/taskhauler-backend"]
