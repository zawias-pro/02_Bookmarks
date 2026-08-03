FROM alpine:latest AS downloader
ARG PB_VERSION=0.39.10
RUN apk add --no-cache ca-certificates unzip wget
RUN wget -O /tmp/pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
    && unzip /tmp/pocketbase.zip -d /pb \
    && chmod +x /pb/pocketbase

FROM alpine:latest
RUN apk add --no-cache ca-certificates
WORKDIR /pb
COPY --from=downloader /pb/pocketbase /pb/pocketbase
EXPOSE 8090
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--migrationsDir=/pb/pb_migrations"]
