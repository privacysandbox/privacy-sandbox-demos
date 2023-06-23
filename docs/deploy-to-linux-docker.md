---
sidebar_position: 1
---

# Setup and Running locally

## Prerequisites

These instructions are given for Linux environments and assume you have the following packages installed on your system and your user is in the sudoers list (can execute commands with root access using sudo). If you plan to contribute to the code, a GitHub account is also required to commit your change and/or make pull requests.

The following packages must be installed

- [docker](https://docs.docker.com/engine/install/)
- [docker-compose](https://docs.docker.com/compose/install/)
- [nodejs v18](https://nodejs.org/)
- [mkcert](https://github.com/FiloSottile/mkcert)

## Network Setup

### Domain Name / URL

Privacy Sandbox APIs use the domain name in the URL (site origin) to allow/block cross site data sharing, identify topics etc. Thus we cannot rely only on the "localhost" domain for development.

We will remap domain name to loopback address (127.0.0.1) so each service could be accessed via a URL like :

- https://privacy-sandbox-demos-home.dev
- https://privacy-sandbox-demos-shop.dev
- …

There are 2 ways to achieve that

1. **Remap hosts to loopback address by editing /etc/hosts on your local machine**

Edit `/etc/hosts` file

```
# /etc/hosts
127.0.0.1	privacy-sandbox-demos.dev
127.0.0.1	privacy-sandbox-demos-home.dev
127.0.0.1	privacy-sandbox-demos-dsp.dev
127.0.0.1	privacy-sandbox-demos-shop.dev
127.0.0.1	privacy-sandbox-demos-travel.dev
127.0.0.1	privacy-sandbox-demos-ssp.dev
127.0.0.1	privacy-sandbox-demos-news.dev
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

`https://` scheme requires a valid certificate for your browser, this is done by using mkcert to create a local certification authority that will be trusted by your local browser. Later we will be creating a certificate for each of the privacy sandbox demos service and configure nginx to serve those certificates.

Run the command below to create the development Certificate Authority:

```shell
mkcert -install
```

## Build & Run your local development environment

1. Fork https://github.com/privacysandbox/privacy-sandbox-demos and clone locally
2. Setting up with npm scripts

```shell-session
# Download packages and dependencies :
$ npm install

# Generate the SSL Certificates for Nginx proxy service :
$ npm run cert

# Build and run the docker containers (docker must be run with root permission) :
$ sudo npm run start
```

3. Open the home page: https://privacy-sandbox-demos-home.dev
