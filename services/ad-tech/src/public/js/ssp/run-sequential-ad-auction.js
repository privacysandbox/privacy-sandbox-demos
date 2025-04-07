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
  const CURRENT_ORIGIN = '<%= CURRENT_ORIGIN %>';
  const LOG_PREFIX = '[PSDemo] <%= HOSTNAME %> sequential auction runner';
  const CONTEXTUAL_AUCTION_TIMEOUT_MS = 5000;

  // ****************************************************************
  // HELPER FUNCTIONS
  // ****************************************************************
  /** Validates the post messages and returns the adUnit and other sellers. */
  const getValidatedAdUnitAndOtherSellers = (event) => {
    if (!event.origin.startsWith('https://<%= DEMO_HOST_PREFIX %>')) {
      console.debug(LOG_PREFIX, 'ignoring message from unknown origin', {
        event,
      });
      return [];
    }
    try {
      const {message, adUnit, otherSellers} = JSON.parse(event.data);
      if ('RUN_AD_AUCTION' !== message) {
        console.debug(LOG_PREFIX, 'ignoring unexpected message', {event});
        return [];
      }
      if (!adUnit.adType) {
        console.warn(LOG_PREFIX, 'stopping as adType not found in adUnit', {
          adUnit,
        });
        return [];
      }
      if (!otherSellers || !otherSellers.length) {
        console.debug(LOG_PREFIX, 'did not find other sellers', {
          adUnit,
          otherSellers,
        });
        return [adUnit, []];
      }
      return [adUnit, otherSellers];
    } catch (e) {
      console.error(LOG_PREFIX, 'encountered error in parsing adUnit config', {
        event,
      });
      return [];
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

  /** Fetches all the contextual bid responses with a timeout. */
  const getAllContextualBidResponses = async (adUnit, sellers) => {
    const bidRequestUrls = getBidRequestUrlsWithContext(adUnit, sellers);
    const bidResponsePromises = bidRequestUrls.map(async (bidRequestUrl) => {
      console.debug(LOG_PREFIX, 'making contextual bid request', {
        bidRequestUrl,
      });
      const response = await fetch(bidRequestUrl);
      if (response.ok) {
        const bidResponse = await response.json();
        console.debug(LOG_PREFIX, 'received contextual bid response', {
          bidResponse,
        });
        return bidResponse;
      } else {
        console.error(
          LOG_PREFIX,
          'encountered error in contextual bid response',
          {
            statusText: response.statusText,
            bidRequestUrl,
          },
        );
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
    const decisionLogicURL = (() => {
      const url = new URL(CURRENT_ORIGIN);
      url.pathname = '/js/ssp/default/top-level-auction-decision-logic.js';
      return url.toString();
    })();
    const trustedScoringSignalsURL = (() => {
      const url = new URL(CURRENT_ORIGIN);
      url.pathname = '/ssp/realtime-signals/scoring-signal.json';
      return url.toString();
    })();
    return {
      seller: CURRENT_ORIGIN,
      decisionLogicURL,
      trustedScoringSignalsURL,
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

  // ****************************************************************
  // PROTECTED AUDIENCE: RUN AD AUCTION
  // ****************************************************************
  /** Executes the PAAPI auction in sequence and returns the overall result. */
  const executeSequentialAuction = async (adUnit, contextualBidResponses) => {
    const [winningContextualBid] = contextualBidResponses
      .filter((bid) => Number(bid.bid) > 0)
      .sort((bid1, bid2) => Number(bid2.bid) - Number(bid1.bid));
    const componentAuctionConfigs = contextualBidResponses.map(
      (bidResponse) => bidResponse.componentAuctionConfig,
    );
    const auctionConfig = assembleAuctionConfig(
      adUnit,
      winningContextualBid,
      componentAuctionConfigs,
    );
    console.info(LOG_PREFIX, 'initiating Protected Audience auction', {
      adUnit,
      winningContextualBid,
      auctionConfig,
    });
    const adAuctionResult = await navigator.runAdAuction(auctionConfig);
    if (adAuctionResult) {
      console.info(LOG_PREFIX, 'delivering Protected Audience ad', {
        adAuctionResult,
      });
      return {
        type: 'PROTECTED_AUDIENCE',
        value: adAuctionResult,
      };
    } else if (winningContextualBid) {
      console.info(LOG_PREFIX, 'delivering contextual ad', {
        winningContextualBid,
      });
      return {
        type: 'CONTEXTUAL',
        value: winningContextualBid.renderURL,
      };
    } else {
      document.getElementById('ad-label').innerText = 'No eligible ads found.';
      console.warn(LOG_PREFIX, 'found no eligible ads', {
        adUnit,
        auctionConfig,
      });
      return {
        type: 'NONE',
      };
    }
  };

  // ****************************************************************
  // POST-MESSAGE LISTENER
  // ****************************************************************
  /** Executes the multi-seller ad auction for the given adUnit config. */
  const runMultiSellerAdAuction = async (message) => {
    const [adUnit, otherSellers] = getValidatedAdUnitAndOtherSellers(message);
    if (!adUnit) {
      return;
    }
    const {auctionId} = adUnit;
    const contextualBidResponses = await getAllContextualBidResponses(
      adUnit,
      [location.origin, ...otherSellers], // Explicitly include self.
    );
    if (!contextualBidResponses || !contextualBidResponses.length) {
      console.error(LOG_PREFIX, 'received no contextual bid responses', {
        adUnit,
        otherSellers,
      });
      return;
    }
    const adAuctionResult = await executeSequentialAuction(
      adUnit,
      contextualBidResponses,
    );
    let adFrame;
    const {isFencedFrame} = adUnit;
    if ('NONE' === adAuctionResult.type) {
      return;
    } else if ('CONTEXTUAL' === adAuctionResult.type) {
      // FencedFrames can only be intialized with a FencedFrameConfig, and a
      // FencedFrameConfig constructor isn't currently exposed to JavaScript.
      // As a result, contextual ads can't be shown in FencedFrames without
      // using the following Chrome flag:
      // chrome://flags/#enable-fenced-frames-developer-mode
      // See: https://github.com/WICG/fenced-frame/blob/master/explainer/use_cases.md#manual-construction-for-general-purpose-usage-and-testing
      if (isFencedFrame) {
        console.debug(LOG_PREFIX, 'rendering contextual ad in iframe', {
          adUnit,
          adAuctionResult,
        });
      }
      // As such, render contextual ad in iframes regardless of adUnit config.
      adFrame = document.createElement('iframe');
      adFrame.src = adAuctionResult.value;
    } else if ('PROTECTED_AUDIENCE' === adAuctionResult.type) {
      if (isFencedFrame) {
        adFrame = document.createElement('fencedframe');
        adFrame.config = adAuctionResult.value;
      } else {
        adFrame = document.createElement('iframe');
        adFrame.src = adAuctionResult.value;
      }
    } else {
      console.warn(LOG_PREFIX, 'does not handle auction result type', {
        adUnit,
        adAuctionResult,
      });
      return;
    }
    const {size} = adUnit;
    [adFrame.width, adFrame.height] = size;
    adFrame.addEventListener('load', () => {
      adFrame.contentWindow.postMessage(
        JSON.stringify({
          auctionId,
          seller: location.hostname,
        }),
        '*',
      );
    });
    console.info(LOG_PREFIX, 'rendering ad', {
      adUnit,
      otherSellers,
      adAuctionResult,
      adFrame,
    });
    document.body.appendChild(adFrame);
  };

  // ****************************************************************
  // MAIN FUNCTION
  // ****************************************************************
  (() => {
    if (!navigator.runAdAuction) {
      console.warn(
        LOG_PREFIX,
        'stopping because Protected Audience is not supported',
      );
      return;
    }
    // Wait for adUnit object to be post-messaged by ad server tag.
    window.addEventListener('message', runMultiSellerAdAuction);
    console.debug(LOG_PREFIX, 'waiting for adUnit configs');
  })();
})();
