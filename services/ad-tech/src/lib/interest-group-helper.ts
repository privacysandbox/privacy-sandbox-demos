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

import {
  CURRENT_ORIGIN,
  BIDDING_SIGNALS_DEFAULT,
  EXTERNAL_PORT,
  HOSTNAME,
  MACRO_DISPLAY_RENDER_URL_AD_SIZE,
  MACRO_VIDEO_RENDER_URL_SSP_VAST,
  BIDDING_SIGNALS_DEALS,
} from './constants.js';

// ****************************************************************************
// ENUMS AND INTERFACES
// ****************************************************************************
/** Supported ad types. */
export enum AdType {
  DISPLAY = 'DISPLAY',
  VIDEO = 'VIDEO',
}

export enum AuctionServerRequestFlags {
  OMIT_ADS = 'omit-ads',
  OMIT_USER_BIDDING_SIGNALS = 'omit-user-bidding-signals',
}

/** Interface for an interest group ad object. */
export interface InterestGroupAd {
  // REQUIRED FIELDS
  /** Main creative URL. */
  renderURL: string;
  // OPTIONAL FIELDS
  /** Custom ad metadata stored by ad-tech.
   * NOTE: These metadata fields are for demo purposes only.
   * They are not required when using Protected Audience. */
  metadata?: {
    /** Hostname of the advertiser. */
    advertiser: string;
    /** DSIPLAY or VIDEO */
    adType: AdType;
    /** List of compatible ad sizes. */
    adSizes?: InterestGroupAdSize[];
    /** Field for handling unknown keys or new metadata fields not yet defined in this interface */
    [unknownKey: string]: unknown;
  };
  /** Render ID for B&A to pull creative from */
  adRenderId?: string;
  /** Associated ad size group label. */
  sizeGroup?: string;
  // [Optional] Reporting IDs
  /** Selectable reporting ID accessible to both buyer and seller. */
  selectableBuyerAndSellerReportingIds?: string[];
  /** Non-selectable reporting ID accessible to buyer only. */
  buyerReportingId?: string;
  /** Non-selectable reporting ID accessible to both buyer and seller. */
  buyerAndSellerReportingId?: string;
}

/** Generalized interface of an ad size. */
export interface InterestGroupAdSize {
  width: string;
  height: string;
}

/** Top-level interface of an interest group. */
export interface InterestGroup {
  /** Name of the interest group: ${advertiser}-${usecase} */
  name: string;
  /** Origin for the ad buyer. */
  owner: string;
  // OPTIONAL FIELDS
  /** URL to script defining generateBid() and reportWin(). */
  biddingLogicURL?: string;
  /** Endpoint for real-time bidding signals. */
  trustedBiddingSignalsURL?: string;
  /** Real-time bidding signals to query for. */
  trustedBiddingSignalsKeys?: string[];
  /** Endpoint to periodically update the interest group. */
  updateURL?: string;
  /** User-specific bidding signals to consider while bidding. */
  userBiddingSignals?: {[key: string]: string};
  /** All ads to consider while bidding. */
  ads?: InterestGroupAd[];
  /** Map of ad sizes indexed by a label for the size. */
  adSizes?: {[key: string]: InterestGroupAdSize};
  /** Map of ad size labels indexed by the ad size group label. */
  sizeGroups?: {[key: string]: string[]};
  /** B&A server request flags. (e.g., 'omit-ads', 'omit-user-bidding-signals'). */
  auctionServerRequestFlags?: string[];
}

/** Generalized interface of the interest group targeting context. */
export interface TargetingContext {
  // REQUIRED FIELDS
  /** Hostname of the advertiser. */
  advertiser: string;
  /** Usecase for targeting, or 'default'. */
  usecase: string;
  /** Whether this is a fresh request or an update. */
  isUpdateRequest: boolean;
  // OPTIONAL FIELDS
  /** Advertiser prouct item ID. */
  itemId?: string;
  /** Real-time bidding signal keys to include in the interest group. */
  biddingSignalKeys?: string[];
  /** All other undocumented custom query parameters. */
  additionalContext?: {[key: string]: string[]};
}

