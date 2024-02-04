#!/bin/bash

sudo docker-compose stop

sudo docker-compose rm

sudo docker volume prune

sudo docker system prune -a
