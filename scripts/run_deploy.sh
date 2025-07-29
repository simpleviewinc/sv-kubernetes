# Builds and runs the deployment container locally for testing purposes
# specify GCLOUD_SERVICE_KEY in your .env file
# Must have sv-kubernetes-example checked out locally
docker compose build cli
docker compose build deploy
docker compose run -e GCLOUD_SERVICE_KEY --rm deploy /bin/bash
