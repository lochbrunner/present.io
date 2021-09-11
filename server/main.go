package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if len(value) == 0 {
		return fallback
	}
	return value
}

type Slide struct {
	ID   uint `gorm:"primaryKey"`
	Data string
}

func getDbConnection() *gorm.DB {
	host := getenv("DB_HOST", "127.0.0.1")
	port := getenv("DB_PORT", "3306")
	user := getenv("DB_USER", "root")
	password := getenv("DB_PASSWORD", "pas123")
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/main?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port)
	log.Println(fmt.Sprintf("Connecting to %s", dsn))
	db, db_err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if db_err != nil {
		log.Fatal(db_err)
	}
	return db
}

func getSlide(responseWriter http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)
	id, ok := vars["id"]
	if !ok {
		fmt.Println("id is missing in parameters")
	}
	var slide = Slide{Data: ""}
	db := getDbConnection()
	db.First(&slide, id)
	fmt.Fprintf(responseWriter, slide.Data)
}

func updateSlide(responseWriter http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)
	id, ok := vars["id"]
	if !ok {
		fmt.Println("id is missing in parameters")
	}
	db := getDbConnection()

	// Try to decode the request body into the struct. If there is an error,
	// respond to the client with the error message and a 400 status code.
	defer request.Body.Close()
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		http.Error(responseWriter, err.Error(), http.StatusBadRequest)
		return
	}
	query := fmt.Sprintf("%v", id)
	db.Model(&Slide{}).Where(query, true).Update("data", string(body))
}

func createSlide(responseWriter http.ResponseWriter, request *http.Request) {
	var slide = Slide{Data: "[]"}
	db := getDbConnection()
	db.Create(&slide)
	fmt.Fprintf(responseWriter, fmt.Sprint(slide.ID))
}

func initDb(db gorm.DB) {
	db.Migrator().CreateTable(&Slide{})
}

func main() {
	var createDb = flag.Bool("create-database", false, "Creates empty database if set")
	var port = flag.Int("port", 3000, "Port to listen")
	flag.Parse()

	if *createDb {
		log.Println("Creating fresh database")
		db := getDbConnection()
		initDb(*db)
	}

	r := mux.NewRouter()
	r.HandleFunc("/api/slide/{id}", getSlide).Methods("GET")
	r.HandleFunc("/api/slide/{id}", updateSlide).Methods("POST")
	r.HandleFunc("/api/slide", createSlide).Methods("PUT")
	fs := http.FileServer(http.Dir("./docs"))
	r.PathPrefix("/").Handler(fs)

	log.Printf("Listening on :%d...", *port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", *port), r)
	if err != nil {
		log.Fatal(err)
	}
}
