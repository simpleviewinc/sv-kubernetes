Usage: sudo sv stop [applicationName]

Stop an application.

* Pass `--ignore-not-found` to ignore errors if the application isn't running
* Pass `--wait` to wait for the application to be fully undeployed before proceeding

Example:
```
sv stop test-application
sv stop test-application --ignore-not-found --wait
```
