Usage: sudo sv editSecrets [applicationName] --env=[environment] --key=[googleKMSKey]

Create encrypted secret files that will be decrypted and installed during application deployment.

Examples:
```
Create a Global Secret:
sudo sv editSecrets sv-kubernetes-example --key=[key]

Create an Environment Secret:
sudo sv editSecrets sv-kubernetes-example --env=local --key=[key]

Changing the Default Terminal Editor
export EDITOR=nano;
sudo -E sv editSecrets sv-kubernetes-example --env=local --key=[key]
```
**Key Example**
projects/[projectID]/locations/us-east1/keyRings/[keyRing]/cryptoKeys/[keyId]
