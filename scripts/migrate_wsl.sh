FORCE=0
for _arg in "$@"; do
	case "$_arg" in
		--force|-f) FORCE=1 ;;
	esac
done

if [ ! -f "/sv/.wsl_migrated" ] || [ "$FORCE" -eq 1 ]; then
	. /sv/scripts/copy_repos.sh
	. /sv/scripts/write_wsl_conf.sh

	ln -sfn /root/sv-kubernetes /sv-wsl
	mkdir -p /mnt/wsl/sv-kubernetes
	mkdir -p /root/sv-kubernetes
	mount --bind /root/sv-kubernetes /mnt/wsl/sv-kubernetes

	ENV_FILE="/sv/.env"

	declare -a ENV_VARS=(
		"APPS_FOLDER=/sv-wsl/applications"
		"CONTAINERS_FOLDER=/sv-wsl/containers"
		"SV_KUBERNETES_MOUNT_PATH=/run/desktop/mnt/host/wsl/sv-kubernetes"
	)

	mkdir -p "$(dirname "$ENV_FILE")"
	touch "$ENV_FILE"

	for entry in "${ENV_VARS[@]}"; do
		key="${entry%%=*}"
		expected_value="${entry#*=}"

		if grep -q "^${key}=" "$ENV_FILE"; then
			current_value=$(grep "^${key}=" "$ENV_FILE" | tail -n1 | cut -d= -f2-)
			if [ "$current_value" != "$expected_value" ]; then
				sed -i "s|^${key}=.*|${key}=${expected_value}|" "$ENV_FILE"
			fi
		else
			echo "${key}=${expected_value}" >> "$ENV_FILE"
		fi
	done

	shopt -s nullglob
	app_dirs=(/sv/applications/*/)
	container_dirs=(/sv/containers/*/)
	if ((${#app_dirs[@]} + ${#container_dirs[@]} > 0)); then
		echo "Your ${#app_dirs[@]} application and ${#container_dirs[@]} container repos will now be copied into the WSL filesystem"
		echo "This could take a REALLY long time depending on the size and complexity of your repos."
		echo "You can skip this by pressing 'n' and manually copy or install the repos to the WSL filesystem."
		echo "Would you like to copy automatically? (y/n)"
		read -n 1 -s -r
		echo
		if [[ $REPLY =~ ^[Yy]$ ]]; then
			migration_start=$SECONDS

			echo "Migrating applications..."
			app_start=$SECONDS
			copy_repos /sv/applications /sv-wsl/applications
			echo "Applications migration completed in $((SECONDS - app_start))s"

			echo "Migrating containers..."
			container_start=$SECONDS
			copy_repos /sv/containers /sv-wsl/containers
			echo "Containers migration completed in $((SECONDS - container_start))s"

			echo "Total migration time: $((SECONDS - migration_start))s"
		fi
	fi

	write_wsl_conf /sv/internal/Ubuntu.user-data

	touch /sv/.wsl_migrated
else
	echo "It looks like you've already completed the WSL migration."
	echo "You can use --force to run the migration anyway, e.g."
	echo "> bash /sv/scripts/migrate_wsl.sh --force"
fi
