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

// Protected Audience API
async function getInterestGroupFromServer() {
  const currentUrl = new URL(location.href);
  const interestGroupUrl = new URL(location.origin);
  interestGroupUrl.pathname = '/interest-group.json';
  for (const searchParam of currentUrl.searchParams) {
    interestGroupUrl.searchParams.append(searchParam[0], searchParam[1]);
  }
  const res = await fetch(interestGroupUrl);
  if (res.ok) {
    return res.json();
  }
}

document.addEventListener('DOMContentLoaded', async (e) => {
  if (navigator.joinAdInterestGroup === undefined) {
    return console.log('[DEMO] Protected Audience API is not supported');
  }
  const interestGroup = await getInterestGroupFromServer();
  console.log(`[DEMO] ${{interestGroup}}`);
  const kSecsPerDay = 3600 * 24 * 30;
  console.log(await navigator.joinAdInterestGroup(interestGroup, kSecsPerDay));

  // TODO: consider using Topics API for choosing Ads
  // const topics = await document.browsingTopics?.()
  // console.log({ topics })
});
