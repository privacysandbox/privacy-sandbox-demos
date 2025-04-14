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
 *   This script is loaded inside the Protected Audience renderURL frame for a
 *   video ad. For video ads, this renderURL frame is hidden because the video
 *   ad is loaded on the video player on the publisher page.
 *
 * What does this script do:
 *   This script post-messages the VAST XML content to configure ads in the
 *   video player.
 */
(async () => {
  /** VAST XML representing the video ad to be served. */
  const DSP_VAST_URI = encodeURIComponent(
    'https://pubads.g.doubleclick.net/gampad/ads?' +
      'iu=/21775744923/external/single_ad_samples&sz=640x480&' +
      'cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&' +
      'gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&' +
      'impl=s&correlator=',
  );

  /** Finds and returns SSP's VAST XML URL in renderURL query parameters. */
  const getSspVastQueryFromCurrentUrl = () => {
    const currentUrl = new URL(location.href);
    const sspVastQuery = currentUrl.searchParams.get('sspVast');
    if (!sspVastQuery) {
      return console.warn('[PSDemo] Expected sspVast query in renderURL', {
        url: location.href,
        queryParam: 'sspVast',
      });
    }
    return decodeURIComponent(sspVastQuery);
  };

  /** Fetches the final VAST XML content from the SSP. */
  const fetchFinalizedVastXmlFromSsp = async (sspVast, auctionId) => {
    // The SSP's endpoint accepts two query parameters -- dspVast, auctionId --
    // which the SSP embeds in the finalized VAST XML.
    const sspVastUrl = new URL(sspVast);
    sspVastUrl.searchParams.append('auctionId', auctionId);
    sspVastUrl.searchParams.append('dspVast', DSP_VAST_URI);
    // Copy query parameters from renderURL.
    const currentUrl = new URL(location.href);
    for (const [key, value] of Object.entries(currentUrl.searchParams)) {
      if ('sspVast' === key) {
        continue;
      }
      sspVastUrl.searchParams.append(key, value);
    }
    // Fetch the finalized VAST XML from the ad serving SSP.
    const response = await fetch(sspVastUrl);
    const result = await response.text();
    return result;
  };

  /** Adds a descriptive label about the involved ad-techs. */
  const addDescriptionToAdContainer = (sspVast) => {
    const seller = new URL(sspVast).hostname;
    const buyer = location.hostname;
    const $adLabel = document.getElementById('ad-label');
    if ($adLabel) {
      $adLabel.innerText = `Video ad from ${buyer} delivered by ${seller}`;
    }
  };

  // **************************************************************************
  // MAIN FUNCTION
  // **************************************************************************
  (() => {
    // The rendering process begins when the frame receives the auctionId.
    window.addEventListener('message', async (message) => {
      if (!message.origin.startsWith('https://<%= DEMO_HOST_PREFIX %>')) {
        return console.debug(
          '[PSDemo] Ignoring message from unknonw origin',
          message,
        );
      }
      try {
        const {auctionId} = JSON.parse(message.data);
        if (!auctionId || 'string' !== typeof auctionId) {
          return console.warn('[PSDemo] auctionId not found', {message});
        }
        const sspVast = getSspVastQueryFromCurrentUrl();
        const vastXmlText = await fetchFinalizedVastXmlFromSsp(
          sspVast,
          auctionId,
        );
        if (vastXmlText) {
          addDescriptionToAdContainer(sspVast);
          // The finalized VAST XML is messaged to the top-most frame that will
          // pass the VAST XML to the video player
          const {0: containerFrame} = window.top.frames;
          containerFrame.top.postMessage(
            JSON.stringify({
              auctionId,
              buyer: location.hostname,
              vastXml: vastXmlText.toString(),
            }),
            '*',
          );
        } else {
          console.warn('[PSDemo] Could not fetch VAST XML', {auctionId});
        }
      } catch (e) {
        console.error('[PSDemo] Encountered error delivering video ad', {e});
      }
    });
  })();
})();
