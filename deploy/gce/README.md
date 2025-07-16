# Deploy to Google Cloud

## Build

```
docker compose build deploy-gce
```

## Usage

The recommended way to run CircleCI jobs is to use the specific script in your container that corresponds to the job via /app/scripts/<script>. Example: Use /app/scripts/build_deploy as the command for the Build & Deploy job.

```
jobs:
  build_deploy:
    executor: sv-deploy-gce

    steps:
      - init-steps
      - run:
          name: Build & Deploy
          command: node /app/scripts/build_deploy
      - notify-failure
```

Please refer to the cms-router circleci config as an example: https://github.com/simpleviewinc/cms-router/blob/master/.circleci/config.yml
