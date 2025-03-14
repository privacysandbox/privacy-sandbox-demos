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
const {campaignId, publisherId} = document.currentScript.dataset;
const impressionContext = {
  publisherId,
  campaignId,
  timestamp: Date.now(),
};
const impressionContextSSKey = `impressionContext${campaignId}`;
const valueToAppend = JSON.stringify(impressionContext);
window.sharedStorage.append(impressionContextSSKey, valueToAppend);
console.info('[PSDemo] Appended value to SharedStorage for MTA', {
  impressionContextSSKey,
  valueToAppend,
});
