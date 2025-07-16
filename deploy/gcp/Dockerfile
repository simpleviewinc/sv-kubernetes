FROM ubuntu:18.04

ARG SV_KUBERNETES_BRANCH=master

# install necessary tools
RUN apt-get update && \
	apt-get install -y git xz-utils curl software-properties-common

# get latest version of sv-kubernetes
ADD https://api.github.com/repos/simpleviewinc/sv-kubernetes/git/refs/heads/${SV_KUBERNETES_BRANCH} version.json
RUN git clone -b ${SV_KUBERNETES_BRANCH} https://github.com/simpleviewinc/sv-kubernetes /sv

# install other dependencies
RUN bash /sv/scripts/install_sv.sh
RUN bash /sv/scripts/install_gcloud.sh
RUN bash /sv/scripts/install_kubectl.sh
RUN bash /sv/scripts/install_docker.sh
RUN bash /sv/scripts/install_helm.sh
RUN bash /sv/scripts/install_kubesec.sh

ENV GOOGLE_APPLICATION_CREDENTIALS=/tmp/service_key

RUN helm init --client-only && \
	helm plugin install https://github.com/rimusz/helm-tiller

# 2/7/2022 helm tiller install no longer functions due to deprecations
# This hack copies the binary from a built docker image
COPY --from=helmpack/tiller:v2.17.0 /tiller /root/.helm/plugins/helm-tiller/bin/

COPY lib /app/lib
COPY scripts /app/scripts

WORKDIR /app