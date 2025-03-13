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
 *   This is the only script that is included on the advertiser's page, and is
 *   responsible for orchestrating other ad-tech modules as needed.
 *
 * What does this script do:
 *   This is the main tag for an ad buyer or a Demand Side Platform - DSP. This
 *   script loads additional iframes from its own origin for various use-cases.
 *   This script contains a few helper functions that help copy over
 *   first-party context attached either to the top-level page URL or to the
 *   current script tag.
 */

(async () => {
  // ********************************************************
  // HELPER FUNCTIONS
  // ********************************************************
  /** Injects an iframe using the current script's reference. */
  const injectIframe = (src, options) => {
    if (!src) {
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
    console.log('[PSDemo] Ad buyer injecting iframe', {src, $iframe});
    const $script = document.currentScript;
    $script.parentElement.insertBefore($iframe, $script);
  };

  /** Returns additional page context data to be captured. */
  const getPageContextData = () => {
    const pageContext = {
      title: document.title,
      isMobile: navigator.userAgentData.mobile,
      platform: navigator.userAgentData.platform,
    };
    return pageContext;
  };

  /** Copies first-party context onto iframe URL. */
  const getServerUrlWithPageContext = (pathname) => {
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
    if (!$script.dataset.advertiser) {
      // Manually attach advertiser if missing.
      src.searchParams.append('advertiser', location.hostname);
    }
    // Append query params from page URL.
    const currentUrl = new URL(location.href);
    for (const [key, value] of currentUrl.searchParams) {
      src.searchParams.append(key, value);
    }
    // Append additional page context data.
    for (const [key, value] of Object.entries(getPageContextData())) {
      src.searchParams.append(key, value);
    }
    return src;
  };

  // ********************************************************
  // MAIN FUNCTION
  // ********************************************************
  (() => {
    /** Inject DSP iframe to execute scripts in ad-tech's origin context.
     */
    injectIframe(
      /* src= */ getServerUrlWithPageContext(
        /* pathname= */ 'dsp/join-ad-interest-group.html',
      ),
      /* options= */ {
        allow: 'join-ad-interest-group',
        browsingTopics: '',
      },
    );

    /** Additional iframes to be injected go here... */

    /** Test only */
    if (false) {
      // Private Aggregation test
      injectIframe(
        /* src= */ getServerUrlWithPageContext(
          /* pathname= */ 'dsp/test-private-aggregation.html',
        ),
      );
    }
  })();
})();
