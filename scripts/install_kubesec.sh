
cd /tmp
curl -Lo kubesec https://github.com/shyiko/kubesec/releases/download/0.9.2/kubesec-0.9.2-linux-amd64
	chmod a+x kubesec
	mv kubesec /usr/local/bin/
echo kubesec_version=$(kubesec --version)