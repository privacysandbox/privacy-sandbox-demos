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

(async () => {
  const $script = document.querySelector('script.dsp_b_tag');
  const src = new URL($script.src);
  const advertiser = $script.dataset.advertiser;
  const id = $script.dataset.id;

  src.pathname = 'join-ad-interest-group.html';
  src.searchParams.append('advertiser', advertiser);
  src.searchParams.append('id', id);
  const currentUrl = new URL(location.href);
  for (const searchParam of currentUrl.searchParams) {
    src.searchParams.append(searchParam[0], searchParam[1]);
  }

  const $iframe = document.createElement('iframe');
  $iframe.width = 1;
  $iframe.height = 1;
  $iframe.src = src;
  $iframe.allow = 'join-ad-interest-group';
  $script.parentElement.insertBefore($iframe, $script.nextSibling);
})();
