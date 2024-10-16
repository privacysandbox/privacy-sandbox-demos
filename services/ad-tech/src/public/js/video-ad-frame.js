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

  /** Fetches the final VAST XML content from the SSP. */
  const fetchFinalizedVastXmlFromSsp = async (auctionId) => {
    const currentUrl = new URL(location.href);
    // Find SSP's VAST XML URL in renderURL query parameters.
    const sspVastQuery = currentUrl.searchParams.get('sspVast');
    if (!sspVastQuery) {
      return console.log('[PSDemo] Expected sspVast query in renderURL', {
        url: location.href,
        queryParam: 'sspVast',
      });
    }
    // The SSP's endpoint accepts two query parameters -- dspVast, auctionId --
    // which the SSP embeds in the finalized VAST XML.
    const sspVastUrl = new URL(decodeURIComponent(sspVastQuery));
    sspVastUrl.searchParams.append('auctionId', auctionId);
    sspVastUrl.searchParams.append('dspVast', DSP_VAST_URI);
    // Copy query parameters from renderURL.
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
  const addDescriptionToAdContainer = (seller) => {
    const buyerCodeName = location.hostname.substring(
      'privacy-sandbox-demos-'.length,
    );
    const sellerCodeName = seller.substring('privacy-sandbox-demos-'.length);
    const $adLabelEl = document.getElementById('ad-label');
    if ($adLabelEl) {
      $adLabelEl.innerText = `Video ad from ${buyerCodeName} delivered by ${sellerCodeName}`;
    }
  };

  // **************************************************************************
  // MAIN FUNCTION
  // **************************************************************************
  (() => {
    // The rendering process begins when the frame receives the auctionId.
    window.addEventListener('message', async (message) => {
      if (!message.origin.startsWith('https://privacy-sandbox-demos-ssp')) {
        return console.log(
          '[PSDemo] Ignoring message from unknonw origin',
          message,
        );
      }
      try {
        const {auctionId, seller} = JSON.parse(message.data);
        if (!auctionId || 'string' !== typeof auctionId) {
          return console.log('[PSDemo] auctionId not found', {message});
        }
        const vastXmlText = await fetchFinalizedVastXmlFromSsp(auctionId);
        if (vastXmlText) {
          addDescriptionToAdContainer(seller);
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
          console.log('[PSDemo] Could not fetch VAST XML', {auctionId});
        }
      } catch (e) {
        console.log('[PSDemo] Encountered error delivering video ad', {e});
      }
    });
  })();
})();
