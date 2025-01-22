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
 *   This script is loaded in the join-ad-interest-group.html iframe.
 *
 * What does this script do:
 *   This script starts by querying the ad-tech server (same origin to current
 *   script) to retrieve interest group metadata to use with the Protected
 *   Audience API on the client-side. First-party context is also included in
 *   this request to the ad-tech server which includes URL query parameters
 *   from the top-level page as well as any script dataset context directly
 *   attached to the DSP tag.
 */

(() => {
    /** Sends first-party context to server to retrieve interest group metadata. */
    getInterestGroupFromServer = async () => {
      const currentUrl = new URL(location.href);
      const interestGroupUrl = new URL(location.origin);
        interestGroupUrl.pathname = '/dsp/interest-group-bidding-and-auction.json';
      // Copy query params from current context.
      for (const [key, value] of currentUrl.searchParams) {
        interestGroupUrl.searchParams.append(key, value);
      }
      // TODO: Consider using Topics API for choosing Ads
      // const topics = await document.browsingTopics?
      // console.log({ topics })
      // interestGroupUrl.searchParams.append('topics', topics);
      const res = await fetch(interestGroupUrl, {browsingTopics: true});
      if (res.ok) {
        return res.json();
      }
    };
  
    document.addEventListener('DOMContentLoaded', async () => {
      if (navigator.joinAdInterestGroup === undefined) {
        console.log('[PSDemo] Protected Audience API is not supported.');
        return;
      }
        const interestGroup = await getInterestGroupFromServer();
        console.log('[PSDemo] Joining interest group: ', {interestGroup});
        const kSecsPerDay = 3600 * 24 * 30;
        console.log(
          await navigator.joinAdInterestGroup(interestGroup, kSecsPerDay),
        );
    });
  })();
  