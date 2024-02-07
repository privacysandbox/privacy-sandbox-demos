# Google Cloud Platform project deployment guide

The instructions below allow you to deploy Privacy Sandbox Demos on a new Google Cloud Platform project.

The same instructions can be repeated to deploy a dev, staging, prod etc. environment to additional projects.

Project names and variables in _italic_ must be carefully chosen and updated to suit your project naming convention.

Resources : <https://firebase.google.com/docs/hosting/cloud-run>

## Prepare your Google Cloud Platform Billing Account

If you don’t have yet a billing account, follow the documentation to Create a Google Cloud Platform Billing Account :
<https://cloud.google.com/billing/docs/how-to/manage-billing-account>

## Prepare your Google Cloud Platform Project

**Note** : the instructions below assume you are creating a completely new GCP Project. However if the project already exists, instead you’ll need to
get permission from the project owner to be able to deploy resources (Firebase hosting & Cloud Run).

1. Create a Google Cloud Platform Project : <https://cloud.google.com/resource-manager/docs/creating-managing-projects>
   1. Note the name of the project/id. E.g.: _privacy-sandbox-demos_
   2. Assign the billing account created in step above
2. Add a Firebase Project linked to your GCP Project : <https://console.firebase.google.com/>
   1. Click "Add Project"
   2. Select the GCP project you previously created. E.g. : _privacy-sandbox-demos_
   3. Since you enabled Billing Account on this project, it will automatically select the Firebase pay-as-you-go plan
   4. Enable Google Analytics for the project : Select "Default Account for Firebase" unless you have specific analytics requirements
3. If you don’t have the project owner role , you will need to obtain at least the following IAM role to your account on the target project before you
   proceed with the next steps.
   1. Artifact Registry Administrator
   2. Cloud Build Editor
   3. Cloud Run Admin
   4. Firebase Hosting Admin
   5. Service Account User
   6. Service Usage Admin
   7. Service Usage Consumer
   8. Storage Admin
   9. Storage Object Creator
   10. Project Viewer

## Prepare your Development Environment for Firebase Hosting

In this section you will configure your development environment to get ready to build and deploy resources to Firebase. The Instructions below are
based on the Linux environment.

1. Clone Privacy Sandbox Demos Git Repository : <https://github.com/privacysandbox/privacy-sandbox-demos.git>
2. Install the Firebase CLI : <https://firebase.google.com/docs/cli#linux>
3. Open a terminal at the root of the project. Login and test the Firebase CLI :

```shell-session
firebase login
firebase projects:list
```

4. Configure firebase to use your project (e.g. )

```shell
    1. firebase use --clear
    2. firebase use --unalias default
    3. firebase use --add
```

5. Copy the .env.deploy.template to .env.deploy file then edit .env.deploy file with your GCP project name and Firebase site domain prefix :

```sh
GCP_PROJECT_NAME=xxx
FIREBASE_HOSTING_DOMAIN=privacy-sandbox-demos
```

Resources :

- <https://firebase.google.com/docs/hosting>
- <https://firebase.google.com/docs/hosting/multisites?authuser=0&hl=en#set_up_deploy_targets>

## Setup Firebase Hosting Multiple Sites

Your firebase project will host 5 different sites to demonstrate the capabilities of Privacy Sandbox across the different actors of the adtech
ecosystem :

- Home : Home page with the links to the different use-cases and scenario
- DSP : Demand Side Platform
- Shop & Travel : The advertiser shopping or travel site = Buy side. They are buying ad space from the publisher. Site embeds the DSP tags.
- SSP : Supply Side Platform
- News : Publisher site where ads will be displayed = Sell side. They are selling ad space to advertisers. Site embeds SSP tags
- Collector : Collector service collects, transforms and batches Aggregatable Reports produced by the Attribution Reporting API and Private
  Aggregation API, then sends them to the Aggregation Service running on TEE.

Each site will have a different domain name to simulate a real life adtech scenario

Open Firebase Hosting : from the Firebase console click on "hosting" or follow this link by replacing "_privacy-sandbox-demos_" with your project name

`https://console.firebase.google.com/project/_privacy-sandbox-demos_/hosting/sites`

Click on "Add another site" and enter site-id following your naming standards. Replace _privacy-sandbox-demos_ with the domain of your choice. E.g.

- _privacy-sandbox-demos_-home
- _privacy-sandbox-demos_-dsp
- _privacy-sandbox-demos_-dsp-a
- _privacy-sandbox-demos_-dsp-b
- _privacy-sandbox-demos_-shop
- _privacy-sandbox-demos_-travel
- _privacy-sandbox-demos_-ssp
- _privacy-sandbox-demos_-ssp-a
- _privacy-sandbox-demos_-ssp-b
- _privacy-sandbox-demos_-ad-server
- _privacy-sandbox-demos_-news
- _privacy-sandbox-demos_-collector

