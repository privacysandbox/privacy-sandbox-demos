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
 *   This script is loaded on all pages.
 *
 * What does this script do:
 *   This script initializes PSDemo module as an empty namepsace.
 */
(() => {
  window.PSDemo = window.PSDemo || {};

  /** Returns URL query param value as an array. */
  window.PSDemo.getUrlQueryAsArray = (key) => {
    const values = new URLSearchParams(location.search).getAll(key);
    const nonEmptyValues = [];
    for (const value of values) {
      if (value) {
        nonEmptyValues.push(value);
      }
    }
    return nonEmptyValues;
  };

  /** Returns URL query param value as text. */
  window.PSDemo.getUrlQueryAsString = (key) => {
    return new URLSearchParams(location.search).get(key);
  };

  /** Returns a random integer identifier. */
  window.PSDemo.generateUniqueBigInt = () => {
    const randomInt64 = Math.floor(Math.random() * Math.pow(2, 64));
    // Combine using bitwise OR.
    return (BigInt(Date.now()) << 64n) | BigInt(randomInt64);
  };

  /** Returns a random 64-bit integer identifier */
  window.PSDemo.generateUniqueInt64 = () => {
    const randomInt32 = BigInt(Math.floor(Math.random() * Math.pow(2, 32)));
    const timestampShifted = BigInt(Date.now()) << 32n;
    // Combine using bitwise OR.
    const unique64Bit = timestampShifted | randomInt32;
    // Ensure it's treated as a signed 64-bit integer.
    const mask = (1n << 64n) - 1n;
    return unique64Bit & mask;
  };

  /** Returns page context data to be considered in ad delivery. */
  window.PSDemo.getPageContextData = () => {
    const pageContext = {};
    // Include query params from page URL.
    const searchParams = new URLSearchParams(location.search);
    for (const [key, value] of searchParams.entries()) {
      if (key in pageContext) {
        // Found repeated key, value should be array.
        if (!Array.isArray(pageContext[key])) {
          // Convert value to array.
          pageContext[key] = [pageContext[key], value];
        } else {
          pageContext[key].push(value);
        }
      } else {
        pageContext[key] = value;
      }
    }
    // Include additional basic variables.
    pageContext.uniqueBigInt = `${window.PSDemo.generateUniqueBigInt()}`;
    pageContext.uniqueInt64 = `${window.PSDemo.generateUniqueInt64()}`;
    pageContext.publisherOrigin = location.origin;
    pageContext.pageTitle = document.title;
    pageContext.pageURL = location.href;
    pageContext.userAgent = navigator.userAgent;
    pageContext.isMobile = navigator.userAgentData.mobile;
    pageContext.platform = navigator.userAgentData.platform;
    pageContext.browserVersion = navigator.userAgentData.brands.find(
      (brand) => 'Chromium' === brand.brand,
    ).version;
    return pageContext;
  };

  /** Post messages page context data to ad-tech iframes. */
  const postMessagePageContextToCrossDomainIframes = () => {
    const pageContext = window.PSDemo.getPageContextData();
    const pageContextMessage = JSON.stringify({
      message: 'PAGE_CONTEXT',
      pageContext,
    });
    const iframeEls = document.querySelectorAll('iframe');
    for (const iframeEl of iframeEls) {
      iframeEl.addEventListener('load', () => {
        iframeEl.contentWindow.postMessage(pageContextMessage, '*');
      });
    }
  };

  /** Main function */
  (() => {
    document.addEventListener(
      'DOMContentLoaded',
      postMessagePageContextToCrossDomainIframes,
    );
  })();
})();
