Usage: sudo sv editSecrets [applicationName] --env=[environment]

Create encrypted secret files that will be decrypted and installed during application deployment.

For additional documentation, visit https://wiki.simpleviewtools.com/display/DEVOPS/sv-kubernetes+secrets .

## Supported Flags

* `--env` - If passed, it will edit an environment specific secret file. If not passed it will edit the secret file loaded in all envs.

Examples:
```
# Create a Global Secret:
sudo sv editSecrets sv-kubernetes-example

# Create an Environment Secret:
sudo sv editSecrets sv-kubernetes-example --env=local
```