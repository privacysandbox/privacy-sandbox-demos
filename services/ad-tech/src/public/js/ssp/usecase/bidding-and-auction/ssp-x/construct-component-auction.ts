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
const SSP_X_ORIGIN = '<%= SSP_X_ORIGIN %>';

type ComponentAuctionResult = {
  protectedAudienceAuctionResult: Uint8Array;
  contextualAuctionWinner: ContextualAuctionWinner;
  onDeviceAuctionConfig: any;
};

type ContextualAuctionWinner = {
  bid?: number;
  renderURL?: string;
  perBuyerSignals?: {[key: string]: string};
};

class AdAuction {
  constructor() {}

  async getAuctionInfo() {
    const adAuctionDataConfig = await this.#fetchAdAuctionDataConfig();
    const {requestId, request} =
      await navigator.getInterestGroupAdAuctionData(adAuctionDataConfig);
    const {protectedAudienceAuctionResult, contextualAuctionWinner} =
      await this.#runComponentAdAuction(request);

    return {
      contextualAuctionWinner,
      componentAuctionConfig: [
        {
          seller: adAuctionDataConfig.seller,
          requestId,
          serverResponse: protectedAudienceAuctionResult,
          resolveToConfig: true,
          adAuctionHeaders: true,
        },
      ],
    };
  }

  async #fetchAdAuctionDataConfig() {
    const adAuctionDataConfigUrl = new URL(
      'ssp/usecase/bidding-and-auction/service/ad/ad-auction-data-config.json',
      SSP_X_ORIGIN,
    );
    const response = await fetch(adAuctionDataConfigUrl);
    return response.json();
  }

  async #fetchContextualAuctionBuyers() {
    const contextualAuctionBuyersUrl = new URL(
      'ssp/usecase/bidding-and-auction/service/ad/contextual-auction-buyers.json',
      SSP_X_ORIGIN,
    );
    const response = await fetch(contextualAuctionBuyersUrl);
    return response.json();
  }

  async #runComponentAdAuction(request: number[]) {
    const auctionRequest = btoa(String.fromCharCode.apply(null, request));
    const unifiedAuctionUrl = new URL(
      'ssp/usecase/bidding-and-auction/service/ad/unified-auction',
      SSP_X_ORIGIN,
    );
    const {buyers} = await this.#fetchContextualAuctionBuyers();

    const response = await fetch(unifiedAuctionUrl, {
      method: 'POST',
      adAuctionHeaders: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contextual: {buyers},
        protectedAudience: {auctionRequest},
      }),
    });

    const {protectedAudienceAuctionCiphertext, contextualAuctionWinner} =
      await response.json();

    return {
      protectedAudienceAuctionResult: new Uint8Array(
        this.#decodeResponse(protectedAudienceAuctionCiphertext),
      ),
      contextualAuctionWinner,
    };
  }

  #encodeRequest(request: any) {
    return btoa(String.fromCharCode.apply(null, request));
  }

  #decodeResponse(base64response: string) {
    return new Uint8Array(
      atob(base64response)
        .split('')
        .map((char) => char.charCodeAt(0)),
    );
  }
}

async function runComponentAuction() {
  const componentAuction = new AdAuction();
  const componentAuctionInfo = await componentAuction.getAuctionInfo();

  console.log('[SSP-X] Component auction config - ', componentAuctionInfo);

  window.auctionInfoCollector.push(componentAuctionInfo);
}

runComponentAuction();
