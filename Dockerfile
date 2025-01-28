FROM ubuntu:22.04

# Variables
ENV KUBECONFIG=/.kube/config \
    NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/netskope.crt

COPY scripts/platform_lookup.sh scripts/requireRoot.sh scripts/errorHandler.sh scripts/variables.sh /sv/scripts/
COPY internal/ /sv/internal/

# Intsall dependencies
COPY scripts/install_misc.sh /sv/scripts/install_misc.sh
RUN bash /sv/scripts/install_misc.sh && \
    cp /sv/internal/ssl/*.crt /usr/local/share/ca-certificates/ && \
    update-ca-certificates && \
    apt-get update && \
    apt-get install -y nano && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Github
COPY scripts/install_github.sh /sv/scripts/install_github.sh
RUN bash /sv/scripts/install_github.sh

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
RUN bash /sv/scripts/install_kubesec.sh

# Install SV CLI
COPY sv/ /sv/sv/
COPY scripts/install_sv.sh /sv/scripts/install_sv.sh
RUN bash /sv/scripts/install_sv.sh

COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
ENTRYPOINT [ "/docker-entrypoint.sh" ]
CMD [ "sleep", "infinity" ]
