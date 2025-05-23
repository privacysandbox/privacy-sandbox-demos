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

import express, {Router, Request, Response} from 'express';
import baOnlyClientSFE from './server/ssp-x-sfe-client.js';
import mixedModeClientSFE from './server/ssp-y-sfe-client.js';
import grpc from '@grpc/grpc-js';
import {createHash} from 'crypto';

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

const {
  EXTERNAL_PORT,
  SSP_HOST,
  SSP_X_HOST,
  SSP_Y_HOST,
  DSP_A_HOST,
  DSP_B_HOST,
  DSP_X_HOST,
  DSP_X_URI,
  DSP_Y_HOST,
  DSP_Y_URI,
} = process.env;

const SSP_ORIGIN = new URL(`https://${SSP_HOST}:${EXTERNAL_PORT}`).origin;
const SSP_X_ORIGIN = new URL(`https://${SSP_X_HOST}:${EXTERNAL_PORT}`).origin;
const SSP_Y_ORIGIN = new URL(`https://${SSP_Y_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_A_ORIGIN = new URL(`https://${DSP_A_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_B_ORIGIN = new URL(`https://${DSP_B_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_X_ORIGIN = new URL(`https://${DSP_X_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_Y_ORIGIN = new URL(`https://${DSP_Y_HOST}:${EXTERNAL_PORT}`).origin;

const SSP_Y_DECISION_LOGIC_URL = new URL(
  'js/ssp/usecase/bidding-and-auction/ssp-y/decision-logic.js',
  SSP_Y_ORIGIN,
);
const SSP_Y_KV_URL = new URL('ssp/ssp-y/service/kv', SSP_Y_ORIGIN);

const router = Router();
router.use(express.json({limit: '50mb'}));

function findPerBuyerSignals(contextualAuctionResult: any, origin: any) {
  return contextualAuctionResult.find(
    ({buyer}: {buyer: Origin}) => buyer === origin,
  ).perBuyerSignals;
}

function buildPerBuyerConfigs(contextualAuctionResult: any) {
  return [DSP_X_ORIGIN, DSP_Y_ORIGIN].reduce(
    (configs: BuyerSignals, origin: Origin): PerBuyerConfigs => {
      configs[origin] = {
        buyer_signals: findPerBuyerSignals(contextualAuctionResult, origin),
      };
      return configs;
    },
    {},
  );
}

function encodeResponse(response: any) {
  return btoa(String.fromCharCode.apply(null, response));
}

function decodeRequest(auctionRequest: string) {
  return new Uint8Array(
    atob(auctionRequest)
      .split('')
      .map((char) => char.charCodeAt(0)),
  );
}

async function runContextualAuction({buyers}: any) {
  const adServerBids = await Promise.all(
    Object.keys(buyers).map(async (buyer) => {
      const response = await fetch(buyers[buyer].bidUrl);
      const result = await response.json();
      result.buyer = buyer;
      return result;
    }),
  );

  return adServerBids.sort((a, b) => b.bid - a.bid);
}

function runProtectedAudienceAuction(
  protectedAudience: any,
  contextualAuctionResult: any,
  metadata: any,
  host: any,
  res: Response,
) {
  const [contextualAuctionWinner] = contextualAuctionResult;
  const {auctionRequest} = protectedAudience;
  const perBuyerConfigs = buildPerBuyerConfigs(contextualAuctionResult);
  let SELLER_HOST;
  if (host.includes(SSP_X_HOST)) {
    SELLER_HOST = SSP_X_ORIGIN;
  } else {
    SELLER_HOST = SSP_Y_ORIGIN;
  }
  const selectAdRequest = {
    auction_config: {
      top_level_seller: SSP_ORIGIN,
      seller: SELLER_HOST,
      seller_signals: '{"testKey":"someValue"}',
      auction_signals: `{"bidFloor": 0}`,
      buyer_list: [DSP_X_ORIGIN, DSP_Y_ORIGIN],
      per_buyer_config: {
        [DSP_X_ORIGIN]: {
          buyer_signals: JSON.stringify(
            perBuyerConfigs[DSP_X_ORIGIN].buyer_signals,
          ),
        },
        [DSP_Y_ORIGIN]: {
          buyer_signals: JSON.stringify(
            perBuyerConfigs[DSP_Y_ORIGIN].buyer_signals,
          ),
        },
      },
    },
    client_type: 'CLIENT_TYPE_BROWSER',
    protected_auction_ciphertext: decodeRequest(auctionRequest),
  };
  if (host.includes(SSP_X_HOST) && baOnlyClientSFE) {
    baOnlyClientSFE.selectAd(
      selectAdRequest,
      metadata,
      (error: grpc.ServiceError | null, response: any) => {
        if (error) {
          console.error(
            `[ssp-x] Error received from SFE: ${error.message}. Code: ${error.code}, Details: ${error.details}`,
          );
          // Send an appropriate HTTP error response to the client of this /unified-auction endpoint
          res.status(503).json({
            error: 'SFE service unavailable',
            sfeErrorDetails: {code: error.code, message: error.message},
          });
          return;
        }
        if (!response || !response.auction_result_ciphertext) {
          console.error('[ssp-x] Invalid or empty response from SFE.');
          res.status(500).json({error: 'Invalid response from SFE service'});
          return;
        }

        const ciphertextShaHash = createHash('sha256')
          .update(response.auction_result_ciphertext, 'base64')
          .digest('base64url');

        res.set('Ad-Auction-Result', ciphertextShaHash);
        res.json({
          contextualAuctionWinner,
          protectedAudienceAuctionCiphertext: encodeResponse(
            response.auction_result_ciphertext,
          ),
        });
      },
    );
  }
  if (host.includes(SSP_Y_HOST) && mixedModeClientSFE) {
    mixedModeClientSFE.selectAd(
      selectAdRequest,
      metadata,
      (error: grpc.ServiceError | null, response: any) => {
        if (error) {
          console.error(
            `[ssp-y] Error received from SFE: ${error.message}. Code: ${error.code}, Details: ${error.details}`,
          );
          // Send an appropriate HTTP error response to the client of this /unified-auction endpoint
          res.status(503).json({
            error: 'SFE service unavailable',
            sfeErrorDetails: {code: error.code, message: error.message},
          });
          return;
        }
        if (!response || !response.auction_result_ciphertext) {
          console.error('[ssp-y] Invalid or empty response from SFE.');
          res.status(500).json({error: 'Invalid response from SFE service'});
          return;
        }

        const ciphertextShaHash = createHash('sha256')
          .update(response.auction_result_ciphertext, 'base64')
          .digest('base64url');

        res.set('Ad-Auction-Result', ciphertextShaHash);
        res.json({
          contextualAuctionWinner,
          protectedAudienceAuctionCiphertext: encodeResponse(
            response.auction_result_ciphertext,
          ),
          onDeviceAuctionConfig: {
            trustedScoringSignalsURL: SSP_Y_KV_URL,
            decisionLogicURL: SSP_Y_DECISION_LOGIC_URL,
            buyers: [DSP_A_ORIGIN, DSP_B_ORIGIN],
            perBuyerSignals: {
              [DSP_A_ORIGIN]: perBuyerConfigs[DSP_A_ORIGIN],
              [DSP_B_ORIGIN]: perBuyerConfigs[DSP_B_ORIGIN],
            },
          },
        });
      },
    );
  }
}

router.get('/', (req: Request, res: Response) => {
  res.json(200);
});

router.get('/contextual-auction-buyers.json', (req: Request, res: Response) => {
  res.json({
    buyers: {
      [DSP_X_ORIGIN]: {bidUrl: new URL('/dsp/contextual-bid-ba', DSP_X_URI)},
      [DSP_Y_ORIGIN]: {bidUrl: new URL('/dsp/contextual-bid-ba', DSP_Y_URI)},
    },
  });
});

router.post('/unified-auction', async (req: Request, res: Response) => {
  const {contextual, protectedAudience} = req.body;
  const host = req.headers.host;

  const metadata = new grpc.Metadata();
  metadata.add('X-Accept-Language', req.header('Accept-Language') || '');
  metadata.add('X-User-Agent', req.header('User-Agent') || '');
  metadata.add('X-BnA-Client-IP', req.ip || '');

  const contextualAuctionResult = await runContextualAuction(contextual);
  runProtectedAudienceAuction(
    protectedAudience,
    contextualAuctionResult,
    metadata,
    host,
    res,
  );
  console.log('[B&A Demo] Unified Auction is complete. ');
});

export default router;
