#!/usr/bin/env bash

# Copy each git repo under SRC_DIR into DEST_DIR/<repo-name>/ using git ignore
# rules plus the full .git tree. Define copyRepos here, then call it from elsewhere
# in this script (or after sourcing this file), e.g. copyRepos /sv/applications /sv-wsl/applications-test

copy_repos() {
	local src_root="${1:?usage: copyRepos SRC_DIR DEST_DIR}"
	local dest_root="${2:?usage: copyRepos SRC_DIR DEST_DIR}"

	src_root="${src_root%/}"
	dest_root="${dest_root%/}"

	mkdir -p "$dest_root" || return 1

	local repo name
	shopt -s nullglob
	for repo in "$src_root"/*/; do
		[[ -e "${repo}.git" ]] || continue
		repo="${repo%/}"
		name="$(basename "$repo")"
		mkdir -p "$dest_root/$name" || return 1
		(
			cd "$repo" || exit 1
			(
				git ls-files -z --cached --others --exclude-standard
				find .git -print0 2>/dev/null
			) | rsync -a --files-from=- --from0 ./ "$dest_root/$name/"
		) || echo "failed: $repo" >&2
	done
}