Note, task above can be done programmatically with Firebase CLI :

```shell
firebase hosting:sites:create SITE_ID
```

E.g.

```shell
firebase hosting:sites:create privacy-sandbox-demos-home
firebase hosting:sites:create privacy-sandbox-demos-dsp
firebase hosting:sites:create privacy-sandbox-demos-dsp-a
firebase hosting:sites:create privacy-sandbox-demos-dsp-b
firebase hosting:sites:create privacy-sandbox-demos-shop
firebase hosting:sites:create privacy-sandbox-demos-travel
firebase hosting:sites:create privacy-sandbox-demos-ssp
firebase hosting:sites:create privacy-sandbox-demos-ssp-a
firebase hosting:sites:create privacy-sandbox-demos-ssp-b
firebase hosting:sites:create privacy-sandbox-demos-ad-server
firebase hosting:sites:create privacy-sandbox-demos-news
firebase hosting:sites:create privacy-sandbox-demos-collector
```

Set up deploy targets for your sites (When you have multiple sites and you run Firebase CLI deploy commands, the CLI needs a way to communicate which
settings should be deployed to each site).

use the following command to setup deploy target for each hosting site :

```shell
firebase target:apply hosting TARGET_NAME RESOURCE_IDENTIFIER
```

E.g. :

```shell
firebase target:apply hosting home privacy-sandbox-demos-home
firebase target:apply hosting dsp privacy-sandbox-demos-dsp
firebase target:apply hosting dsp privacy-sandbox-demos-dsp-a
firebase target:apply hosting dsp privacy-sandbox-demos-dsp-b
firebase target:apply hosting shop privacy-sandbox-demos-shop
firebase target:apply hosting ssp privacy-sandbox-demos-ssp
firebase target:apply hosting ssp privacy-sandbox-demos-ssp-a
firebase target:apply hosting ssp privacy-sandbox-demos-ssp-b
firebase target:apply hosting ssp privacy-sandbox-demos-ad-server
firebase target:apply hosting news privacy-sandbox-demos-news
firebase target:apply hosting travel privacy-sandbox-demos-travel
firebase target:apply hosting travel privacy-sandbox-demos-collector
```

Adding hosting sites and deploy targets can be done using the provided script below (make sure your `.env.deploy` file contains the right domain value
for the key `FIREBASE_HOSTING_DOMAIN`)

```shell
# From the root of the project, execute
scripts/firebase_setup.sh
```

## Google Cloud Platform Logging and Monitoring

We recommend Enable Cloud Logging for the Firebase Hosting Project.

By using Cloud Logging with your Firebase Hosting sites, you allow web request logs to be exported to Cloud Logging.

Access the following URL (replace _privacy-sandbox-demos_ with your project name)

<https://firebase.corp.google.com/project/_privacy-sandbox-demos_/settings/integrations/cloudlogging>

Select all the sites you want to export logs from, click Save and Finish.

## Install Google Cloud SDK & Enable the Google Cloud Run API

Next you will deploy containers to Cloud Run to run the content of the demo sites.

For our architecture, we chose to deploy everything container based for portability and flexibility and to use Firebase hosting as a frontend solution
for HTTPS request handling, domain name and ssl certificates.

Install Google Cloud SDK : If Google Cloud SDK is not installed on the machine, follow instructions here :
<https://cloud.google.com/sdk/docs/install#linux>

Initialize Google Cloud SDK : <https://cloud.google.com/sdk/docs/initializing>

```shell
# Run `gcloud init` to setup authentication and project
gcloud init

# Or alternatively run separately the 2 commands :
gcloud auth login
gcloud config set project

# Verify your configuration (account and project) with the command :
gcloud config list

# Enable Cloud Run API
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Setup the default region for deployment
gcloud config set run/region us-central1
```

Resources : <https://firebase.google.com/docs/hosting/cloud-run>

## Setup Artifact Registry

<https://cloud.google.com/artifact-registry/docs/enable-service> <https://cloud.google.com/artifact-registry/docs/transition/setup-repo>

```sh
# create docker repository in Cloud Artifact Registry
gcloud artifacts repositories create docker-repo --repository-format=docker \
--location=us-central1 --description="Privacy Sandbox Demos Docker repository"

# set default repository
gcloud config set artifacts/repository docker-repo

# set default location
gcloud config set artifacts/location us-central1

```

