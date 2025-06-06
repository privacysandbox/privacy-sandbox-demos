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

FROM nginx:1.27.5-alpine

# Set the default output directory for templating
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx

# Copy custom Nginx configuration
COPY --chown=nginx:nginx nginx.conf /etc/nginx/templates/nginx.conf.template

# Copy built Docusaurus site from the buid folder
COPY --chown=nginx:nginx build /usr/share/nginx/html

# Start Nginx in the foreground
CMD [ "nginx", "-g", "daemon off;" ]
