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
 *   This script is included in Protected Audience display ads, and is executed
 *   when an ad is delivered by this ad-tech on a publisher page.
 *
 * What does this script do:
 *   This script triggers the ad beacon that the ad-tech expects to have
 *   pre-registered in the Protected Audience reporting phase using
 *   registerAdBeacon().
 */
(() => {
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

  /** Adds a description for demonstrative purposes. */
  const addDescriptionToAdContainer = () => {
    const host = new URL(document.currentScript.src).hostname;
    document.addEventListener('DOMContentLoaded', async (e) => {
      const $adLabel = document.getElementById('ad-label');
      if ($adLabel) {
        $adLabel.innerText = `PAAPI ad from ${host}`;
      }
    });
  };

  /** Main function */
  (() => {
    addDescriptionToAdContainer();
    triggerAdBeacons();
  })();
})();

// console.log("Loading  REACH Measurment . . . services/ad-tech/src/public/js/display-ad-frame.js")

// async function measureUniqueReach() {
//   // Load the Shared Storage worklet
//   await window.sharedStorage.worklet.addModule('/js/reach-measurement-worklet.js');

//   // Run the reach measurement operation
//   await window.sharedStorage.run('reach-measurement', {
//     data: {
//       contentId: Date.now(),
//       geo: 'san jose',
//       creativeId: '55'
//     }
//   });

// }
// measureUniqueReach();

// /** Adds a description for demonstrative purposes. */
// const addDescriptionToAdContainer = () => {
//   const host = new URL(document.currentScript.src).hostname;
//   document.addEventListener('DOMContentLoaded', async (e) => {
//     const $adLabel = document.getElementById('ad-label');
//     if ($adLabel) {
//       $adLabel.innerText = `Reach Measurment ad from ${host}`;
//     }
//   });
// };
