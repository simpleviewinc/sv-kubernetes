Usage: sudo sv restart [applicationName] [container] [env]

Re-build a container and re-start the pod within an application.

Example:
```
# Restart test-application with a new build of the test-container:local
sudo sv restart test-application test-container local
```