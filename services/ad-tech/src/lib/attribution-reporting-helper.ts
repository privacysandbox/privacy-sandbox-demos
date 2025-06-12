// FIXME: This file needs to be rationalized with arapi.ts
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

import {Dictionary} from 'structured-field-values';

import {
  debugKey,
  sourceEventId,
  sourceKeyPiece,
  triggerKeyPiece,
  getTriggerData,
  ADVERTISER,
  PUBLISHER,
  DIMENSION,
  SOURCE_TYPE,
  TRIGGER_TYPE,
} from './arapi.js';
import {EXTERNAL_PORT, NEWS_HOST} from './constants.js';

/** Returns a redirect URL for ARA if indicated in query context. */
export const getAttributionRedirectUrl = (requestQuery: {
  [key: string]: string;
}): string | undefined => {
  if ('redirect' in requestQuery) {
    // Retain original query params except 'redirect'.
    const query = Object.entries(requestQuery)
      .filter(([key, _]) => key !== 'redirect')
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const redirectUrl = `${requestQuery['redirect']}/attribution/register-source?${query}`;
    console.log('[ARA] Following redirect chain: ', redirectUrl);
    return redirectUrl;
  }
};

/** Returns ARA trigger registration headers for the request context. */
export const getAttributionTriggerHeaders = (requestQuery: {
  [key: string]: string;
}): {[key: string]: any} => {
  // usecase ara-event-filtering
  const itemId: string = requestQuery['itemId'] as string;
  const filters = {item_id: [itemId]};

  return {
    filters,
    event_trigger_data: [
      {
        trigger_data: '1',
        priority: '100',
        // deduplication_key: '1234',
      },
    ],
    aggregatable_trigger_data: [
      {
        key_piece: triggerKeyPiece({
          type: TRIGGER_TYPE['quantity'],
          id: parseInt(requestQuery.itemId, 16),
          size: Number(requestQuery.size),
          category: Number(requestQuery.category),
          option: 0,
        }),
        source_keys: ['quantity'],
      },
      {
        key_piece: triggerKeyPiece({
          type: TRIGGER_TYPE['gross'],
          id: parseInt(requestQuery.itemId, 16),
          size: Number(requestQuery.size),
          category: Number(requestQuery.category),
          option: 0,
        }),
        source_keys: ['gross'],
      },
    ],
    aggregatable_values: {
      quantity: Number(requestQuery.quantity),
      gross: Number(requestQuery.gross),
    },
    debug_key: debugKey(),
  };
};
/** Returns ARA trigger registration headers for event level. */
export const getEventLevelAttributionTriggerHeaders = (requestQuery: {
  [key: string]: string;
}): {[key: string]: any} => {
  const conversionType: string = requestQuery['conversionType'] as string;
  const [_data, _priority] = getTriggerData(conversionType);
  const itemId: string = requestQuery['itemId'] as string;

  // usecase ara-event-filtering
  const filters = {item_id: [itemId]};

  return {
    filters,
    event_trigger_data: [
      {
        trigger_data: _data,
        priority: _priority,
      },
    ],
    debug_key: debugKey(),
    debug_reporting: true,
  };
};

/** Returns ARA source registration headers for the request context. */
export const getAttributionSourceHeaders = (
  requestQuery: {
    [key: string]: string;
  },
  attributionEligibleHeader: Dictionary,
): {[key: string]: any} | undefined => {
  let sourceType = SOURCE_TYPE.unknown;
  if ('navigation-source' in attributionEligibleHeader) {
    sourceType = SOURCE_TYPE.click;
  } else if ('event-source' in attributionEligibleHeader) {
    sourceType = SOURCE_TYPE.view;
  } else {
    console.log(
      '[ARA] Request header is malformed: ',
      attributionEligibleHeader,
    );
    return;
  }
  const {advertiser, itemId, filter} = requestQuery;
  const destination = `https://${advertiser}:${EXTERNAL_PORT}`;
  const source_event_id = sourceEventId();
  const debug_key = debugKey();

  // usecase ara-event-filtering
  let filter_data: any;
  if (filter === `1`) {
    filter_data = {item_id: [itemId]};
  }

  return {
    destination,
    source_event_id,
    debug_key,
    debug_reporting: true, // Enable verbose debug reports.
    filter_data,
    aggregation_keys: {
      quantity: sourceKeyPiece({
        type: sourceType,
        advertiser: ADVERTISER[advertiser],
        publisher: PUBLISHER[NEWS_HOST!],
        id: Number(`0x${itemId}`),
        dimension: DIMENSION['quantity'],
      }),
      gross: sourceKeyPiece({
        type: sourceType,
        advertiser: ADVERTISER[advertiser],
        publisher: PUBLISHER[NEWS_HOST!],
        id: Number(`0x${itemId}`),
        dimension: DIMENSION['gross'],
      }),
    },
  };
};
