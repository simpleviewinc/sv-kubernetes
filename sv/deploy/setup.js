//@ts-check
const envVar = require("env-var");
const fs = require("fs");
const { exec } = require("../utils");
const getVars = require("./getVars");

const LEGACY_AUTH = envVar.get("LEGACY_AUTH").default("false").asBool();
const GCLOUD_SERVICE_KEY = LEGACY_AUTH === true ? envVar.get("GCLOUD_SERVICE_KEY").required().asString() : envVar.get("GCLOUD_SERVICE_KEY").asString();
const PROJECT_ID = envVar.get("PROJECT_ID").required().asString();
const ZONE = envVar.get("ZONE").required().asString();

function setup() {
	const {
		env,
		repoName
	} = getVars();

	// login to docker
	if (LEGACY_AUTH === true) {
		console.warn("------------------");
		console.warn([
			"DEPRECATED: Usage of legacy authentication is deprecated. Please refer to ORB documentation: https://circleci.com/developer/orbs/orb/simpleviewinc/circleci-config#setup_gcp",
			"            Implement ORB v2+ and remove LEGACY_AUTH from project settings to be compliant with future releases"
		].join("\n"));
		console.warn("------------------");

		exec(`docker login -u _json_key -p "$GCLOUD_SERVICE_KEY" https://gcr.io`);
		fs.writeFileSync(`/tmp/service_key`, GCLOUD_SERVICE_KEY);
		exec(`gcloud auth activate-service-account --key-file=/tmp/service_key`);
	}

	exec(`ln -sfn /repo /sv/applications/${repoName}`);
	exec(`gcloud config set project ${PROJECT_ID}`);
	exec(`gcloud config set compute/zone ${ZONE}`);
	exec(`USE_GKE_GCLOUD_AUTH_PLUGIN=True gcloud container clusters get-credentials ${env}`);
}

module.exports = setup;
