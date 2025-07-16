const fs = require("fs");
const exec = require("./exec");
const getVars = require("./getVars");

function setup() {
	const {
		env
	} = getVars();

	// login to docker
	exec(`docker login -u _json_key -p "$GCLOUD_SERVICE_KEY" https://gcr.io`);

	fs.writeFileSync(`/tmp/service_key`, process.env.GCLOUD_SERVICE_KEY);

	exec(`ln -sfn /repo ${process.env.APPS_FOLDER || '/sv/applications'}/${process.env.REPO_NAME}`);
	exec(`gcloud auth activate-service-account --key-file=/tmp/service_key`);
	exec(`gcloud config set project ${process.env.PROJECT_ID}`);
	exec(`gcloud config set compute/zone ${process.env.ZONE}`);
	exec(`USE_GKE_GCLOUD_AUTH_PLUGIN=True gcloud container clusters get-credentials ${env}`);
}

module.exports = setup;
