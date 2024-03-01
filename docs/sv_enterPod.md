Usage: sudo sv enterPod [applicationName]

Enter a running container.

If you have more than one container per application the specific pod/container needs to be specified when running this command, or you will just be entered into the first pod/container for that application. This command will run `bash` if available and fallback to `sh` if not.

Example:
```
Single container applicaton:
sudo sv enterPod test-application

Multiple container applicaton:
sudo sv enterPod test-application-[containerName]
```