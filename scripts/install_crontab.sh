. /sv/scripts/errorHandler.sh

SV_CRONPATH=/var/spool/cron/sv_cron
cp /sv/internal/cron ${SV_CRONPATH}

/usr/bin/crontab ${SV_CRONPATH}

crontab -u root -l