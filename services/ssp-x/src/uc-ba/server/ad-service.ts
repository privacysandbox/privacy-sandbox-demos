import express, {Router, Request, Response} from 'express';
import sfeClient from './sfe-client.js';
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
  DSP_A_HOST,
  DSP_A_URI,
  DSP_B_HOST,
  DSP_B_URI,
  DSP_X_HOST,
  DSP_X_URI,
  DSP_Y_HOST,
  DSP_Y_URI,
} = process.env;

const SSP_ORIGIN = new URL(`https://${SSP_HOST}:${EXTERNAL_PORT}`).origin;
const SSP_X_ORIGIN = new URL(`https://${SSP_X_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_A_ORIGIN = new URL(`https://${DSP_A_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_B_ORIGIN = new URL(`https://${DSP_B_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_X_ORIGIN = new URL(`https://${DSP_X_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_Y_ORIGIN = new URL(`https://${DSP_Y_HOST}:${EXTERNAL_PORT}`).origin;

const SSP_X_DECISION_LOGIC_URL = new URL(
  '/uc-ba/js/decision-logic.js',
  SSP_X_ORIGIN,
);
const SSP_X_KV_URL = new URL('/uc-ba/service/kv', SSP_X_ORIGIN);

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
  res: Response,
) {
  const [contextualAuctionWinner] = contextualAuctionResult;
  const {auctionRequest} = protectedAudience;

  const perBuyerConfigs = buildPerBuyerConfigs(contextualAuctionResult);

  const selectAdRequest = {
    auction_config: {
      top_level_seller: SSP_ORIGIN,
      seller: SSP_X_ORIGIN,
      seller_signals: '{"testKey":"someValue"}',
      auction_signals: `{"bidFloor": ${contextualAuctionWinner.bid}}`,
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

  sfeClient.selectAd(selectAdRequest, (error: any, response: any) => {
    if (!response) {
      console.log(`No response received from SFE.  Error=${error}`);
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
  });
}

router.get('/', (req: Request, res: Response) => {
  res.json(200);
});

router.get('/contextual-auction-buyers.json', (req: Request, res: Response) => {
  res.json({
    buyers: {
      [DSP_X_ORIGIN]: {bidUrl: new URL('/uc-ba/contextual-bid', DSP_X_URI)},
      [DSP_Y_ORIGIN]: {bidUrl: new URL('/uc-ba/contextual-bid', DSP_Y_URI)},
    },
  });
});

router.get('/ad-auction-data-config.json', (req: Request, res: Response) => {
  const adAuctionDataConfig = {
    // top_level_seller: SSP_ORIGIN,
    // top_level_seller: SSP_X_ORIGIN,
    seller: SSP_X_ORIGIN,
    requestSize: 51200,
    perBuyerConfig: {
      [DSP_X_ORIGIN]: {targetSize: 8192},
      [DSP_Y_ORIGIN]: {targetSize: 8192},
    },
  };

  res.json(adAuctionDataConfig);
});

router.post('/unified-auction', async (req: Request, res: Response) => {
  const {contextual, protectedAudience} = req.body;

  const contextualAuctionResult = await runContextualAuction(contextual);
  runProtectedAudienceAuction(protectedAudience, contextualAuctionResult, res);
});

export default router;
