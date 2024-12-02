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
 * TODO: Implement.
 * This controller is for an ad buyer / DSP.
 * This controller should periodically fetch the latest signals from the ad
 * verifier service and store them in an in-memory cache. This cache can simply
 * be a map where keys are publisher page URLs. When this controller retrieves
 * a fresh set of signals from the ad verifier service, this controller must
 * overwrite existing signals in the cache.
 * This controller should expose one function that accepts a single argument
 * -- the publisher page URL and returns the verification signals corresponding
 * to the page. The buyer-contextual-bidder-router will call this function when
 * it receives a contextual bid request and includes the verification signals
 * in the buyerSignals returned along with the contextual bid response.
 */
export const VerificationSignalsCache = (() => {
  /** Returns ad verification signals for the specified publisher page. */
  const getVerificationSignals = (pageUrl: string): {[key: string]: any} => {
    return {
      viewabilityRate: 0.7,
      contentTags: ['lorem'],
    };
  };

  return {
    getVerificationSignals,
  };
})();
