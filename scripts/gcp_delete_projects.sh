projects=(
	1041130890822
	133849608972
	584404636647
	974608216277
	545824029573
	860534224151
)

for i in "${projects[@]}"; do
	echo "Deleting $i"
	yes | gcloud projects delete $i
done

# sudo gcloud projects list --filter='projectId:*quickstart*' --format='table(projectName,projectId,projectNumber)'