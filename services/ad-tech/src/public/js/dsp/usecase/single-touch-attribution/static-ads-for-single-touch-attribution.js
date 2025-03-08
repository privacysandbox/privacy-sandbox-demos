/*
 Copyright 2022 Google LLC
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
      https://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * Where is this script used: TODO(sinnew)
 *
 * What does this script do: TODO(sinnew)
 */
(() => {
  function adClick() {
    console.log('adClick navigate to the specific item: static');
    // Encode the attributionsrc URL in case it contains special characters, such as '=', that will
    // cause the parameter to be improperly parsed
    const encoded = encodeURIComponent(
      '<%= `https://${DSP_HOST}:${EXTERNAL_PORT}/attribution/register-source?advertiser=${SHOP_HOST}&amp;id=u26f8` %>',
    );
    const url = '<%= `https://${SHOP_HOST}:${EXTERNAL_PORT}/items/26f8` %>';
    window.open(url, '_blank', `attributionsrc=${encoded}`);
  }
})();
