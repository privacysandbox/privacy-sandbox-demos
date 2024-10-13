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

(() => {
  const CURR_SCRIPT_URL = new URL(document.currentScript.src);
  // ****************************************************************
  // HELPER FUNCTIONS
  // ****************************************************************
  /** Logs to console. */
  const log = (label, context) => {
    console.log('[PSDemo] Ad seller', CURR_SCRIPT_URL.hostname, label, {
      context,
    });
  };

  /** Validates the post messages and returns the adUnit and other sellers. */
  const getValidatedAdUnitAndOtherSellers = (message) => {
    const iframeUrl = new URL(window.location.href);
    const publisher = iframeUrl.searchParams.get('publisher');
    if (message.origin !== publisher) {
      return log('ignoring message from unknown origin', {message, publisher});
    }
    try {
      const {adUnit, otherSellers} = JSON.parse(message.data);
      if (!adUnit.adType) {
        return log('stopping as adType not found in adUnit', {adUnit});
      }
      if (!otherSellers || !otherSellers.length) {
        log('did not find other sellers', {adUnit, otherSellers});
        return [adUnit, []];
      }
      return [adUnit, otherSellers];
    } catch (e) {
      return log('encountered error in parsing adUnit config', {message});
    }
  };

  /** Builds and returns the various bid request URLs. */
  const getBidRequestUrlsWithContext = (adUnit, sellers) => {
    const auctionId = adUnit.auctionId || `HB-${crypto.randomUUID()}`;
    if (!adUnit.auctionId) {
      adUnit.auctionId = auctionId;
    }
    const bidRequestQuery = Object.entries(adUnit)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const bidRequestUrls = [];
    for (const seller of sellers) {
      const bidRequest = new URL(seller);
      bidRequest.pathname = '/ssp/contextual-bid';
      bidRequestUrls.push(`${bidRequest.toString()}?${bidRequestQuery}`);
    }
    return bidRequestUrls;
  };

  /** Runs and returns contextual bid responses. */
  const getAllBidResponses = async (adUnit, sellers) => {
    const bidRequestUrls = getBidRequestUrlsWithContext(adUnit, sellers);
    const bidResponsePromises = bidRequestUrls.map(async (bidRequestUrl) => {
      log('making contextual bid request', {bidRequestUrl});
      const response = await fetch(bidRequestUrl);
      if (response.ok) {
        const bidResponse = await response.json();
        log('received contextual bid response', {bidResponse});
        return bidResponse;
      } else {
        log('encountered error in contextual bid response', {
          statusText: response.statusText,
          bidRequestUrl,
        });
        return {bid: '0.0'};
      }
    });
    // Use Promise.race to implement the timeout.
    const bidResponses = await Promise.race([
      (await Promise.allSettled(bidResponsePromises))
        .filter((p) => p.status === 'fulfilled')
        .map((p) => p.value),
      new Promise((resolve) =>
        setTimeout(() => resolve([]), CONTEXTUAL_AUCTION_TIMEOUT_MS),
      ),
    ]);
    return bidResponses;
  };

  /** Assembles and returns a multi-seller auction configuration. */
  const assembleAuctionConfig = (
    adUnit,
    winningContextualBid,
    componentAuctions,
  ) => {
    const topLevelSellerScript = new URL(CURR_SCRIPT_URL.origin);
    topLevelSellerScript.pathname = '/js/ssp/default/auction-decision-logic.js';
    return {
      seller: CURR_SCRIPT_URL.origin,
      decisionLogicURL: topLevelSellerScript.toString(),
      // trustedScoringSignalsURL: '',
      // 'maxTrustedScoringSignalsURLLength': 10000,
      sellerSignals: {
        adUnit,
        winningContextualBid,
      },
      sellerCurrency: 'USD',
      // deprecatedRenderURLReplacements: {},
      resolveToConfig: adUnit.isFencedFrame,
      // signal: AbortSignal,
      componentAuctions,
    };
  };

  /** Executes the PAAPI auction in sequence and returns the overall result. */
  const executeSequentialAuction = async (adUnit, contextualBidResponses) => {
    const [winningContextualBid] = contextualBidResponses.sort(
      (bid1, bid2) => Number(bid2.bid) - Number(bid1.bid),
    );
    const componentAuctionConfigs = contextualBidResponses.map(
      (bidResponse) => bidResponse.componentAuctionConfig,
    );
    const auctionConfig = assembleAuctionConfig(
      adUnit,
      winningContextualBid,
      componentAuctionConfigs,
    );
    log('executing sequential auction', {
      adUnit,
      winningContextualBid,
      auctionConfig,
    });
    const adAuctionResult = await navigator.runAdAuction(auctionConfig);
    if (adAuctionResult) {
      log('delivering Protected Audience ad', {adAuctionResult});
      return {
        type: 'PROTECTED_AUDIENCE',
        value: adAuctionResult,
      };
    } else {
      log('delivering contextual ad', {winningContextualBid});
      return {
        type: 'CONTEXTUAL',
        value: winningContextualBid.renderURL,
      };
    }
  };

  /** Executes the multi-seller ad auction for the given adUnit config. */
  const runMultiSellerAdAuction = async (message) => {
    const [adUnit, otherSellers] = getValidatedAdUnitAndOtherSellers(message);
    const contextualBidResponses = await getAllBidResponses(
      adUnit,
      otherSellers,
    );
    if (!contextualBidResponses || !contextualBidResponses.length) {
      return log('received no contextual bid responses', {
        adUnit,
        otherSellers,
      });
    }
    const adAuctionResult = await executeSequentialAuction(
      adUnit,
      contextualBidResponses,
    );
    const {auctionId, isFencedFrame, size} = adUnit;
    const adElement = isFencedFrame ? 'fencedframe' : 'iframe';
    const adFrame = document.createElement(adElement);
    if ('CONTEXTUAL' === adAuctionResult.type || !isFencedFrame) {
      adFrame.src = adAuctionResult.value;
    } else {
      adFrame.config = adAuctionResult.value;
    }
    [adFrame.width, adFrame.height] = size;
    adFrame.addEventListener('load', () => {
      adFrame.contentWindow.postMessage(JSON.stringify({auctionId}), '*');
    });
    log('rendering ad', {adUnit, otherSellers, adAuctionResult, adFrame});
    document.body.appendChild(adFrame);
  };

  // ****************************************************************
  // MAIN FUNCTION
  // ****************************************************************
  (() => {
    if (!navigator.runAdAuction) {
      return log('stopping becuase Protected Audience is not supported', {});
    }
    // Wait for adUnit object to be post-messaged by ad server tag.
    window.addEventListener('message', runMultiSellerAdAuction);
    log('multi-seller waiting for adUnit configs', {});
  })();
})();
