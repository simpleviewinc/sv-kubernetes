. /sv/scripts/errorHandler.sh

SV_CRONPATH=/var/spool/cron/${USER}

echo "Creating cron for ${USER}"
touch ${SV_CRONPATH}
/usr/bin/crontab ${SV_CRONPATH}

echo "[Scheduling Cron Job] - Docker Cleaner"
echo "0 0 * * FRI /usr/bin/docker system prune -f >/dev/null 2>&1" >> ${SV_CRONPATH}

echo "Validating Cron Jobs..."
crontab -u root -l