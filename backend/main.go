package main

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/antimatter-studios/taskhauler/backend/internal/auth"
	"github.com/antimatter-studios/taskhauler/backend/internal/events"
	"github.com/antimatter-studios/taskhauler/backend/internal/handlers"
	"github.com/antimatter-studios/taskhauler/backend/internal/openapi"
	"github.com/antimatter-studios/taskhauler/backend/internal/storage"
	"github.com/antimatter-studios/taskhauler/backend/internal/users"
)

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// Best-effort .env load; ignore error.
	_ = godotenv.Load()

	dsn := envOr("DATABASE_URL", "postgres://taskhauler:taskhauler@postgres:5432/taskhauler?sslmode=disable")
	jwtSecret := envOr("JWT_SECRET", "")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET env var is required")
	}

	adminEmail := os.Getenv("ADMIN_EMAIL")
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	usedDefaults := false
	if adminEmail == "" {
		adminEmail = "admin@taskhauler.localhost"
		usedDefaults = true
	}
	if adminPassword == "" {
		adminPassword = "admin"
		usedDefaults = true
	}

	conn, err := storage.Open(dsn)
	if err != nil {
		log.Fatalf("storage: %v", err)
	}
	if err := auth.AutoMigrate(conn); err != nil {
		log.Fatalf("auth automigrate: %v", err)
	}
	if err := auth.SeedAdmin(conn, adminEmail, adminPassword, usedDefaults); err != nil {
		log.Fatalf("seed admin: %v", err)
	}

	db := storage.NewDB(conn)
	emitter := events.NewLogger()
	userCache := users.New(conn, 5*time.Minute)

	issuer := auth.NewIssuer(jwtSecret)
	mw := auth.NewMiddleware(conn, issuer)
	authH := auth.NewHandler(conn, issuer)
	h := handlers.New(db, emitter, userCache)

	router := gin.Default()
	router.Use(corsMiddleware())

	// OpenAPI spec generator (AST-scans handler annotations at runtime).
	spec := openapi.New()

	api := router.Group("/api/v1")

	// Public routes
	api.GET("/health", h.Health)
	api.POST("/auth/login", authH.Login)
	api.POST("/auth/refresh", authH.Refresh)

	// OpenAPI spec endpoint (public; useful for code-gen + docs UIs).
	api.GET("/openapi.json", func(c *gin.Context) {
		c.JSON(200, spec.Map())
	})

	// Authenticated routes
	authed := api.Group("")
	authed.Use(mw.RequireAuth())

	authed.GET("/auth/me", authH.Me)
	authed.POST("/auth/logout", authH.Logout)

	// Service accounts (admin-only)
	sa := authed.Group("/service-accounts")
	sa.Use(mw.RequireAdmin())
	sa.GET("", authH.ListServiceAccounts)
	sa.GET("/", authH.ListServiceAccounts)
	sa.POST("", authH.CreateServiceAccount)
	sa.POST("/", authH.CreateServiceAccount)
	sa.POST("/:id/tokens", authH.IssueToken)
	sa.DELETE("/tokens/:token_id", authH.RevokeToken)

	// Boards
	authed.GET("/boards", h.ListBoards)
	authed.POST("/boards", h.CreateBoard)
	authed.GET("/boards/:id", h.GetBoard)
	authed.PUT("/boards/:id", h.UpdateBoard)
	authed.DELETE("/boards/:id", h.DeleteBoard)

	// Columns
	authed.GET("/boards/:id/columns", h.ListColumns)
	authed.POST("/boards/:id/columns", h.CreateColumn)
	authed.PUT("/boards/:id/columns/:cid", h.UpdateColumn)
	authed.DELETE("/boards/:id/columns/:cid", h.DeleteColumn)

	// Epics
	authed.GET("/boards/:id/epics", h.ListEpics)
	authed.POST("/boards/:id/epics", h.CreateEpic)
	authed.PUT("/boards/:id/epics/:eid", h.UpdateEpic)
	authed.DELETE("/boards/:id/epics/:eid", h.DeleteEpic)

	// Cards
	authed.GET("/boards/:id/cards/search", h.SearchCards)
	authed.GET("/boards/:id/cards", h.ListCards)
	authed.POST("/boards/:id/cards", h.CreateCard)
	authed.PUT("/boards/:id/cards/:cid", h.UpdateCard)
	authed.DELETE("/boards/:id/cards/:cid", h.DeleteCard)

	// Single card by ID or by board+number
	authed.GET("/cards/:cid", h.GetCard)
	authed.GET("/boards/:id/cards/number/:num", h.GetCardByNumber)

	// Comments
	authed.GET("/cards/:cid/comments", h.ListComments)
	authed.POST("/cards/:cid/comments", h.CreateComment)
	authed.DELETE("/cards/:cid/comments/:cmid", h.DeleteComment)

	// MCP tool discovery + execution
	authed.GET("/mcp", h.GetTools)
	authed.POST("/mcp/list_boards", h.MCPListBoards)
	authed.POST("/mcp/create_board", h.MCPCreateBoard)
	authed.POST("/mcp/rename_board", h.MCPRenameBoard)
	authed.POST("/mcp/delete_board", h.MCPDeleteBoard)
	authed.POST("/mcp/list_epics", h.MCPListEpics)
	authed.POST("/mcp/create_epic", h.MCPCreateEpic)
	authed.POST("/mcp/update_epic", h.MCPUpdateEpic)
	authed.POST("/mcp/delete_epic", h.MCPDeleteEpic)
	authed.POST("/mcp/list_tasks", h.MCPListTasks)
	authed.POST("/mcp/list_tasks_by_status", h.MCPListTasksByStatus)
	authed.POST("/mcp/create_task", h.MCPCreateTask)
	authed.POST("/mcp/set_task_state", h.MCPSetTaskState)
	authed.POST("/mcp/update_task", h.MCPUpdateTask)
	authed.POST("/mcp/search_tasks", h.MCPSearchTasks)
	authed.POST("/mcp/add_comment", h.MCPAddComment)

	addr := ":" + envOr("PORT", "8080")
	log.Printf("taskhauler-backend listening on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatal(err)
	}
}

// corsMiddleware builds the CORS handler from env + sensible defaults.
func corsMiddleware() gin.HandlerFunc {
	origins := []string{"http://taskhauler.localhost", "http://localhost:3000"}
	if extra := os.Getenv("CORS_ALLOWED_ORIGINS"); extra != "" {
		for _, o := range strings.Split(extra, ",") {
			o = strings.TrimSpace(o)
			if o != "" {
				origins = append(origins, o)
			}
		}
	}
	cfg := cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	return cors.New(cfg)
}
