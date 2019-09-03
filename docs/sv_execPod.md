Usage: sudo sv execPod [applicationName] [command and arguments]

Execute a command on a running container.

If you have more than one contianer per application the specific pod / container needs to be specified when running this command, or you will just be executing the command on the first pod / container for that application.

Example:
```
Single container applicaton:
sudo sv execPod test-application ps aux

Multiple container applicaton:
sudo sv execPod test-application-[containerName] ps aux
```