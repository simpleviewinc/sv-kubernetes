# Must specify a CIRCLE_BRANCH to run this script
# This will deploy a built container based on the branch name, be careful when manually executing this

. ${BASH_SOURCE[0]%/*}/errorHandler.sh

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

AUTH_OK=0

# 1) Try WIF
if [[ -n "${CIRCLE_OIDC_TOKEN:-}" && -n "${GCP_WIF_CRED_JSON_B64:-}" ]]; then
  echo "Attempting WIF authentication..."
  echo "$GCP_WIF_CRED_JSON_B64" | base64 -d > /tmp/gcp-wif-cred.json
  echo -n "$CIRCLE_OIDC_TOKEN" > /tmp/oidc_token
  chmod 600 /tmp/oidc_token /tmp/gcp-wif-cred.json
  export GOOGLE_APPLICATION_CREDENTIALS=/tmp/gcp-wif-cred.json

  if gcloud auth login --cred-file=$GOOGLE_APPLICATION_CREDENTIALS; then
    gcloud auth configure-docker gcr.io -q
    AUTH_OK=1
  else
    echo "WIF authentication failed; will try GCLOUD_SERVICE_KEY if available."
  fi
fi

# 2) Fallback
if [[ "$AUTH_OK" -ne 1 && -n "${GCLOUD_SERVICE_KEY:-}" ]]; then
  echo "Authenticating with GCLOUD_SERVICE_KEY (fallback)..."
  echo "$GCLOUD_SERVICE_KEY" | docker login -u _json_key --password-stdin https://gcr.io
  AUTH_OK=1
fi

if [[ "$AUTH_OK" -ne 1 ]]; then
  echo "No authentication method available (no WIF, no GCLOUD_SERVICE_KEY)."
  exit 1
fi

docker compose build cli
docker compose build deploy
docker image tag sv-kubernetes-deploy:local gcr.io/sv-shared-231700/sv-deploy-gce:${IMAGE_TAG}
docker push gcr.io/sv-shared-231700/sv-deploy-gce:${IMAGE_TAG}
