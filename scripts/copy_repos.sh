# Copy each git repo under SRC_DIR into DEST_DIR preserving paths relative to SRC_DIR.
# Uses git ignore rules plus the full .git tree per repo.
#
# Nested repos: any descendant directory with its own .git (file or dir) is copied as its
# own unit to DEST_DIR/<relative-path>/ using the same rules. Nested working trees are
# excluded from a parent repo's rsync file list (nested wins that subtree; parent still
# keeps its .git including e.g. .git/modules/... for submodules).

# stdin: NUL-delimited paths relative to cwd; args: nested repo root paths relative to cwd
_filter_out_paths_under_nested_repos() {
	local f skip p
	while IFS= read -r -d '' f; do
		skip=
		for p in "$@"; do
			[[ -n "$p" ]] || continue
			if [[ "$f" == "$p" || "$f" == "$p"/* ]]; then
				skip=1
				break
			fi
		done
		[[ -n "$skip" ]] && continue
		printf '%s\0' "$f"
	done
}

copy_repos() {
	local src_root="${1:?usage: copyRepos SRC_DIR DEST_DIR}"
	local dest_root="${2:?usage: copyRepos SRC_DIR DEST_DIR}"

	src_root="${src_root%/}"
	dest_root="${dest_root%/}"

	echo "Copying repos from $src_root to $dest_root" >&2

	mkdir -p "$dest_root" || return 1

	# All repo roots under src_root (find enters ignored dirs; -prune skips .git innards).
	local -a repo_roots=()
	local g r
	while IFS= read -r -d '' g; do
		r=$(dirname "$g")
		r="${r%/}"
		[[ "$r" == "$src_root" ]] && continue
		[[ "$r" == "$src_root"/* ]] || continue
		repo_roots+=("$r")
	done < <(find "$src_root" \( -name .git -type d -print0 -prune \) -o \( -name .git -type f -print0 \) 2>/dev/null)

	local repo_root rel other
	for repo_root in "${repo_roots[@]}"; do
		rel="${repo_root#$src_root/}"

		local -a nested_rel=()
		for other in "${repo_roots[@]}"; do
			[[ "$other" == "$repo_root" ]] && continue
			[[ "$other" == "$repo_root"/* ]] || continue
			nested_rel+=("${other#$repo_root/}")
		done

		mkdir -p "$dest_root/$rel" || {
			echo "failed mkdir: $dest_root/$rel" >&2
			continue
		}
		echo "copying repo: $rel -> $dest_root/$rel/" >&2
		(
			cd "$repo_root" || exit 1
			(
				git ls-files -z --cached --others --exclude-standard 2>/dev/null
				find .git -print0 2>/dev/null
			) | _filter_out_paths_under_nested_repos "${nested_rel[@]}" |
				rsync -a --files-from=- --from0 ./ "$dest_root/$rel/"
		) || echo "failed: $repo_root" >&2
	done
}
