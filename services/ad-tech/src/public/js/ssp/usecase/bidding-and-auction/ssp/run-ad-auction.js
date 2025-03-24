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
import ComponentAuctionInfoCollector from './config-collector.js';

const DEMO_PARTICIPANT_COUNT = 3;

class AdAuction {
  constructor() {
    this.#setup();
  }

  async #setup() {
    this.auctionConfig = await this.#getTopLevelAuctionConfig();
  }

  async #getTopLevelAuctionConfig() {
    const url = new URL(location.origin);
    url.pathname = '/ssp/usecase/bidding-and-auction/auction-config.json';
    const response = await fetch(url);
    return response.json();
  }

  async run(componentAuctionInfo) {
    this.auctionConfig.componentAuctions =
      this.#getComponentAuctionConfigs(componentAuctionInfo);
    console.log(
      '[TLS SSP] Top Protected Audience auction config ',
      this.auctionConfig,
    );
    const adAuctionResult = await navigator.runAdAuction(this.auctionConfig);
    console.log('[TLS SSP] Auction result generated, runAdAuction complete.');

    if (adAuctionResult) {
      this.#renderProtectedAudienceAd(adAuctionResult);
    } else {
      const contextualAuctionWinner =
        this.#findContextualAuctionWinner(componentAuctionInfo);
      console.log({contextualAuctionWinner});

      this.#renderContextualAd(contextualAuctionWinner);
    }
  }

  #getComponentAuctionConfigs(componentAuctionInfo) {
    return componentAuctionInfo
      .map(({componentAuctionConfig}) => componentAuctionConfig)
      .flat();
  }

  #renderProtectedAudienceAd(adAuctionResult) {
    const fencedFrameEl = document.createElement('fencedframe');
    fencedFrameEl.config = adAuctionResult;
    fencedFrameEl.setAttribute('mode', 'opaque-ads');

    document.body.appendChild(fencedFrameEl);
  }

  #findContextualAuctionWinner(componentAuctionInfo) {
    const [contextualAuctionWinner] = componentAuctionInfo
      .map(({contextualAuctionWinner}) => contextualAuctionWinner)
      .sort((a, b) => a.bid > b.bid);
    contextualAuctionWinner.bid = 0;
    return contextualAuctionWinner;
  }

  #renderContextualAd(contextualAuctionWinner) {
    console.log(
      `[SSP] Rendering contextual winner - Bid floor: ${contextualAuctionWinner.bid}`,
    );

    const iframeEl = document.createElement('iframe');
    iframeEl.src = contextualAuctionWinner.renderURL;
    iframeEl.style.height = '100vh';
    iframeEl.style.border = 'none';

    document.body.appendChild(iframeEl);
  }
}
/** TODO: Add valid description
 * This runs when the page loads.
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (navigator.runAdAuction === undefined) {
    return console.log('Protected Audience API is not supported');
  }

  const adAuction = new AdAuction();
  new ComponentAuctionInfoCollector(
    adAuction.run.bind(adAuction),
    DEMO_PARTICIPANT_COUNT,
  );
});
