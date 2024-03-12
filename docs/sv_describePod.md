Usage: sudo sv decribePod [applicationName]

Show details of a specific resource.

If you have more than one container per application, the specific pod/container needs to be specified when running this command, or you will just be entered into the first pod/container for that application.

## Note
This command displays information about a Pod as well as events that have run. This is really helpful to see if the image for a container was pulled correctly, if the container started in the Pod, any Pod reschedule events, and much more.

Example:
```
Single container applicaton:
sudo sv describePod test-application

Multiple container applicaton:
sudo sv decribePod test-application-[containerName]
```