// Composition root of the application: reads configuration, wires the layers, registers the
// routes and starts the HTTP server. Business logic lives in internal/service; HTTP mapping in
// internal/controller.
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"backend/internal/controller"
	"backend/internal/service"
)

const (
	defaultPort          = "8080"
	defaultAllowedOrigin = "http://localhost:5173"
	readHeaderTimeout    = 5 * time.Second
	readTimeout          = 10 * time.Second
	writeTimeout         = 10 * time.Second
)

func main() {
	evaluatorController := controller.NewEvaluator(service.NewEvaluator())

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/v1/evaluate", evaluatorController.Evaluate)
	mux.HandleFunc("GET /api/v1/health", evaluatorController.Health)

	server := &http.Server{
		Addr:              ":" + envOrDefault("PORT", defaultPort),
		Handler:           controller.CORS(envOrDefault("ALLOWED_ORIGIN", defaultAllowedOrigin), mux),
		ReadHeaderTimeout: readHeaderTimeout,
		ReadTimeout:       readTimeout,
		WriteTimeout:      writeTimeout,
	}

	log.Printf("API listening on %s", server.Addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("could not start the server: %v", err)
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
