# SV Kubernetes Secrets

## Instructions
1. Verify permissions and ensure you are a member of your department's secrets Google Group
2. Ensure you are logged in using the gcloud auth command sudo gcloud auth application-default login
3. If this is a new application contact DEVOPS to generate a keyRing for your project.
4. Once a keyRing is assigned in GCP add the key to your settings.yml file under the `secrets_key` with a `gcp:` prefix

**Example**
```
# settings.yml
secrets_key: gcp:projects/<projectId>/locations/global/keyRings/kubernetes/cryptoKeys/<applicationName>
```
5. Execute the sudo sv editSecrets command to either create or modify existing secrets.
6. Update your corresponding deployment.yaml file to include the environment variables for your secrets.
7. Secrets are injected into the application at runtime, in order to use secrets you must pull them from the environment. This may vary depending on your application's language
8. After creating/modifying a secret you will need to redeploy your application by running the sudo sv start appName env --build
9.  Test your application to ensure you are able to retrieve the secrets from the environment.
10. If a secret is compromised and becomes a security risk immediately reach out to the Staff and Devops Engineer in order to update the new secret and rotate the KMS token ring to ensure other applications on your cluster are not affected.

## Details
### Verifying Permissions
In order to manage secrets the executing user must have permissions to edit secrets on the departments cluster. 

If you are setting up a new project, contact DEVOPS to create the Google Group and Google KMS keyRing for your project.
DEVOPS will respond with url to your KMS keyRing.

Place this value in the `secrets_key` section of your `settings.yml` file. 

Permissions are granted when the user is added to the department's secrets Google Group. 

Each department has a Google Group that is assigned to the corresponding Kubernetes Cluster and GCP Key Ring. In order for a user to acquire the correct permissions to manage secrets they must be added to the department's secrets group.

The groups follow a naming convention as follows departmentName Secrets example, CRM Secrets or CMS Secrets

If your department does not have a Google Group configured for secrets reach out to the Devops team instead of creating the group as the process requires an update to the terraform plan in order to generate the proper Google KMS Ring association.

### Creating/Modifying a Secret
Secrets are created and updated using the same command. After running the editSecrets command a yaml file is generated and encrypted upon saving the contents of the file. 

The editSecrets command also supports a single flag of --env. 

The env flag is an enumerable which accepts any of the following values `local|live|dev|qa|test`.

When running the editSecrets command the default terminal editor opens a decrypted secrets.yaml file. After saving the changes in the editor the secrets are immediately encrypted and saved to disk.

Secrets are deleted from the cluster when you run the sudo sv stop appName command.

If no flag is passed a global secrets.yaml file is created. Both global and environment specific keys can be passed to the application via environment variables.

> Secret files should not be modified directly. The sudo sv editSecrets command handles, creation, updating, and encrypting the secrets.

### Examples for the editSecrets command
```sh
# example for global secrets
sudo sv editSecrets sv-kubernetes-example

# example for environment specific secrets
sudo sv editSecrets sv-kubernetes-example --env live|qa|dev|test|local
```

> Depending on your application you may have more than one deployment.yaml file in app → chart → templates
> An example would be ui-deployment.yaml or graphql-deployment.yaml.

## Google KMS Encryption
Secrets are managed using Google KMS Encryption and are configured in GCP with it's own KMS Key Ring.

Permissions are allocated to the key ring based on a membership of the ring's assigned Google Group.

> Resources → Google KMS

## Resources
Name|Source|
:----|:----|
sv-kubernetes-example |https://github.com/simpleviewinc/sv-kubernetes-example/blob/master/chart/secrets.yaml
sv-kubernetes | https://github.com/simpleviewinc/sv-kubernetes/blob/master/docs/sv_enterPod.md
Google KMS Documentation | https://cloud.google.com/kms/docs/