confirm repository exists with

```sh
gcloud artifacts repositories list
```

[optional] configure authentication for your docker client

```sh
gcloud auth configure-docker us-central1-docker.pkg.dev
```

Enable Vulnerability Scanning : navigate to settings and Turn On. <https://console.cloud.google.com/artifacts/settings>

## Setup Cloud Build

<https://cloud.google.com/build/docs/deploying-builds/deploy-cloud-run>

Enable Cloud Build Service Account permissions : Cloud Run Admin Service Account User

From Cloud Build Settings page : <https://console.cloud.google.com/cloud-build/settings/service-account>

or from IAM page :

<https://console.cloud.google.com/iam-admin/iam>

## Deploy all Cloud Run services and Firebase Sites

You are ready to deploy all the services and hosting sites.

Edit `cicd/.env.prod` file to match the `${SERVICE}_HOST` parameter to your firebase hosting domain e.g. : `privacy-sandbox-demos-${SERVICE}.dev`

```shell
# cicd/.env.prod

# External Port (bind by Nginx)
EXTERNAL_PORT=443

# Bind by each Application Server (fixed value)
PORT=8080

# home
HOME_HOST=privacy-sandbox-demos-home.dev
HOME_TOKEN=""
HOME_DETAIL="Home page of Privacy Sandbox Demos"

# Publisher
## news
NEWS_HOST=privacy-sandbox-demos-news.dev
NEWS_TOKEN=""
NEWS_DETAIL="Publisher: News media site"

...
```

Copy the `.env.deploy.template` to `.env.deploy` file then edit .env.deploy to update the GCP Project Name and the Firebase domain prefix you will use
to deploy your services :

```sh
GCP_PROJECT_NAME=xxx
FIREBASE_HOSTING_DOMAIN=**_privacy-sandbox-demos_**
```

**[optional]** If you have enrolled your site with Privacy Sandbox, copy your attestation files for dsp/ssp services under the folder :
`cicd/attestations`

| Environment |  Service  |              Attestation file name               |
| :---------: | :-------: | :----------------------------------------------: |
|    prod     |    dsp    |    privacy-sandbox-attestations.json.dsp.prod    |
|    prod     |   dsp-a   |   privacy-sandbox-attestations.json.dsp-a.prod   |
|    prod     |   dsp-b   |   privacy-sandbox-attestations.json.dsp-b.prod   |
|    prod     |    ssp    |    privacy-sandbox-attestations.json.ssp.prod    |
|    prod     |   ssp-a   |   privacy-sandbox-attestations.json.ssp-a.prod   |
|    prod     |   ssp-b   |   privacy-sandbox-attestations.json.ssp-b.prod   |
|    prod     | ad-server | privacy-sandbox-attestations.json.ad-server.prod |
|     dev     |    dsp    |    privacy-sandbox-attestations.json.dsp.dev     |
|     dev     |   dsp-a   |   privacy-sandbox-attestations.json.dsp-a.dev    |
|     dev     |   dsp-b   |   privacy-sandbox-attestations.json.dsp-b.dev    |
|     dev     |    ssp    |    privacy-sandbox-attestations.json.ssp.dev     |
|     dev     |   ssp-a   |   privacy-sandbox-attestations.json.ssp-a.dev    |
|     dev     |   ssp-b   |   privacy-sandbox-attestations.json.ssp-b.dev    |
|     dev     | ad-server | privacy-sandbox-attestations.json.ad-server.dev  |

Execute `./scripts/cloudrun_deploy.sh` to build and deploy services with Cloud Build and deploy to Cloud Run.

Execute `./scripts/firebase_deploy.sh` to deploy Firebase hosting sites and configuration.

Look at the output, and verify you can access all the sites your created :

E.g. :

- https://_privacy-sandbox-demos_.web.app/
- https://_privacy-sandbox-demos_-home.web.app/
- https://_privacy-sandbox-demos_-dsp.web.app/
- https://_privacy-sandbox-demos_-dsp-a.web.app/
- https://_privacy-sandbox-demos_-dsp-b.web.app/
- https://_privacy-sandbox-demos_-shop.web.app/
- https://_privacy-sandbox-demos_-travel.web.app/
- https://_privacy-sandbox-demos_-ssp.web.app/
- https://_privacy-sandbox-demos_-ssp-a.web.app/
- https://_privacy-sandbox-demos_-ssp-b.web.app/
- https://_privacy-sandbox-demos_-ad-server.web.app/
- https://_privacy-sandbox-demos_-news.web.app/
- https://_privacy-sandbox-demos_-collector.web.app/
