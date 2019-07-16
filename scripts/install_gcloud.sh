. /sv/scripts/errorHandler.sh

gcloud_version=$((gcloud -v | grep "Google Cloud SDK") 2> /dev/null || true)
gcloud_version_expected=$"Google Cloud SDK 254.0.0"

if [ "$gcloud_version" != "$gcloud_version_expected" ]; then
	export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)"
	echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
	curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
	apt-get update -y && apt-get install google-cloud-sdk -y
fi