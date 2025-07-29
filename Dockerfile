FROM ubuntu:22.04

WORKDIR /sv

COPY scripts/platform_lookup.sh \
    scripts/requireRoot.sh \
    scripts/errorHandler.sh \
    scripts/variables.sh \
    /sv/scripts/

# Install dependencies
COPY scripts/install_misc.sh /sv/scripts/install_misc.sh
RUN bash /sv/scripts/install_misc.sh

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
COPY internal/kubesec.* internal/
RUN bash /sv/scripts/install_kubesec.sh

# Install SV CLI
COPY sv/ /sv/sv/
COPY scripts/install_sv.sh /sv/scripts/install_sv.sh
COPY package.json /sv/package.json
RUN bash /sv/scripts/install_sv.sh

COPY docs /sv/docs
COPY internal /sv/internal
COPY scripts /sv/scripts
COPY Dockerfile /sv/
COPY Dockerfile.deploy /sv/
COPY docker-compose.yml /sv/

ENTRYPOINT [ "/sv/internal/docker-entrypoint.sh" ]
CMD [ "sleep", "infinity" ]
