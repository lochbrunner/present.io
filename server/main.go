package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"time"

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

func getDbConnection() (*gorm.DB, error) {
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
	return db, db_err
}

func getSlide(response http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)
	id, ok := vars["id"]
	if !ok {
		response.WriteHeader(http.StatusBadRequest)
		response.Write([]byte("id is missing in parameters"))
	}
	var slide = Slide{Data: ""}
	db, err := getDbConnection()
	if err != nil {
		response.WriteHeader(http.StatusInternalServerError)
		response.Write([]byte(err.Error()))
		return
	}
	if result := db.First(&slide, id); result.Error != nil {
		response.WriteHeader(http.StatusNotFound)
		response.Write([]byte(result.Error.Error()))
	}
	fmt.Fprintf(response, slide.Data)

}

func updateSlide(response http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)
	id, ok := vars["id"]
	if !ok {
		fmt.Println("id is missing in parameters")
	}
	db, err := getDbConnection()
	if err != nil {
		response.WriteHeader(http.StatusInternalServerError)
		response.Write([]byte(err.Error()))
	}

	// Try to decode the request body into the struct. If there is an error,
	// respond to the client with the error message and a 400 status code.
	defer request.Body.Close()
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		http.Error(response, err.Error(), http.StatusBadRequest)
		return
	}
	query := fmt.Sprintf("%v", id)
	// TODO: Error handling
	db.Model(&Slide{}).Where(query, true).Update("data", string(body))
}

func createSlide(response http.ResponseWriter, request *http.Request) {
	var slide = Slide{Data: "[]"}
	db, err := getDbConnection()
	if err != nil {
		response.WriteHeader(http.StatusInternalServerError)
		response.Write([]byte(err.Error()))
		return
	}
	if result := db.Create(&slide); result.Error != nil {
		response.WriteHeader(http.StatusInternalServerError)
		response.Write([]byte(result.Error.Error()))
	}
	fmt.Fprintf(response, fmt.Sprint(slide.ID))
}

func initDb(db gorm.DB) {
	db.Migrator().CreateTable(&Slide{})
}

func try_connect(timeout int) {
	port := getenv("DB_PORT", "3306")
	host := getenv("DB_HOST", "127.0.0.1")
	timeout_d := time.Duration(timeout) * time.Second
	conn, err := net.DialTimeout("tcp", net.JoinHostPort(host, port), timeout_d)
	if err != nil {
		log.Fatal("Connecting error:", err)
	}
	if conn != nil {
		defer conn.Close()
	}
}

func main() {
	var createDb = flag.Bool("create-database", false, "Creates empty database if set")
	var port = flag.Int64("port", 3000, "Port to listen")
	var timeout = flag.Int("timeout", 10, "Time in seconds to wait for the database")
	flag.Parse()

	try_connect(*timeout)
	if *createDb {
		log.Println("Creating fresh database")
		db, err := getDbConnection()
		if err != nil {

		}
		initDb(*db)
	}

	r := mux.NewRouter()
	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/slide/{id}", getSlide).Methods("GET")
	api.HandleFunc("/slide/{id}", updateSlide).Methods("POST")
	api.HandleFunc("/slide", createSlide).Methods("PUT")
	fs := http.FileServer(http.Dir("./docs"))
	r.PathPrefix("/").Handler(fs)

	log.Printf("Listening on :%d...", *port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", *port), r)
	if err != nil {
		log.Fatal(err)
	}
}
