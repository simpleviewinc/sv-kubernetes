Usage: sudo sv test [application or container]

Execute tests within running containers for an application or a specific container.

In order to execute tests within your container, you must specify `sv-test-command` in the `metadata.annotations` of your deployment.

Example:
```
# Execute all tests within all containers
sudo sv test sv-auth
# Execute just the tests within one container
sudo sv test sv-auth-graphql
```