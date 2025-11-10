//@ts-check
const envVar = require("env-var");
const fs = require("fs");
const { exec } = require("../utils");
const getVars = require("./getVars");

const PROJECT_ID = envVar.get("PROJECT_ID").required().asString();
const ZONE = envVar.get("ZONE").required().asString();

function authWithWifOrKey() {
  const wifJsonB64 = process.env.GCP_WIF_CRED_JSON_B64;
  const oidcToken = process.env.CIRCLE_OIDC_TOKEN;
  let authed = false;

  // Try WIF
  if (wifJsonB64 && oidcToken) {
    try {
      console.log("Attempting WIF authentication in setup.js...");
      const wifJson = Buffer.from(wifJsonB64, "base64").toString("utf8");
      fs.writeFileSync("/tmp/gcp-wif-cred.json", wifJson, { mode: 0o600 });
      fs.writeFileSync("/tmp/oidc_token", oidcToken, { mode: 0o600 });
      process.env.GOOGLE_APPLICATION_CREDENTIALS = "/tmp/gcp-wif-cred.json";


      exec(
        `gcloud auth login --cred-file=${process.env.GOOGLE_APPLICATION_CREDENTIALS}`
      );
      exec(`gcloud auth configure-docker gcr.io -q`);
      authed = true;
      console.log("WIF authentication successful.");
    } catch (err) {
      console.log(
        "WIF authentication failed in setup.js; will try GCLOUD_SERVICE_KEY fallback if available."
      );
    }
  }

  // Fallback to GCLOUD_SERVICE_KEY
  if (!authed) {
    const key = process.env.GCLOUD_SERVICE_KEY;
    if (!key) {
      throw new Error(
        "No authentication available: WIF not usable and GCLOUD_SERVICE_KEY is not set."
      );
    }
    console.log("Authenticating with GCLOUD_SERVICE_KEY (fallback) in setup.js...");

    fs.writeFileSync("/tmp/service_key.json", key, { mode: 0o600 });
    exec(`gcloud auth activate-service-account --key-file=/tmp/service_key.json`);
    exec(`gcloud auth configure-docker gcr.io -q`);
  }
}

function setup() {
	const {
		env,
		repoName
	} = getVars();

	authWithWifOrKey();

	exec(`ln -sfn /repo /sv/applications/${repoName}`);
	exec(`gcloud config set project ${PROJECT_ID}`);
	exec(`gcloud config set compute/zone ${ZONE}`);
	exec(`USE_GKE_GCLOUD_AUTH_PLUGIN=True gcloud container clusters get-credentials ${env}`);
}

module.exports = setup;
