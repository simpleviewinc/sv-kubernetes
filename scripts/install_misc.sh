. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh

apt-get update
# removes man-db since it just slows down apt-get installs and doesn't provide value for us
apt-get remove -y --purge man-db
apt-get install -y \
		ca-certificates \
		curl \
		gnupg \
		lsb-release \
		apt-transport-https \
		xz-utils \
		jq \
		bind9-dnsutils \
		inetutils-telnet \
		xz-utils \
		nano \
		traceroute \
		git
