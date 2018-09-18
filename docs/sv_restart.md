Usage: sudo sv restart [applicationName] [container] [tag]

Re-build a container, tag it, and re-start the pod within an application.

Example:
```
# Restart test-application with a new build of the test-container:test
sudo sv restart test-application test-container test
```