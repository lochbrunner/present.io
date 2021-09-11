FROM golang AS go-builder

COPY server ./server
COPY docs ./docs
COPY go.mod .
COPY go.sum .

ENV GOPATH=/go/delivery
RUN go mod download
RUN go mod verify
RUN GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" server/main.go

EXPOSE 3000
ENTRYPOINT ["/go/main"]

# FROM alpine
# # FROM scratch

# COPY --from=go-builder /go/main /main
# COPY --from=go-builder /go/docs /docs/

# EXPOSE 3000
# ENTRYPOINT ["/main"]