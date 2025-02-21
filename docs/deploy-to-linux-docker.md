# Setup and Running locally

## Prerequisites

These instructions are given for Linux environments and assume you have the following packages installed on your system and your user is in the
sudoers list (can execute commands with root access using sudo). If you plan to contribute to the code, a GitHub account is also required to commit
your change and/or make pull requests.

The following packages must be installed

- [docker](https://docs.docker.com/engine/install/)
- [docker-compose](https://docs.docker.com/compose/install/)
- npm
- git
- [mkcert](https://github.com/FiloSottile/mkcert)

## Network Setup

### Domain Name / URL

Privacy Sandbox APIs use the domain name in the URL (site origin) to allow/block cross-site data sharing, observe topics, etc. As a result developers
cannot rely only on the “localhost” domain for development.

You will re-map individual domain names to loopback address (127.0.0.1), so that each service running on your local environment can be accessed via a
URL, such as:

- <https://privacy-sandbox-demos-home.dev>
- <https://privacy-sandbox-demos-shop.dev>
- …

There are 2 ways to achieve remapping on your local development environment. You can choose either of the 2 options below :

1. **Remap hosts to loopback address by editing /etc/hosts on your local machine**

Edit `/etc/hosts` file

```shell
# /etc/hosts
127.0.0.1 privacy-sandbox-demos.dev
127.0.0.1 privacy-sandbox-demos-home.dev
127.0.0.1 privacy-sandbox-demos-dsp.dev
127.0.0.1 privacy-sandbox-demos-dsp-a.dev
127.0.0.1 privacy-sandbox-demos-dsp-b.dev
127.0.0.1 privacy-sandbox-demos-shop.dev
127.0.0.1 privacy-sandbox-demos-travel.dev
127.0.0.1 privacy-sandbox-demos-ssp.dev
127.0.0.1 privacy-sandbox-demos-ssp-a.dev
127.0.0.1 privacy-sandbox-demos-ssp-b.dev
127.0.0.1 privacy-sandbox-demos-ad-server.dev
127.0.0.1 privacy-sandbox-demos-news.dev
127.0.0.1 privacy-sandbox-demos-collector.dev
```

Verifying mapping with :

```shell
nslookup privacy-sandbox-demos-news.dev
```

If the mapping isn’t reflected in Chrome, try clearing your DNS cache

`chrome://net-internals/#dns`

2. **If you use Google Chrome, --host-resolver-rules flag can be used instead.**

Start Google chrome with the following argument

```shell
google_chrome --host-resolver-rules="MAP privacy-sandbox-demos-* 127.0.0.1"
```

### HTTP SSL Certificate

`https://` protocol requires a valid certificate for your browser. To get a valid certificate, use mkcert to create a local certification authority
that will be trusted by your local browser. Later you will be creating a certificate for each of the Privacy Sandbox Demos services and configure
nginx to serve those certificates.

Run the command below _with your current user (not root !)_ to create the development Certificate Authority:

```shell
mkcert -install
```

### Enrollment & Attestation exception

To access the Privacy Sandbox relevance and measurement APIs on Chrome, developers need to
[enroll their site](https://github.com/privacysandbox/attestation/blob/main/how-to-enroll.md) with the Privacy Sandbox, pass the verification process,
and upload an attestation file on their site.

However you do not need to enroll if you are only testing with local traffic. For local testing, Chrome provides
[a flag and CLI switch](https://github.com/privacysandbox/attestation/blob/main/how-to-enroll.md#5-do-i-need-to-enroll-to-test-against-local-development-environments)
to bypass enrollment on your local browser.

Open `chrome://flags/#privacy-sandbox-enrollment-overrides`

Under `Privacy Sandbox Enrollment Overrides` select `Enabled` and enter your site domain names separated by a coma :

Example :

```shell
https://privacy-sandbox-demos-dsp.dev,https://privacy-sandbox-demos-dsp-a.dev,https://privacy-sandbox-demos-dsp-b.dev,https://privacy-sandbox-demos-ssp.dev,https://privacy-sandbox-demos-ssp-a.dev,https://privacy-sandbox-demos-ssp-b.dev,https://privacy-sandbox-demos-ad-server.dev
```

## Build & Run your local development environment

### Clone the Privacy Sandbox Demos repository

1. Fork the repository <https://github.com/privacysandbox/privacy-sandbox-demos> using the button near the top-right corner.
2. Clone your fork to your local development environment

### Setup .env file

Edit `.env` file. For each`${SERVICE}_HOST` key, set a value matching the content of the `/etc/hosts` configuration. (if you are fine with the default
site name, you don’t need to edit the file)

Example with the domain `privacy-sandbox-demos-${SERVICE}.dev`

```sh
#.env

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

### Run setup scripts

From the project **root folder** run :

```sh
# Download packages and dependencies :
$ npm install

# Generate the SSL Certificates for Nginx proxy service :
$ npm run cert
```

### Build html documentation

Build the html static files that will be served by the home web server. The build process uses `docusaurus`.

From the project root folder, **navigate to `services/home`** folder and run :

```sh
# Download package and dependencies (docusaurus)
npm install

# Build the html static files from the markdown docs.
npm run build
```

### Run start scripts

```sh
# Build and run the docker containers (docker must be run with root permission) :
sudo npm run start
```

Open the home page: <https://privacy-sandbox-demos-home.dev>

## Stop your local development environment

docker-compose can stop and remove the containers. In a new terminal run :

```sh
sudo npm run stop
```

If for some reason you only want to stop/remove one container run :

```sh
sudo docker-compose down <service_name>
```

## Cleanup your containers images & volumes

Once you have updated the code in your development environment, you should be able to see the result immediately in the running container because we
have mounted your local file system `./services/xxx` to the container `/workspace`.

Changes to static files should be immediate, however for typescript or compiled binaries you will have to restart your container or run again the
build/start script from within the container.

The easiest way is to restart the container using docker-compose and specify the services you wish to restart (dsp, ssp etc.)

```sh
sudo docker-compose restart [SERVICE...]
```

If you have modified and added new dependencies (package.json or go.mod etc), you will also have to rebuild the container image. For
`node:20-alpine3.17` based image, we are running `npm install` at container build time, and installing the `node_modules` in a separate volume
attached to the container. This makes rebuilding the container faster as it does not require to re-install the dependencies every time you build the
container. But as a side effect, dependencies may not be refreshed properly.

To start again from a fresh environment, we are providing the following shortcut to cleanup all images, volumes :

```sh
sudo npm run clean

# equivalent of docker-compose down --volumes && docker-compose rm --volumes --force && docker volume prune --force && docker image prune -f && docker rmi -f $(docker images -q)
```

Alternatively you can run the commands below for a specific service :

```sh
sudo docker-compose down --volumes <service_name>
```
