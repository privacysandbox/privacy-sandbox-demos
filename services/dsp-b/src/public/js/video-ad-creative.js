(async () => {
  const AUCTION_ID_QUERY_PARAM = 'auctionId';
  const DSP_VAST_URI_QUERY_PARAM = 'dspVastUri';
  const SSP_VAST_URL_QUERY_PARAM = 'sspVastUrl';

  const dspVastUri =
    'https://pubads.g.doubleclick.net/gampad/ads?' +
    'iu=/21775744923/external/single_ad_samples&sz=640x480&' +
    'cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&' +
    'gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&' +
    'impl=s&correlator=';

  // Read the SSP VAST endpoint
  function parseSspVastUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get(SSP_VAST_URL_QUERY_PARAM);
  }

  // Fetch the finalized SSP VAST XML
  //
  // THe SSP receives the DSP's VAST URI and a unique identifier.
  // The SSP transforms the VAST on their server, and responds with the
  // finalized VAST XML
  async function fetchVastFromSsp(sspVastUrl, auctionId) {
    const sspUrl = new URL(sspVastUrl);
    sspUrl.searchParams.append(AUCTION_ID_QUERY_PARAM, auctionId);
    sspUrl.searchParams.append(
      DSP_VAST_URI_QUERY_PARAM,
      encodeURIComponent(dspVastUri),
    );

    const response = await fetch(sspUrl);
    const result = await response.text();
    return result;
  }

  // The finalized VAST XML is messaged to the top-most frame that will
  // pass the VAST XML to the video player
  function sendVastToParentFrame(vastText) {
    const {0: containerFrame} = window.top.frames;
    containerFrame.top.postMessage(vastText, '*');
  }

  // The rendering process begins when the frame receives the auction ID
  window.addEventListener('message', async ({data: auctionId}) => {
    if (typeof auctionId === 'object') {
      return;
    }

    const sspVastUrl = parseSspVastUrl();
    const vastXml = await fetchVastFromSsp(sspVastUrl, auctionId);

    sendVastToParentFrame(vastXml);
  });
})();
