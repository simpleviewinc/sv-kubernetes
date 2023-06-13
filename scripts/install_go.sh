. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh
. /sv/scripts/variables.sh

current_go_version=$(go version 2> /dev/null || true)
expected_go_version="go version go$go_version linux/amd64"

if [ "$current_go_version" != "$expected_go_version" ]; then
	cd /tmp
	curl -Lo go.tar.gz https://go.dev/dl/go$go_version.linux-amd64.tar.gz
	rm -rf /usr/local/go
	tar -C /usr/local -xzf go.tar.gz
	ln -s /usr/local/go/bin/go /usr/bin/go
	ln -s /usr/local/go/bin/gofmt /usr/bin/gofmt
	rm -rf /tmp/go.tar.gz
fi
