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

import {Request, Response} from 'express';
import {decodeDict} from 'structured-field-values';

import {
  debugKey,
  sourceEventId,
  sourceKeyPiece,
  triggerKeyPiece,
  ADVERTISER,
  PUBLISHER,
  DIMENSION,
  SOURCE_TYPE,
  TRIGGER_TYPE,
} from './arapi.js';
import {NEWS_HOST} from './constants.js';

export const handleAttributionTriggerRegistration = (
  req: Request,
  res: Response,
) => {
  const id: string = req.query.itemId as string;
  const quantity: string = req.query.quantity as string;
  const size: string = req.query.size as string;
  const category: string = req.query.category as string;
  const gross: string = req.query.gross as string;
  const AttributionReportingRegisterTrigger = {
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
          id: parseInt(id, 16),
          size: Number(size),
          category: Number(category),
          option: 0,
        }),
        source_keys: ['quantity'],
      },
      {
        key_piece: triggerKeyPiece({
          type: TRIGGER_TYPE['gross'],
          id: parseInt(id, 16),
          size: Number(size),
          category: Number(category),
          option: 0,
        }),
        source_keys: ['gross'],
      },
    ],
    aggregatable_values: {
      // TODO: scaling
      quantity: Number(quantity),
      gross: Number(gross),
    },
    debug_key: debugKey(),
  };
  res.setHeader(
    'Attribution-Reporting-Register-Trigger',
    JSON.stringify(AttributionReportingRegisterTrigger),
  );
  res.sendStatus(200);
};

export const handleAttributionSourceRegistration = (
  req: Request,
  res: Response,
  isStrict = true,
) => {
  const isRequestEligible = registerAttributionSourceHeadersIfEligible(
    req,
    res,
  );
  if (isStrict && !isRequestEligible) {
    res.status(400).send('Request is not eligible for attribution reporting.');
    return;
  }
  if ('redirect' in req.query) {
    // Retain original query params except 'redirect'.
    const query = Object.entries(req.query)
      .filter(([key, _]) => key !== 'redirect')
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const redirectUrl = `${req.query['redirect']}/attribution/register-source?${query}`;
    console.log('[ARA] Following redirect chain: ', redirectUrl);
    res.redirect(redirectUrl);
    return;
  }
  if (isRequestEligible) {
    res
      .status(200)
      .send(`Attribution source registered: ${JSON.stringify(req.query)}`);
  } else {
    res
      .status(200)
      .send(
        'Event-level report received, but request is not eligible for ' +
          'attribution reporting.',
      );
  }
};

/** Add attribution source registration HTTP headers if eligible. */
const registerAttributionSourceHeadersIfEligible = (
  req: Request,
  res: Response,
) => {
  if (!('attribution-reporting-eligible' in req.headers)) {
    console.log(
      '[ARA] Request is not eligible for attribution reporting: ',
      req.originalUrl,
    );
    return false;
  }
  // Parse structured headers.
  const attributionHeaders = decodeDict(
    req.headers['attribution-reporting-eligible'] as string,
  );
  // Determine source type.
  let sourceType = SOURCE_TYPE.unknown;
  if ('navigation-source' in attributionHeaders) {
    console.log(
      '[ARA] Registering a click attribution source: ',
      req.originalUrl,
    );
    sourceType = SOURCE_TYPE.click;
  } else if ('event-source' in attributionHeaders) {
    console.log(
      '[ARA] Registering a view attribution source: ',
      req.originalUrl,
    );
    sourceType = SOURCE_TYPE.view;
  }
  if (SOURCE_TYPE.unknown === sourceType) {
    console.log('[ARA] Request header is malformed: ', req.originalUrl);
    return false;
  }
  const advertiser = req.query.advertiser as string;
  const id = req.query.itemId as string;
  const destination = `https://${advertiser}`;
  const source_event_id = sourceEventId();
  const debug_key = debugKey();
  const AttributionReportingRegisterSource = {
    demo_host: 'dsp', // Included for debugging, not an actual field.
    destination,
    source_event_id,
    debug_key,
    debug_reporting: true, // Enable verbose debug reports.
    aggregation_keys: {
      quantity: sourceKeyPiece({
        type: SOURCE_TYPE[sourceType],
        advertiser: ADVERTISER[advertiser],
        publisher: PUBLISHER[NEWS_HOST!],
        id: Number(`0x${id}`),
        dimension: DIMENSION['quantity'],
      }),
      gross: sourceKeyPiece({
        type: SOURCE_TYPE[sourceType],
        advertiser: ADVERTISER[advertiser],
        publisher: PUBLISHER[NEWS_HOST!],
        id: Number(`0x${id}`),
        dimension: DIMENSION['gross'],
      }),
    },
  };
  console.log('[ARA] Registering attribution source :', {
    AttributionReportingRegisterSource,
  });
  res.setHeader(
    'Attribution-Reporting-Register-Source',
    JSON.stringify(AttributionReportingRegisterSource),
  );
  return true;
};
