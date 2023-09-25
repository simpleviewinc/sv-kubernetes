. /scripts/errorHandler.sh

gcloud_version=$((gcloud -v | grep "Google Cloud SDK") 2> /dev/null || true)
gcloud_version_expected=$"Google Cloud SDK 403.0.0" # previous version 254.0.0

if [ "$gcloud_version" != "$gcloud_version_expected" ]; then
	export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)"
	echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
	curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
	apt-get update -y && apt-get install google-cloud-sdk google-cloud-sdk-gke-gcloud-auth-plugin -y
fi