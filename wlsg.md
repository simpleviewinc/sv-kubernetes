# TEMP

Potential instructions for getting wslg operational.

```
cd /mnt
ls -la
# ensure there is a wslg folder
```

```
apt-get update
apt-get install mesa-utils libgl1-mesa-dri
```

Install google chrome from docs at https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps#install-google-chrome-for-linux

```
# works...ish... kinda janky
LIBGL_ALWAYS_SOFTWARE=1 google-chrome --no-sandbox
# doesn't really work, menus broken, not sure
LIBGL_ALWAYS_SOFTWARE=1 screamingfrogseospider
```
