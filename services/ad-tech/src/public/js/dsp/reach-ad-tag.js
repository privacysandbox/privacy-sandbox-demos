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
 * Where is this script used:
 *   This is the main tag for an ad static ads for reach
 *
 *
 * What does this script do:
 *   This script orchestrates the loading static ads for reach measument use case
 */

(() => {
  const $script = document.currentScript;
  const scriptSrc = $script.getAttribute('src');

  staticAdURL.pathname = '/ads/static-ads';

  const $iframe = document.createElement('iframe');
  $iframe.width = 300;
  $iframe.height = 250;
  $iframe.src = staticAdURL;
  $iframe.setAttribute('scrolling', 'no');
  $iframe.setAttribute('style', 'border: none');
  $iframe.setAttribute('allow', 'attribution-reporting');
  $script.parentElement.insertBefore($iframe, $script);
})();
