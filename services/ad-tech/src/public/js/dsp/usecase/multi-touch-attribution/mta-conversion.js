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
(async () => {
  const mtaConversionScript = document.querySelector('#mta-conversion');
  const {campaignId, purchaseValue} = mtaConversionScript.dataset;
  // Load the Shared Storage worklet
  const sharedStorageWorklet = await window.sharedStorage.createWorklet(
    '/js/dsp/usecase/multi-touch-attribution/mta-conversion-worklet.js',
  );
  // Run the multi touch attribution logic
  await sharedStorageWorklet.run('mta-conversion', {
    data: {
      campaignId: campaignId,
      purchaseValue: purchaseValue,
    },
    privateAggregationConfig: {
      // Optional: Use contextId to opt-in for instant reports.
      contextId: `mmt-mta-${crypto.randomUUID()}`,
    },
  });
})();
