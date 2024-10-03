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

/** Injects an iframe using the current script's reference. */
const injectIframe = (src, options) => {
  if (!src) {
    console.log('[PSDemo] No iframe URL provided to inject.');
    return;
  }
  const $iframe = document.createElement('iframe');
  $iframe.src = src;
  $iframe.width = 1;
  $iframe.height = 1;
  $iframe.async = true;
  $iframe.defer = true;
  if (options && 'object' === typeof options) {
    for (const [key, value] of Object.entries(options)) {
      $iframe.setAttribute(key, value);
    }
  }
  const $script = document.currentScript;
  $script.parentElement.insertBefore($iframe, $script);
};

/** Copies first-party context onto iframe URL. */
const buildIframeSrc = (pathname) => {
  if (!pathname) {
    return;
  }
  // Construct iframe URL using current script origin.
  const $script = document.currentScript;
  const src = new URL($script.src);
  src.pathname = pathname;
  // Append query parameters from script dataset context.
  for (const datakey in $script.dataset) {
    src.searchParams.append(datakey, $script.dataset[datakey]);
  }
  // Append query params from page URL.
  const currentUrl = new URL(location.href);
  for (const searchParam of currentUrl.searchParams) {
    src.searchParams.append(searchParam[0], searchParam[1]);
  }
  return src;
};

const joinAdInterestGroupIframeSrc = buildIframeSrc(
  /* pathname= */ 'dsp/join-ad-interest-group.html',
);
injectIframe(
  /* src= */ joinAdInterestGroupIframeSrc,
  /* options= */ {allow: 'join-ad-interest-group'},
);

const testPrivateAggregationIframeSrc = buildIframeSrc(
  /* pathname= */ 'dsp/test-private-aggregation.html',
);
injectIframe(/* src= */ testPrivateAggregationIframeSrc);
