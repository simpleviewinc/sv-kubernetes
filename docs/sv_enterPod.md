Usage: sudo sv enterPod [applicationName]

Enter a running container.

If you have more than one contianer per application the specific pod / container needs to be specified when running this command, or you will just be entered into the first pod / container for that application. 

Example:
```
sudo sv enterPod test-application
```