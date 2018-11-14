Usage: sudo sv install [type] [name]

Checks out all repositories associated with an application. If the application containers containers specified in it's `settings.yaml` it will also install those container repos.

It will not start the application, you still need to build/start depending on your goal.

Example:
```
sudo sv install app sv-kubernetes-example-app
sudo sv install container sv-local-proxy-server
```