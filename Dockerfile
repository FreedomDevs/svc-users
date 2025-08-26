FROM golang:1.24-alpine AS builder
WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o usersvc cmd/usersvc/main.go

FROM alpine:3.18
WORKDIR /app
COPY --from=builder /app/usersvc .
COPY configs configs

EXPOSE 8080
CMD ["./usersvc"]

