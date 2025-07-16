FROM ubuntu:22.04

COPY \
    scripts/platform_lookup.sh \
    scripts/requireRoot.sh \
    scripts/errorHandler.sh \
    scripts/variables.sh \
    /sv/scripts/

# Install dependencies
RUN apt-get update && \
	apt-get install -y git xz-utils curl software-properties-common

# Install GCloud
COPY scripts/install_gcloud.sh /sv/scripts/install_gcloud.sh
RUN bash /sv/scripts/install_gcloud.sh

# Install Docker
COPY scripts/install_docker.sh /sv/scripts/install_docker.sh
RUN bash /sv/scripts/install_docker.sh

# Install kubectl
COPY scripts/install_kubectl.sh /sv/scripts/install_kubectl.sh
RUN bash /sv/scripts/install_kubectl.sh

# Install Helm
COPY scripts/install_helm.sh /sv/scripts/install_helm.sh
RUN bash /sv/scripts/install_helm.sh

# Install kubesec
COPY scripts/install_kubesec.sh /sv/scripts/install_kubesec.sh
COPY internal/kubesec.* /sv/internal/
RUN bash /sv/scripts/install_kubesec.sh

# Install SV CLI
COPY sv/ /sv/sv/
COPY scripts/install_sv.sh /sv/scripts/install_sv.sh
RUN bash /sv/scripts/install_sv.sh

# Install deploy scripts
COPY deploy/gcp/lib /app/lib
COPY deploy/gcp/scripts /app/scripts
COPY deploy/gcp/docker-entrypoint.sh /docker-entrypoint.sh

WORKDIR /app

ENTRYPOINT [ "/docker-entrypoint.sh" ]
