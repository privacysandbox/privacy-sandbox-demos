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
 *   This script triggers the ad beacon that the ad-tech expects to have
 *   pre-registered in the Protected Audience reporting phase using
 *   registerAdBeacon().
 */
(() => {
  /** Name of the contextual advertiser. */
  const ADVERTISER_CONTEXTUAL = 'ContextNext';
  const HOST_CODENAME = ((scriptSrc) => {
    const currentHost = new URL(scriptSrc).hostname;
    return currentHost.substring('privacy-sandbox-demos-'.length);
  })(document.currentScript.src);
  const CURRENT_URL = new URL(location.href);

  /** Triggers all the ad beacons registered in Protected Audience auction. */
  const triggerAdBeacons = () => {
    if (!window.fence?.reportEvent) {
      console.log('[PSDemo] Fenced frames ads reporting API not available.');
      return;
    }
    window.fence.reportEvent({
      'eventType': 'impression',
      'destination': ['buyer', 'seller', 'component-seller'],
    });
    window.fence.setReportEventDataForAutomaticBeacons({
      'eventType': 'reserved.top_navigation_start',
      'eventData': '{"event": "top_navigation_start"}',
      'destination': ['seller', 'buyer', 'component-seller'],
    });
    window.fence.setReportEventDataForAutomaticBeacons({
      'eventType': 'reserved.top_navigation_commit',
      'eventData': '{"event": "top_navigation_commit"}',
      'destination': ['seller', 'buyer', 'component-seller'],
    });
  };

  /** Adds a description for demonstration purposes. */
  const addDescriptionToAdContainer = () => {
    document.addEventListener('DOMContentLoaded', async (e) => {
      const advertiser = CURRENT_URL.searchParams.get('advertiser');
      const $adLabel = document.getElementById('ad-label');
      if (ADVERTISER_CONTEXTUAL === advertiser) {
        $adLabel.innerText = `Contextual ad from ${HOST_CODENAME}`;
      } else {
        $adLabel.innerText = `PAAPI ad from ${HOST_CODENAME}`;
      }
    });
  };

  (() => {
    addDescriptionToAdContainer();
    triggerAdBeacons();
  })();
})();
