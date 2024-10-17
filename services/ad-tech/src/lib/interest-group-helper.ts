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

import {Request} from 'express';
import {EXTERNAL_PORT, HOSTNAME} from './constants.js';

/** Supported ad types. */
export enum AdType {
  DISPLAY = 'DISPLAY',
  VIDEO = 'VIDEO',
}

/** Generalized interface for an interest group ad object. */
export interface InterestGroupAd {
  // REQUIRED FIELDS
  renderURL: string;
  metadata: {
    advertiser: string;
    adType: AdType;
    adSizes?: {width: string; height: string}[];
    seller?: string;
  };
  // OPTIONAL FIELDS
  sizeGroup?: string;
  // [Optional] Reporting IDs
  selectableBuyerAndSellerReportingIds?: string[];
  buyerReportingId?: string;
  buyerAndSellerReportingId?: string;
}

/** Both types of ad size macros supported in render URLs. */
export const RENDER_URL_SIZE_MACRO =
  'adSize1={%AD_WIDTH%}x{%AD_HEIGHT%}&adSize2=${AD_WIDTH}x${AD_HEIGHT}';

/** Helper module used to build interest group objects. */
export const InterestGroupHelper = (() => {
  /** Returns video ads for a given advertiser and SSP hosts to integrate. */
  const getVideoAdsForRequest = (
    advertiser: string,
    sspHosts: string[],
  ): InterestGroupAd[] => {
    const videoAds: InterestGroupAd[] = [];
    const renderUrl = new URL(`https://${HOSTNAME}:${EXTERNAL_PORT}/video-ads`);
    renderUrl.searchParams.append('advertiser', advertiser);
    for (const sspHost of sspHosts) {
      const sspVastUrl = encodeURIComponent(
        new URL(`https://${sspHost}:${EXTERNAL_PORT}/ssp/vast.xml`).toString(),
      );
      renderUrl.searchParams.delete('sspVast');
      renderUrl.searchParams.append('sspVast', sspVastUrl);
      videoAds.push({
        renderURL: renderUrl.toString(),
        metadata: {
          advertiser,
          adType: AdType.VIDEO,
          seller: new URL(`https://${sspHost}:${EXTERNAL_PORT}`).toString(),
        },
        selectableBuyerAndSellerReportingIds: ['deal1', 'deal2', 'deal3'],
        buyerReportingId: 'buyerSpecificInfo1',
        buyerAndSellerReportingId: 'seatid-1234',
      });
    }
    return videoAds;
  };

  /** Returns the interest group display ad to for the given advertiser. */
  const getDisplayAdForRequest = (
    advertiser: string,
    itemId?: string,
  ): InterestGroupAd => {
    const renderUrl = new URL(`https://${HOSTNAME}:${EXTERNAL_PORT}/ads`);
    renderUrl.searchParams.append('advertiser', advertiser);
    if (itemId) {
      renderUrl.searchParams.append('itemId', itemId);
    }
    return {
      renderURL: `${renderUrl.toString()}&${RENDER_URL_SIZE_MACRO}`,
      metadata: {
        advertiser,
        adType: AdType.DISPLAY,
        adSizes: [{width: '300px', height: '250px'}],
      },
      sizeGroup: 'medium-rectangle',
      selectableBuyerAndSellerReportingIds: ['deal1', 'deal2', 'deal3'],
      buyerReportingId: 'buyerSpecificInfo1',
      buyerAndSellerReportingId: 'seatid-1234',
    };
  };

  /** Returns the ads to include in the interest group request. */
  const getAdsForRequest = (
    req: Request,
    sspHosts: string[],
  ): InterestGroupAd[] => {
    const advertiser = req.query.advertiser?.toString() || HOSTNAME!;
    const itemId = req.query.itemId?.toString() || '';
    // Include all types of ads in the interest group and filter based on
    // opportunity at bidding time.
    return [
      getDisplayAdForRequest(advertiser, itemId),
      ...getVideoAdsForRequest(advertiser, sspHosts),
    ];
  };

  // Exported members of the module.
  return {
    getAdsForRequest,
  };
})();
