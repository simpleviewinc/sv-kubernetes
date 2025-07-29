# Must specify a CIRCLE_BRANCH to run this script
# This will deploy a built container based on the branch name, be careful when manually executing this

. /sv/scripts/errorHandler.sh

if [[ $CIRCLE_BRANCH == "master" ]]; then
	IMAGE_TAG="latest"
elif [[ $CIRCLE_BRANCH == "develop" ]]; then
	IMAGE_TAG="dev"
else
	IMAGE_TAG="none"
fi

if [[ $IMAGE_TAG == "none" ]]; then
	echo "Specified CIRCLE_BRANCH is not pushed."
	exit
fi

docker login -u _json_key -p "${GCLOUD_SERVICE_KEY}" https://gcr.io
docker compose build cli
docker compose build deploy
docker image tag sv-deploy-gce:local gcr.io/sv-shared-231700/sv-deploy-gce:${IMAGE_TAG}
docker push gcr.io/sv-shared-231700/sv-deploy-gce:${IMAGE_TAG}
