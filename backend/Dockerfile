# syntax=docker/dockerfile:1

# --- Base stage: module dependencies, cached separately from the source ---
FROM golang:1.27-alpine AS base
WORKDIR /app
COPY go.mod go.su[m] ./
RUN go mod download

# --- Dev stage: source is bind-mounted from docker-compose ---
FROM base AS dev
ENV CGO_ENABLED=0
EXPOSE 8080
CMD ["go", "run", "./cmd/api"]

# --- Builder stage: static binary ---
FROM base AS builder
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /bin/api ./cmd/api

# --- Prod stage: minimal image holding just the binary ---
FROM gcr.io/distroless/static-debian12:nonroot AS prod
COPY --from=builder /bin/api /api
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/api"]
