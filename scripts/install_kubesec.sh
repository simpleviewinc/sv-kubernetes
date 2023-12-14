. /sv/scripts/platform_lookup.sh

if [[ "${PLATFORM}" = "arm64" ]]; then
  # Rebuild kubesec from source to run on ARM64
  export GOPATH=${HOME}/go
  GO111MODULE="on" go install github.com/willyguggenheim/kubesec@latest
  chmod a+x $GOPATH/bin/kubesec
  cp $GOPATH/bin/kubesec /usr/local/bin/
else
  cd /tmp
  curl -Lo kubesec https://github.com/shyiko/kubesec/releases/download/0.9.2/kubesec-0.9.2-linux-amd64
  chmod a+x kubesec
  mv kubesec /usr/local/bin/
fi
echo kubesec_version=$(kubesec --version)
