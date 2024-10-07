// FIXME: Review and refactor.
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
if (false) {
  (() => {
    /** Local storage item containing ad unit configurations. */
    const LOCAL_STORAGE_PAGE_ADS_CONFIG = 'PAGE_ADS_CONFIG';

    const getContextualBidResponse = (adUnits) => {
      const $script = document.currentScript;
      const contextualBidRequest = new URL($script.src);
      contextualBidRequest.pathname = '/ssp/contextual-bid';
      adUnits.map(async (adUnit) => {});
    };

    // Main function.
    (() => {
      const {adUnits} = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_PAGE_ADS_CONFIG),
      );
    })();
  })();
}

class AdServerLib {
  constructor(hostname) {
    this.adServerOrigin = `https://${hostname}`;
    this.auctions = {};
  }

  // The ad server auction runs after the header bidding auction
  async startAdServerAuction({auctionId, headerBiddingAuctionResult}) {
    const adServerAuctionResult = await this.getAdServerAuctionResult();
    const componentAuctionConfigs = headerBiddingAuctionResult.map(
      ({componentAuctionConfig}) => componentAuctionConfig,
    );

    return {
      auctionId,
      componentAuctionConfigs,
      contextualAd: this.chooseWinningAd(
        adServerAuctionResult,
        headerBiddingAuctionResult,
      ),
    };
  }

  // Fetch the ad server auction bids from the ad server
  async getAdServerAuctionResult() {
    const response = await fetch(`${this.adServerOrigin}/ad-server-bid`);
    const result = await response.json();

    return result;
  }

  // The ad with a higher bid is chosen between the winner of the header
  // bidding auction and the winner of the ad server auction
  chooseWinningAd(adServerAuctionResult, headerBiddingAuctionResult) {
    const [highestHeaderBid] = headerBiddingAuctionResult.sort(
      (a, b) => b.headerBiddingAd.bid - a.headerBiddingAd.bid,
    );

    const {headerBiddingAd} = highestHeaderBid;
    const {adServerAd} = adServerAuctionResult;

    return headerBiddingAd.bid > adServerAd.bid ? headerBiddingAd : adServerAd;
  }

  // Protected Audience auction is executed after both the header bidding auction
  // and the ad server auction (contextual auction) have concluded
  startProtectedAudienceAuction({auctionId, adUnit, contextualAuctionResult}) {
    const {type: adType, isFencedFrame: resolveToConfig} = adUnit;
    const {contextualAd, componentAuctionConfigs} = contextualAuctionResult;

    // The contextual auction ad's bid acts as the bid floor
    const {bid: bidFloor} = contextualAd;

    // For the publisher and seller to pass data to component auction sellers
    // and buyers, we add the data to the component auction configs
    const componentAuctions = this.addSignalsToComponentAuctionConfigs({
      componentAuctionConfigs,
      auctionSignals: {adType, auctionId},
      sellerSignals: {'seller-key': 'seller-value'},
      perBuyerSignals: {'buyer-key': 'buyer-value'},
    });

    const auctionConfig = {
      // In this demo, the ad server acts as the top-level seller
      seller: this.adServerOrigin,
      decisionLogicURL: `${this.adServerOrigin}/js/decision-logic.js`,
      trustedScoringSignalsURL: `${this.adServerOrigin}/signals/trusted.json`,
      directFromSellerSignalsURL: `${this.adServerOrigin}/signals/direct.json`,
      sellerSignals: {
        bidFloor,
        adType,
      },
      resolveToConfig,
      componentAuctions,
    };

    // Adds an iframe that matches the top-level seller origin.
    const containerFrameEl = this.addContainerFrame(adUnit);

    // Setup a message listener for VAST XML
    if (adType === 'video') {
      const buyers = this.getBuyers(componentAuctions);
      this.setupVideoAd(buyers);
    }

    // The data needed to run a Protected Audience auction is post-messaged to the iframe
    containerFrameEl.addEventListener('load', () => {
      containerFrameEl.contentWindow.postMessage(
        JSON.stringify({auctionId, adUnit, auctionConfig, contextualAd}),
        '*',
      );
    });
  }

