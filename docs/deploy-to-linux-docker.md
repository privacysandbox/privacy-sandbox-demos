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
- npm
- git
- [mkcert](https://github.com/FiloSottile/mkcert)


## Network Setup

### Domain Name / URL

Privacy Sandbox APIs use the domain name in the URL (site origin) to allow/block cross-site data sharing, observe topics, etc. As a result developers cannot rely on the “localhost” domain for development.

You will re-map individual domain names to loopback address (127.0.0.1),  so that each service running on your local environment can be accessed via a URL, such as:

- https://privacy-sandbox-demos-home.dev
- https://privacy-sandbox-demos-shop.dev
- …

There are 2 ways to achieve remapping on your local development environment. You can choose either of the 2 options below :

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
127.0.0.1	privacy-sandbox-demos-collector.dev
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

`https://` protocol requires a valid certificate for your browser. To get a valid certificate, use mkcert to create a local certification authority that will be trusted by your local browser. Later you will be creating a certificate for each of the Privacy Sandbox Demos services and configure nginx to serve those certificates.

Run the command below to create the development Certificate Authority:


```shell
mkcert -install
```

## Build & Run your local development environment

### Clone the Privacy Sandbox Demos repository
1. Fork the repository https://github.com/privacysandbox/privacy-sandbox-demos using the button near the top-right corner.
2. Clone your fork to your local development environment

### Setup .env file

Edit `.env` file to match the `${SERVICE}_HOST` parameter to your the content of the `/etc/hosts` configuration.

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

On the same file `.env` update the Origin Trial token on dsp and ssp service to match yours

```sh
# Adtech
## dsp
DSP_HOST=privacy-sandbox-demos-dsp.dev
DSP_TOKEN="xxxxx"
DSP_DETAIL="Ad-Platform: DSP for advertiser"

## ssp
SSP_HOST=privacy-sandbox-demos-ssp.dev
SSP_TOKEN="xxxxx"
SSP_DETAIL="Ad-Platform: SSP for publisher"
```


### Run setup scripts

```sh
# Download packages and dependencies :
$ npm install

# Generate the SSL Certificates for Nginx proxy service :
$ npm run cert
```

### Run start scripts

```sh
# Build and run the docker containers (docker must be run with root permission) :
$ sudo npm run start
```

Open the home page: https://privacy-sandbox-demos-home.dev

## Stop your local development environment

To stop your development environment, you will need to stop each container :

Docker-compose can do that in 1 command. In a new terminal run :

```sh
sudo docker-compose stop
```

If for some reason it's not working, you can stop each container manually

```sh
# stop containers
sudo docker container stop sandcastle_travel
sudo docker container stop sandcastle_dsp
sudo docker container stop sandcastle_home
sudo docker container stop sandcastle_ssp
sudo docker container stop sandcastle_news
sudo docker container stop sandcastle_proxy
sudo docker container stop sandcastle_shop
```

If you want to clean (remove) the container image in your local registry you can do so by running the command :

```sh
sudo docker-compose rm
```

If for some reason it's not working, you can remove each container image manually

```sh
# stop containers
sudo docker container rm sandcastle_travel
sudo docker container rm sandcastle_dsp
sudo docker container rm sandcastle_home
sudo docker container rm sandcastle_ssp
sudo docker container rm sandcastle_news
sudo docker container rm sandcastle_proxy
sudo docker container rm sandcastle_shop
```


## Clean your docker images & containers
There might be some situation where your local image registry is corrupted, inconsistent, or has accumulated too many unused images. You can take a fresh start by cleaning your local images.

Remove any stopped containers and all unused images (not just dangling images) :

```sh
# Remove any stopped containers and all unused images
sudo docker system prune -a
```

Stop running containers

```sh
# show running containers
sudo docker ps -a

# stop all running containers
sudo docker stop $(sudo docker ps -a -q)
```

Remove one or more specific containers

```sh
# Use the docker ps command with the -a flag to locate
# the name or ID of the containers you want to remove:
sudo docker ps -a

# remove the container
sudo docker container ID_or_Name

# Remove all exited containers
sudo docker rm $(sudo docker ps -a -f status=exited -q)
```

Remove one or more specific images

```sh
# to locate the ID of the images you want to remove.
# This will show you every image, including intermediate image layers
sudo docker images -a

# When you’ve located the images you want to delete,
# you can pass their ID or tag to docker rmi:
sudo docker image rm [image_id]

# Remove all images
sudo docker rmi $(sudo docker images -a -q)
```