// ****************************************************************************
// HELPER FUNCTIONS
// ****************************************************************************
/** Returns video ads for a given advertiser and SSP hosts to integrate. */
const getVideoAdForRequest = (
  targetingContext: TargetingContext,
): InterestGroupAd => {
  const {advertiser} = targetingContext;
  const renderUrl = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/ads/video-ads?`,
  );
  renderUrl.searchParams.append('advertiser', advertiser);
  const ad: InterestGroupAd = {
    renderURL: `${renderUrl.toString()}&${MACRO_VIDEO_RENDER_URL_SSP_VAST}`,
    metadata: {
      advertiser,
      adType: AdType.VIDEO,
    },
    buyerReportingId: 'buyerSpecificInfo1',
    buyerAndSellerReportingId: 'seatid-1234',
  };
  if (targetingContext.isUpdateRequest) {
    // Only include deal IDs in update requests.
    ad.selectableBuyerAndSellerReportingIds = ['deal-1', 'deal-2', 'deal-3'];
  }
  return ad;
};

/** Returns the interest group display ad to for the given advertiser. */
const getDisplayAdForRequest = (
  targetingContext: TargetingContext,
): InterestGroupAd => {
  const {advertiser, itemId} = targetingContext;
  const renderUrl = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/ads/display-ads`,
  );
  renderUrl.searchParams.append('advertiser', advertiser);
  if (itemId) {
    renderUrl.searchParams.append('itemId', itemId);
  }
  const ad: InterestGroupAd = {
    renderURL: `${renderUrl.toString()}&${MACRO_DISPLAY_RENDER_URL_AD_SIZE}`,
    metadata: {
      advertiser,
      adType: AdType.DISPLAY,
      adSizes: [{width: '300px', height: '250px'}],
    },
    sizeGroup: 'medium-rectangle',
    buyerReportingId: 'buyerSpecificInfo1',
    buyerAndSellerReportingId: 'seatid-1234',
  };
  if (targetingContext.isUpdateRequest) {
    // Only include deal IDs in update requests.
    ad.selectableBuyerAndSellerReportingIds = ['deal-1', 'deal-2', 'deal-3'];
  }
  return ad;
};

/** Returns the interest group name to use. */
const getInterestGroupName = (targetingContext: TargetingContext): string => {
  const {advertiser, usecase} = targetingContext;
  return `${advertiser}-${usecase}`;
};

