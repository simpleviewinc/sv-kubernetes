//@ts-check
const envVar = require("env-var");
const fs = require("fs");
const { exec } = require("../utils");
const getVars = require("./getVars");

const GCLOUD_SERVICE_KEY = envVar.get("GCLOUD_SERVICE_KEY").required().asString();
const PROJECT_ID = envVar.get("PROJECT_ID").required().asString();
const ZONE = envVar.get("ZONE").required().asString();

function setup() {
	const {
		env,
		repoName
	} = getVars();

	// login to docker
	exec(`docker login -u _json_key -p "$GCLOUD_SERVICE_KEY" https://gcr.io`);

	fs.writeFileSync(`/tmp/service_key`, GCLOUD_SERVICE_KEY);

	exec(`ln -sfn /repo /sv/applications/${repoName}`);
	exec(`gcloud auth activate-service-account --key-file=/tmp/service_key`);
	exec(`gcloud config set project ${PROJECT_ID}`);
	exec(`gcloud config set compute/zone ${ZONE}`);
	exec(`USE_GKE_GCLOUD_AUTH_PLUGIN=True gcloud container clusters get-credentials ${env}`);
}

module.exports = setup;
