# Overview

This package uses the `@google-cloud/synthetics-sdk-api` to create Google Cloud Functions used with Google Cloud Synthetic Monitoring.

## Installation

```shell
# from root of repo, build all packages
npm install
```

## Add a new use case monitoring function

1. Copy the Function Entry Point template in index.js, update the Entry Point name as well as the monitoring function name.
2. Copy the monitor-uc-template.js, rename the monitoring function and build the monitoring logic.

## Running

The following command runs the selected function (ENTRY_POINT)locally. You will also need to export the required environment variables with
`export KEY=VALUE` command.

```shell
npx functions-framework --target=<ENTRY_POINT>
```

then run the command below to trigger the function

```shell
curl http://localhost:8080/
```

## Deploy to Google Cloud Platform

Setup prerequisites

```shell
cd <PROJECT_ROOT_DIR>
./script/monitoring_setup.sh
```

The following command deploys the monitoring/puppeteer-nodejs package to GCP as a cloud function v2.

```shell
cd <PROJECT_ROOT_DIR>
./script/monitoring_deploy.sh
```
