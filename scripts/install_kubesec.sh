. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh
. /sv/scripts/variables.sh

# Binaries downloaded from https://github.com/tk3fftk/kubesec
cp /sv/internal/kubesec.${PLATFORM} /usr/local/bin/kubesec
chmod a+x /usr/local/bin/kubesec
