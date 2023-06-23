#!/usr/bin/env zsh

# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# evaluate .env file
source .env
source .env.deploy

# Deploy to Firebase Hosting all sites
for service in $SERVICES; do
  firebase deploy --only hosting:${service}
done

# Check all Firebase Hosting sites
for service in $SERVICES; do
  echo https://$FIREBASE_HOSTING_DOMAIN-${service}.web.app/

  ## cleanup cache (-w'\n' will add line break to output)
  curl -w'\n' -X PURGE https://$FIREBASE_HOSTING_DOMAIN-${service}.web.app/
done
