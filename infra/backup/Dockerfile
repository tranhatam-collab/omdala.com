# OMDALA Backup Service (P4)
# pg_dump + WAL-G + cron + optional B2
# NOTE: Using Debian-based image because WAL-G binary requires glibc.

FROM postgres:17-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  ca-certificates \
  unzip \
  cron \
  awscli \
  && rm -rf /var/lib/apt/lists/*

# Install Backblaze B2 CLI (optional secondary backup)
RUN curl -fsSL -o /tmp/b2.zip https://github.com/Backblaze/B2_Command_Line_Tool/releases/latest/download/b2-linux.zip \
  && unzip -q /tmp/b2.zip -d /usr/local/bin/ \
  && chmod +x /usr/local/bin/b2 \
  && rm /tmp/b2.zip

# Install WAL-G (v3.0.3, Ubuntu 20.04 amd64 — glibc compatible with Debian)
RUN wget -qO /usr/local/bin/wal-g https://github.com/wal-g/wal-g/releases/download/v3.0.3/wal-g-pg-ubuntu-20.04-amd64 \
  && chmod +x /usr/local/bin/wal-g \
  && wal-g --version

WORKDIR /app

COPY backup-db.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup-db.sh

# Cron: daily at 02:00 UTC
RUN echo "0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/backup.log 2>&1" | crontab -

CMD ["cron", "-f", "-l", "2"]
