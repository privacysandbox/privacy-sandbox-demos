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
 * Where is this script used: TODO(sidneyzanetti)
 *
 * What does this script do: TODO(sidneyzanetti)
 */
(() => {
  const $script = document.currentScript;
  const mtaIframeUrl = new URL($script.src);
  mtaIframeUrl.pathname = '/dsp/mta-conversion.html';
  const {purchaseValue} = $script.dataset;
  mtaIframeUrl.searchParams.append('purchaseValue', purchaseValue);
  const $iframe = document.createElement('iframe');
  $iframe.width = 1;
  $iframe.height = 1;
  $iframe.src = mtaIframeUrl;
  $iframe.setAttribute('scrolling', 'no');
  $iframe.setAttribute('style', 'border: none');
  $script.parentElement.insertBefore($iframe, $script);
})();
