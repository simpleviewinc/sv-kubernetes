export GOPATH=${HOME}/go
GO111MODULE="on" go install github.com/willyguggenheim/kubesec@a0b81f5
chmod a+x $GOPATH/bin/kubesec
cp $GOPATH/bin/kubesec /usr/local/bin/
echo kubesec_version=$(kubesec --version)
