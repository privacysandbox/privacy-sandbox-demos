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
 *   This script is included on the ad frame hosted by this ad-tech, and is
 *   executed when an ad is delivered by this ad-tech on a publisher page.
 *
 * What does this script do:
 *   This script does nothing functionally. It only adds a descriptive label
 *   about the ad buyer to the ad frame.
 */
(() => {
  // Adds a descriptive label to the ad for demonstrative purposes.
  const currentUrl = new URL(location.href);
  const advertiser = currentUrl.searchParams.get('advertiser') || '';
  const host = new URL(document.currentScript.src).hostname;
  document.addEventListener('DOMContentLoaded', async () => {
    const $adLabel = document.getElementById('ad-label');
    const advertiserSuffix = advertiser ? ` for ${advertiser}` : '';
    if ($adLabel) {
      $adLabel.innerText = `Contextual ad from ${host}${advertiserSuffix}`;
    }
  });
})();
