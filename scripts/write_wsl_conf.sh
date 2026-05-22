#!/usr/bin/env bash
set -euo pipefail

write_wsl_conf() {
  local yaml_path="${1:?usage: write_wsl_conf <path-to-yaml>}"
  python3 - "$yaml_path" <<'PY' >/etc/wsl.conf
import sys
import yaml

with open(sys.argv[1]) as f:
    data = yaml.safe_load(f)

for item in data.get("write_files") or []:
    if item.get("path") == "/etc/wsl.conf" and "content" in item:
        print(item["content"], end="")
        raise SystemExit(0)
raise SystemExit("no write_files entry with path /etc/wsl.conf and content")
PY
}