/** Returns the update URL with the targeting context. */
const constructInterestGroupUpdateUrl = (
  targetingContext: TargetingContext,
): string => {
  const interestGroupName = getInterestGroupName(targetingContext);
  const updateURL = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/dsp/interest-group-update.json`,
  );
  updateURL.searchParams.append('interestGroupName', interestGroupName);
  updateURL.searchParams.append('advertiser', targetingContext.advertiser);
  updateURL.searchParams.append('usecase', targetingContext.usecase);
  if (targetingContext.itemId) {
    updateURL.searchParams.append('itemId', targetingContext.itemId);
  }
  if (targetingContext.biddingSignalKeys?.length) {
    updateURL.searchParams.append(
      'biddingSignalKeys',
      targetingContext.biddingSignalKeys.join(','),
    );
  }
  if (targetingContext.additionalContext) {
    for (const [key, value] of Object.entries(
      targetingContext.additionalContext,
    )) {
      updateURL.searchParams.append(key, value.join(','));
    }
  }
  return updateURL.toString();
};

/** Returns the bidding signal keys to include in the interest group. */
const getBiddingSignalKeys = (targetingContext: TargetingContext): string[] => {
  const biddingSignalsKeys = [...BIDDING_SIGNALS_DEFAULT.map(([key]) => key)];
  if (targetingContext.biddingSignalKeys) {
    biddingSignalsKeys.push(...targetingContext.biddingSignalKeys);
  }
  if (targetingContext.isUpdateRequest) {
    // Only include keys related to deals for update requests.
    biddingSignalsKeys.push(...BIDDING_SIGNALS_DEALS.map(([key]) => key));
  }
  return biddingSignalsKeys;
};

// ****************************************************************************
// EXPORTED FUNCTIONS
// ****************************************************************************
/** Returns the interest group for the given targeting context. */
export const getInterestGroup = (
  targetingContext: TargetingContext,
): InterestGroup => {
  const {usecase} = targetingContext;
  const userBiddingSignals: {[key: string]: string} = {
    'user-signal-key-1': 'user-signal-value-1',
  };
  if (targetingContext.additionalContext) {
    for (const [key, values] of Object.entries(
      targetingContext.additionalContext,
    )) {
      userBiddingSignals[key] = JSON.stringify(values);
    }
  }
  return {
    name: getInterestGroupName(targetingContext),
    owner: CURRENT_ORIGIN,
    biddingLogicURL: new URL(
      `https://${HOSTNAME}:${EXTERNAL_PORT}/js/dsp/usecase/${usecase}/auction-bidding-logic.js`,
    ).toString(),
    trustedBiddingSignalsURL: new URL(
      `https://${HOSTNAME}:${EXTERNAL_PORT}/dsp/realtime-signals/bidding-signal.json`,
    ).toString(),
    trustedBiddingSignalsKeys: getBiddingSignalKeys(targetingContext),
    updateURL: constructInterestGroupUpdateUrl(targetingContext),
    userBiddingSignals,
    ads: [
      getDisplayAdForRequest(targetingContext),
      getVideoAdForRequest(targetingContext),
    ],
    adSizes: {
      'medium-rectangle-default': {'width': '300px', 'height': '250px'},
    },
    sizeGroups: {
      'medium-rectangle': ['medium-rectangle-default'],
    },
  };
};

export const getInterestGroupBiddingAndAuction = (
  targetingContext: TargetingContext,
): InterestGroup => {
  const hostString: string = HOSTNAME ?? 'dsp-x';
  const dspName: string = extractDspName(hostString);
  const creative: string = buildCreativeURL(hostString);
  return {
    name: `${dspName}-ig`,
    owner: CURRENT_ORIGIN,
    biddingLogicURL: new URL(
      `https://${HOSTNAME}:${EXTERNAL_PORT}/js/dsp/usecase/bidding-and-auction/bidding-logic.js`,
    ).toString(),
    trustedBiddingSignalsKeys: getBiddingSignalKeys(targetingContext),
    updateURL: constructInterestGroupUpdateUrl(targetingContext),
    ads: [
      {
        adRenderId: '1234',
        renderURL: creative,
      },
    ],
    adSizes: {
      'medium-rectangle-default': {'width': '300px', 'height': '250px'},
    },
    sizeGroups: {
      'medium-rectangle': ['medium-rectangle-default'],
    },
    auctionServerRequestFlags: [
      AuctionServerRequestFlags.OMIT_ADS,
      AuctionServerRequestFlags.OMIT_USER_BIDDING_SIGNALS,
    ],
  };
};

function extractDspName(str: string): string {
  const match = str.match(/([^-]+-[a-z])\.dev$/); // Matches "dsp-x.dev", "dsp-y.dev", etc.
  if (match) {
    return match[1];
  }
  return ''; // Return null if no match is found
}

function buildCreativeURL(hostname: string) {
  if (extractDspName(hostname).includes('x')) {
    return new URL(
      `html/protected-audience-ad-x.html`,
      `https://${HOSTNAME}:${EXTERNAL_PORT}`,
    ).toString();
  } else if (extractDspName(hostname).includes('y')) {
    return new URL(
      `html/protected-audience-ad-y.html`,
      `https://${HOSTNAME}:${EXTERNAL_PORT}`,
    ).toString();
  } else {
    return new URL(
      `html/protected-audience-ad.html`,
      `https://${HOSTNAME}:${EXTERNAL_PORT}`,
    ).toString();
  }
}
