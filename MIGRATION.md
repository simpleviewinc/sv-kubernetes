# Migration

## Helm v2 to v3

- [ ] Backup Helm2 releases for rollback
    - [ ] Get list of releases `helm tiller run -- helm list`
    - [ ] For each release, backup Chart + values

> Do we actually need backups???  
> It seems that we could simply redeploy (rollback) with helm2 container  
> Rollback would mean, cleaning up Helm v3 configs/secrets/deploys?  

### Local cluster upgrade

- [ ] Install Helm3
    - Update `/sv/scripts/install_helm.sh` to use Helm version `v3.14.0`
    - Run `bash /sv/scripts/install_helm.sh`
- [ ] Install [helm-2to3](https://github.com/helm/helm-2to3) plugin
    - `helm plugin install https://github.com/helm/helm-2to3.git`
- [ ] Migrate Helm2 to Helm3
    - [ ] `helm 2to3 move config`
    - [ ] `helm 2to3 convert sv-kube-proxy`
    - [ ] `helm 2to3 convert sv-graphql`
    - [ ] `helm 2to3 convert sv-geo`
    - [ ] `helm 2to3 cleanup`
