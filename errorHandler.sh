set -eu -o pipefail
function error_exit {
	echo "Error line ${1}"
	echo "Command '${2}' returned status ${3}"
	exit 1
}
trap 'error_exit ${LINENO} "${BASH_COMMAND}" "$?"' ERR