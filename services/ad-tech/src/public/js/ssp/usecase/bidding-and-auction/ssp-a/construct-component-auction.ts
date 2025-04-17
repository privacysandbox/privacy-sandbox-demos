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
const SSP_A_ORIGIN = '<%= SSP_A_ORIGIN %>';
const DSP_A_ORIGIN = '<%= DSP_A_ORIGIN %>';
const DSP_B_ORIGIN = '<%= DSP_B_ORIGIN %>';

type Origin = string;
type BuyerSignals = {
  [key: string]: any;
};

type PerBuyerConfig = {
  buyer_signals: BuyerSignals;
};

type PerBuyerConfigs = {
  [key: Origin]: PerBuyerConfig;
};

class AdAuction {
  constructor() {}

  async getAuctionInfo() {
    const componentAuctionConfig = await this.#fetchComponentAuctionConfig();
    const contextualAuctionResult = await this.#fetchContextualAuctionResult();
    const [contextualAuctionWinner] = contextualAuctionResult;

    componentAuctionConfig.auctionSignals = {
      bidFloor: 0,
    };
    componentAuctionConfig.perBuyerSignals = this.buildPerBuyerConfigs(
      contextualAuctionResult,
    );

    return {
      contextualAuctionWinner,
      componentAuctionConfig,
    };
  }

  async #fetchComponentAuctionConfig() {
    const adAuctionConfigUrl = new URL(
      'ssp/usecase/bidding-and-auction/ssp-a/service/ad/auction-config.json',
      SSP_A_ORIGIN,
    );

    const response = await fetch(adAuctionConfigUrl);
    return await response.json();
  }

  async #fetchContextualAuctionResult() {
    const contextualAuctionUrl = new URL(
      'ssp/usecase/bidding-and-auction/ssp-a/service/ad/contextual-auction',
      SSP_A_ORIGIN,
    );
    const response = await fetch(contextualAuctionUrl);
    return await response.json();
  }

  findPerBuyerSignals(contextualAuctionResult: any, origin: any) {
    return contextualAuctionResult.find(
      ({buyer}: {buyer: Origin}) => buyer === origin,
    ).perBuyerSignals;
  }

  buildPerBuyerConfigs(contextualAuctionResult: any) {
    return [DSP_A_ORIGIN, DSP_B_ORIGIN].reduce(
      (configs: BuyerSignals, origin: Origin): PerBuyerConfigs => {
        configs[origin] = this.findPerBuyerSignals(
          contextualAuctionResult,
          origin,
        );
        return configs;
      },
      {},
    );
  }
}

async function runComponentAuction() {
  const componentAuction = new AdAuction();
  const componentAuctionInfo = await componentAuction.getAuctionInfo();

  console.log(
    '[SSP-A][on-device] Component auction config ',
    componentAuctionInfo,
  );

  window.auctionInfoCollector.push(componentAuctionInfo);
}

runComponentAuction();
