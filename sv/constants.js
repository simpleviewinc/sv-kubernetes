const fs = require("fs");

/** Folder path where applications are found. */
module.exports.APPS_FOLDER = process.env.APPS_FOLDER || "/sv/applications";
module.exports.CONTAINERS_FOLDER = "/sv/containers";
module.exports.GRAPH_URL = "https://graphql.simpleviewinc.com";
module.exports.REFRESH_TOKEN_PATH = "/sv/internal/refresh_token";
module.exports.AUTH_TOKEN_PATH = "/sv/internal/auth_token";
module.exports.LOCAL_CONTEXT_MINIKUBE = "minikube";
module.exports.LOCAL_CONTEXT_DESKTOP = "docker-desktop";
// fs.existsSync is a hack until we have all devs off the wsl-variant
module.exports.IS_DOCKER_DESKTOP = process.env.IS_DOCKER_DESKTOP === "true" || fs.existsSync("/etc/wsl.conf");
/** Location where Kubernetes can mount content */
module.exports.SV_KUBERNETES_MOUNT_PATH = process.env.SV_KUBERNETES_MOUNT_PATH ?? `/run/desktop/mnt/host/c/sv-kubernetes`;
