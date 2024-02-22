#!/bin/bash

npm install

npm run cert

cd services/home

npm install

npm run build

cd ../..

sudo npm run start
