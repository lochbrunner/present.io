package main

import (
	"encoding/json"
	"flag"
	"fmt"
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

var availableSlides [2]Slide = [2]Slide{
	{Data: ""},
	{Data: ""},
}

func allSlides(responseWriter http.ResponseWriter, request *http.Request) {
	availableSlidesJSON, err := json.Marshal(availableSlides)

	if err != nil {
		panic("Could not marshal json.")
	}

	fmt.Fprintf(responseWriter, string(availableSlidesJSON))
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
	var slide Slide
	db := getDbConnection()

	// Try to decode the request body into the struct. If there is an error,
	// respond to the client with the error message and a 400 status code.
	err := json.NewDecoder(request.Body).Decode(&slide)
	if err != nil {
		http.Error(responseWriter, err.Error(), http.StatusBadRequest)
		return
	}
	query := fmt.Sprintf("%v", id)
	db.Model(&Slide{}).Where(query, true).Update("data", slide.Data)
}

func createSlide(responseWriter http.ResponseWriter, request *http.Request) {
	var slide = Slide{Data: "{}"}
	db := getDbConnection()
	db.Create(&slide)
	fmt.Fprintf(responseWriter, fmt.Sprint(slide.ID))
}

func initDb(db gorm.DB) {
	db.Migrator().CreateTable(&Slide{})
}

func main() {
	var createDb = flag.Bool("create-database", false, "Creates empty database if set")

	flag.Parse()
	if *createDb {
		log.Println("Creating fresh database")
		db := getDbConnection()
		initDb(*db)
	}

	fs := http.FileServer(http.Dir("./docs"))

	r := mux.NewRouter()
	r.HandleFunc("/api/slide/{id}", getSlide).Methods("GET")
	r.HandleFunc("/api/slide/{id}", updateSlide).Methods("POST")
	r.HandleFunc("/api/slide", createSlide).Methods("PUT")
	r.HandleFunc("/api/allslides/{searchTerm}", allSlides)
	r.PathPrefix("/").Handler(fs)
	err := http.ListenAndServe(":3000", r)
	log.Println("Listening on :3000...")
	if err != nil {
		log.Fatal(err)
	}
}
