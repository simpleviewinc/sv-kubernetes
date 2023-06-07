. /sv/scripts/errorHandler.sh

apt-get update
# removes man-db since it just slows down apt-get installs and doesn't provide value for us
apt-get remove -y --purge man-db
apt-get install -y \
		ca-certificates \
		curl \
		gnupg \
		lsb-release \
		apt-transport-https \
		jq
