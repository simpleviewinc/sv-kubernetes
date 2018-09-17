Usage: sudo sv start [applicationName]

Start an application from an application located in your /applications/ folder.

* If your application contains a 'values_[env].yaml' which corresponds with the env of the server, it will add that file as a helm values file.
* The deployments have access to custom SV values to ease the building of deployments.
** Values.sv.server_config.env - The current env.
** Values.sv.ids.[container:tag] - The current image id of a containers contents. Used to determine if a container has changed.

`sv start` is a wrapper for `helm upgrade`, any additional arguments will be passed to `helm upgrade`. Visit [helm upgrade](https://docs.helm.sh/helm/#helm-upgrade) for details.

Example:
	# start an application
	sudo sv start test-application
	# start an application but pass additional Helm arguments to help debug the config
	sudo sv start test-application --dry-run --debug