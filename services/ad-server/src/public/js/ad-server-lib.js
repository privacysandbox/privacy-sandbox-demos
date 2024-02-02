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

    if (headerBiddingAd.bid > adServerAd.bid) {
      return headerBiddingAd;
    }

    return adServerAd;
  }

  // Protected Audience auction is executed after both the header bidding auction
  // and the ad server auction (contextual auction) have concluded
  startProtectedAudienceAuction({auctionId, adUnit, contextualAuctionResult}) {
    const {type: adType, isFencedFrame: resolveToConfig} = adUnit;
    const {contextualAd, componentAuctionConfigs} = contextualAuctionResult;

    // The contextual auction ad's bid acts as the bid floor
    const {bid: bidFloor} = contextualAd;

    const componentAuctions = this.decorateComponentAuctionConfigs({
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
      },
      resolveToConfig,
      componentAuctions,
    };

    // Adds an iframe that matches the top-level seller origin.
    const containerFrameEl = this.addContainerFrame(adUnit);

    // The data needed to run a Protected Audience auction is post-messaged to the iframe
    containerFrameEl.addEventListener('load', () => {
      containerFrameEl.contentWindow.postMessage(
        JSON.stringify({auctionId, adType, auctionConfig, contextualAd}),
        '*',
      );
    });
  }

  decorateComponentAuctionConfigs({
    componentAuctionConfigs,
    auctionSignals,
    sellerSignals,
    perBuyerSignals,
  }) {
    this.decorateComponentAuctionSignals(
      componentAuctionConfigs,
      auctionSignals,
    );
    this.decorateComponentSellerSignals(componentAuctionConfigs, sellerSignals);
    this.decorateComponentPerBuyerSignals(
      componentAuctionConfigs,
      perBuyerSignals,
    );

    return componentAuctionConfigs;
  }

  // Data from the publisher and the top-level seller are added as
  // auction signals of the component auctions to pass signals to the
  // component buyers and sellers
  decorateComponentAuctionSignals(componentAuctionConfigs, signals) {
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
  decorateComponentSellerSignals(componentAuctionConfigs, signals) {
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
  decorateComponentPerBuyerSignals(componentAuctionConfigs, signals) {
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

    const [width, height] = size;
    containerFrameEl.width = width;
    containerFrameEl.height = height;

    const paragraphEl = document.createElement('p');
    paragraphEl.innerText = `${type} ad in ${
      isFencedFrame ? 'fenced frame' : 'iframe'
    }`.toUpperCase();
    paragraphEl.className = 'font-mono text-sm';

    document.getElementById(divId).appendChild(containerFrameEl);
    document.getElementById(divId).appendChild(paragraphEl);
    return containerFrameEl;
  }
}
