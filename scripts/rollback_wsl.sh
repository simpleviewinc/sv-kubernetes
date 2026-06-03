FORCE=0
for _arg in "$@"; do
	case "$_arg" in
		--force|-f) FORCE=1 ;;
	esac
done

if [ -f "/sv/.wsl_migrated" ] || [ "$FORCE" -eq 1 ]; then
    . /sv/scripts/copy_repos.sh
    . /sv/scripts/write_wsl_conf.sh

    write_wsl_conf /sv/internal/Ubuntu.user-data.old

    shopt -s nullglob
    app_dirs=(/sv-wsl/applications/*/)
    container_dirs=(/sv-wsl/containers/*/)
    if ((${#app_dirs[@]} + ${#container_dirs[@]} > 0)); then
        echo "Your ${#app_dirs[@]} application and ${#container_dirs[@]} container repos can be copied back to the Windows-mounted paths under /sv"
        echo "This could take a REALLY long time depending on the size and complexity of your repos."
        echo "You can skip this by pressing 'n' and manually copy or install the repos under /sv/applications and /sv/containers."
        echo "Would you like to copy automatically? (y/n)"
        read -n 1 -s -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback_start=$SECONDS

            echo "Rolling back applications..."
            app_start=$SECONDS
            copy_repos /sv-wsl/applications /sv/applications
            echo "Applications rollback completed in $((SECONDS - app_start))s"

            echo "Rolling back containers..."
            container_start=$SECONDS
            copy_repos /sv-wsl/containers /sv/containers
            echo "Containers rollback completed in $((SECONDS - container_start))s"

            echo "Total rollback copy time: $((SECONDS - rollback_start))s"
        fi
    fi

    cp -f /sv/internal/.env_wsl /sv/.env

    umount /mnt/wsl/sv-kubernetes
    rm -rf /root/sv-kubernetes
    rm -rf /mnt/wsl/sv-kubernetes
    rm -f /sv-wsl

    rm -f /sv/.wsl_migrated
else
	echo "It looks like you haven't completed the WSL migration."
	echo "You can use --force to rollback anyway, e.g."
	echo "> bash /sv/scripts/rollback_wsl.sh --force"
fi
