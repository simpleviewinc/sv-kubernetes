Usage: sudo sv script [application] [file]

Will execute a script located in an applications folder. Useful for sharing re-used scripts between team members on an application.

## Important Notes

* The executed file is called directly so if you want it to run as `node` or `python` utilize shebang semantics `#!`.
* The file must be located in your applications `/scripts` folder.
* If you pass additional flags to the command they will be passed directly to the command
* The script will receive the following env variables to ease re-use of scripts across projects.
	* SV_APP_PATH - The full path without trailing slash to the application's folder. e.g. `/sv/applications/sv-auth`.
	* SV_APP_NAME - The name of the app. e.g. `sv-auth`.

Example:
```
# execute script which will copy package-lock files out of running containers
sudo sv script sv-auth package-lock

# execute a script and pass some args
sudo sv script sv-auth do-something --flag1 --flag2=something
```