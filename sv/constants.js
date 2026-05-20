const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");
const env = require("env-var");

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
    quiet: true,
});

/** Folder path where applications are found. */
module.exports.APPS_FOLDER = env.get("APPS_FOLDER").default("/sv/applications").asString();
module.exports.CONTAINERS_FOLDER = env.get("CONTAINERS_FOLDER").default("/sv/containers").asString();
module.exports.GRAPH_URL = "https://graphql.simpleviewinc.com";
module.exports.REFRESH_TOKEN_PATH = "/sv/internal/refresh_token";
module.exports.AUTH_TOKEN_PATH = "/sv/internal/auth_token";
module.exports.LOCAL_CONTEXT_MINIKUBE = "minikube";
module.exports.LOCAL_CONTEXT_DESKTOP = "docker-desktop";
// fs.existsSync is a hack until we have all devs off the wsl-variant
module.exports.IS_DOCKER_DESKTOP = process.env.IS_DOCKER_DESKTOP === "true" || fs.existsSync("/etc/wsl.conf");
/** Location where Kubernetes can mount content */
module.exports.SV_KUBERNETES_MOUNT_PATH = env.get("SV_KUBERNETES_MOUNT_PATH").default("/run/desktop/mnt/host/c/sv-kubernetes").asString();
