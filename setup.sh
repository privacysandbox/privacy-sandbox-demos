#!/bin/bash

npm install

npm run cert

cd services/home

npm install

npm run build

cd ../..

echo "you are ready to turn on the stack. use <npm run start> or <sudo npm run start>"
