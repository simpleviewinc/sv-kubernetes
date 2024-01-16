export GOPATH=${HOME}/go
# install the module
GO111MODULE="on" go install github.com/willyguggenheim/kubesec@a0b81f5
# copy it into our bin
cp $GOPATH/bin/kubesec /usr/local/bin/
chmod a+x /usr/local/bin/kubesec
# remove content used to compile it
rm -rf $GOPATH