  getBuyers(componentAuctions) {
    return Array.from(
      new Set(
        ...componentAuctions.map(
          ({interestGroupBuyers}) => interestGroupBuyers,
        ),
      ),
    );
  }

  setupVideoAd(buyers) {
    // Listens to the VAST XML from the creative iframe
    window.addEventListener('message', ({origin, data}) => {
      if (buyers.some((buyer) => buyer.includes(origin))) {
        // Pass the VAST XML to the video ad helper that renders the ad
        setUpIMA(data, 'multi');
      }
    });
  }

  addSignalsToComponentAuctionConfigs({
    componentAuctionConfigs,
    auctionSignals,
    sellerSignals,
    perBuyerSignals,
  }) {
    this.addComponentAuctionSignals(componentAuctionConfigs, auctionSignals);
    this.addComponentSellerSignals(componentAuctionConfigs, sellerSignals);
    this.addComponentPerBuyerSignals(componentAuctionConfigs, perBuyerSignals);

    return componentAuctionConfigs;
  }

  // Data from the publisher and the top-level seller are added as
  // auction signals of the component auctions to pass signals to the
  // component buyers and sellers
  addComponentAuctionSignals(componentAuctionConfigs, signals) {
    componentAuctionConfigs = componentAuctionConfigs.map(
      (componentAuctionConfig) => {
        componentAuctionConfig.auctionSignals = {
          ...componentAuctionConfig.auctionSignals,
          ...signals,
        };

        return componentAuctionConfig;
      },
    );
  }

  // Data from the publisher and the top-level seller are added as
  // seller signals of the component auctions to pass signals to the
  // component sellers
  addComponentSellerSignals(componentAuctionConfigs, signals) {
    componentAuctionConfigs = componentAuctionConfigs.map(
      (componentAuctionConfig) => {
        componentAuctionConfig.sellerSignals = {
          ...componentAuctionConfig.sellerSignals,
          ...signals,
        };

        return componentAuctionConfig;
      },
    );
  }

  // Data from the publisher and the top-level seller are added as
  // seller signals of the component auctions to pass signals to the
  // component buyers
  addComponentPerBuyerSignals(componentAuctionConfigs, signals) {
    componentAuctionConfigs = componentAuctionConfigs.map(
      (componentAuctionConfig) => {
        componentAuctionConfig.perBuyerSignals = Object.keys(
          componentAuctionConfig.perBuyerSignals,
        ).reduce((updatedPerBuyerSignals, buyerOrigin) => {
          updatedPerBuyerSignals[buyerOrigin] = {
            ...componentAuctionConfig.perBuyerSignals[buyerOrigin],
            ...signals,
          };

          return updatedPerBuyerSignals;
        }, {});

        return componentAuctionConfig;
      },
    );
  }

  addContainerFrame({divId, size, type, isFencedFrame}) {
    const topLevelOrigin = encodeURI(window.location.origin);
    const containerFrameEl = document.createElement('iframe');
    containerFrameEl.src = `${this.adServerOrigin}/ad-frame.html?topLevelOrigin=${topLevelOrigin}`;

    // Add a label
    const paragraphEl = document.createElement('p');
    paragraphEl.innerText = `${type} ad in ${
      isFencedFrame ? 'fenced frame' : 'iframe'
    }`.toUpperCase();
    paragraphEl.className = 'font-mono text-sm';
    document.getElementById(divId).appendChild(paragraphEl);

    if (type === 'image') {
      [containerFrameEl.width, containerFrameEl.height] = size;
    } else if (type === 'video') {
      // The video creative does not actually render anything, and it only contains
      // the code that post messages the vAST out of the iframe, so we hide it
      containerFrameEl.width = 0;
      containerFrameEl.height = 0;
    }

    document.getElementById(divId).appendChild(containerFrameEl);
    return containerFrameEl;
  }
}
