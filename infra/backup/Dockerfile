# OMDALA Backup Service (P4)
# pg_dump + WAL-G + cron

FROM postgres:17-alpine

RUN apk add --no-cache \
  curl \
  ca-certificates \
  aws-cli \
  cronie

# Install WAL-G
RUN wget -qO /usr/local/bin/wal-g https://github.com/wal-g/wal-g/releases/download/v3.0.3/wal-g-pg-ubuntu-20.04-amd64 \
  && chmod +x /usr/local/bin/wal-g

WORKDIR /app

COPY backup-db.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup-db.sh

# Cron: daily at 02:00 UTC
RUN echo "0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/backup.log 2>&1" | crontab -

CMD ["crond", "-f", "-l", "8"]
