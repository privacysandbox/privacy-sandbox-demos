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

import path from 'path';
import {readFile} from 'fs/promises';
import express, {Router} from 'express';
import ejs from 'ejs';
import adService from './ad-service.js';
import type {AdAuctionDataConfig} from '../../../../public/js/ssp/usecase/bidding-and-auction/model/model.js';
const {
  EXTERNAL_PORT,
  SSP_HOST,
  SSP_A_HOST,
  DSP_A_HOST,
  DSP_B_HOST,
  DSP_A_URI,
  DSP_B_URI,
  SSP_X_HOST,
  SSP_Y_HOST,
  DSP_X_HOST,
  DSP_Y_HOST,
} = process.env;

const SSP_ORIGIN = new URL(`https://${SSP_HOST}:${EXTERNAL_PORT}`).origin;
const SSP_A_ORIGIN = new URL(`https://${SSP_A_HOST}:${EXTERNAL_PORT}`).origin;
const SSP_X_ORIGIN = new URL(`https://${SSP_X_HOST}:${EXTERNAL_PORT}`).origin;
const SSP_Y_ORIGIN = new URL(`https://${SSP_Y_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_X_ORIGIN = new URL(`https://${DSP_X_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_Y_ORIGIN = new URL(`https://${DSP_Y_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_A_ORIGIN = new URL(`https://${DSP_A_HOST}:${EXTERNAL_PORT}`).origin;
const DSP_B_ORIGIN = new URL(`https://${DSP_B_HOST}:${EXTERNAL_PORT}`).origin;

/** Routes for TLS */
export const tlsRouter = express.Router();
/** Routes for SSP A */
export const sspARouter = express.Router();
/** Routes for SSP X and SSP Y */
export const sspXRouter = express.Router();
export const sspYRouter = express.Router();

tlsRouter.get('/', (req, res) => {
  res.json(200);
});

/** Full route: /ssp/usecase/bidding-and-auction/auction-config.json */
tlsRouter.get('/auction-config.json', (req, res) => {
  console.log('Route invoked /auction-config.json');
  res.json({
    seller: SSP_ORIGIN,
    decisionLogicURL: new URL(
      '/js/ssp/usecase/bidding-and-auction/ssp/decision-logic.js',
      SSP_ORIGIN,
    ),
    trustedScoringSignals: new URL(
      '/ssp/usecase/bidding-and-auction/service/kv',
      SSP_ORIGIN,
    ),
    resolveToConfig: true,
  });
});

/** Full route: /ssp/usecase/bidding-and-auction/ad-tag.html */
tlsRouter.get('/ad-tag.html', async (req, res) => {
  res.render('ssp/usecase/bidding-and-auction/ad-tag', {
    BIDDING_AND_AUCTION_SSP_A_TAG_URL: new URL(
      '/ssp/usecase/bidding-and-auction/ssp-a/construct-component-auction.js',
      SSP_A_ORIGIN,
    ),
    BIDDING_AND_AUCTION_SSP_X_TAG_URL: new URL(
      '/ssp/usecase/bidding-and-auction/ssp-x/construct-component-auction.js',
      SSP_X_ORIGIN,
    ),
    BIDDING_AND_AUCTION_SSP_Y_TAG_URL: new URL(
      '/ssp/usecase/bidding-and-auction/ssp-y/construct-component-auction.js',
      SSP_Y_ORIGIN,
    ),
  });
});

tlsRouter.get('/ad-tag.js', async (req, res) => {
  res.render('ssp/usecase/bidding-and-auction/ad-tag', {});
});

tlsRouter.get('/service/kv', (req, res) => {
  res.setHeader('Ad-Auction-Allowed', 'true');

  res.json({
    renderUrls: {
      [new URL('/html/contextual-ad.html', DSP_X_ORIGIN).toString()]: [1, 2],
      [new URL('/html/contextual-ad.html', DSP_Y_ORIGIN).toString()]: [1, 2],
    },
  });
});

tlsRouter.use('/service/ad', adService);

sspARouter.use(
  express.static('src/public/js/ssp/usecase/bidding-and-auction/ssp-a', {
    setHeaders: (res, path) => {
      if (path.includes('decision-logic.js')) {
        res.set('Ad-Auction-Allowed', 'true');
      }

      if (path.includes('run-ad-auction.js')) {
        res.set('Supports-Loading-Mode', 'fenced-frame');
        res.set('Permissions-Policy', 'run-ad-auction=(*)');
      }
    },
  }),
);

sspARouter.get('/service/ad/auction-config.json', async (req, res) => {
  console.log('[B&A SSP-A] Return auction config.');
  res.json({
    seller: SSP_A_ORIGIN,
    interestGroupBuyers: [DSP_A_ORIGIN, DSP_B_ORIGIN],
    decisionLogicURL: new URL(
      '/js/ssp/usecase/bidding-and-auction/ssp-a/decision-logic.js',
      SSP_A_ORIGIN,
    ),
    trustedScoringSignalsURL: new URL(
      'ssp/usecase/bidding-and-auction/service/kv',
      SSP_A_ORIGIN,
    ),
    resolveToConfig: true,
  });
});

sspARouter.get('/service/ad/contextual-auction', async (req, res) => {
  console.log('[B&A SSP-A] Running contextual auction with DSP-A as buyer.');
  const buyers = {
    [DSP_A_ORIGIN]: {
      bidUrl: new URL('/dsp/contextual-bid', DSP_A_URI).toString(),
    },
    [DSP_B_ORIGIN]: {
      bidUrl: new URL('/dsp/contextual-bid', DSP_B_URI).toString(),
    },
  };

  const adServerBids = await Promise.all(
    Object.keys(buyers).map(async (buyer) => {
      const response = await fetch(buyers[buyer].bidUrl);
      const result = await response.json();
      result.buyer = buyer;
      return result;
    }),
  );

  res.json(adServerBids.sort((a, b) => b.bid - a.bid));
});

sspARouter.get('/service/kv', (req, res) => {
  res.setHeader('Ad-Auction-Allowed', 'true');

  res.json({
    renderUrls: {
      [new URL('/html/contextual-ad.html', DSP_A_ORIGIN).toString()]: [1, 2],
      [new URL('/html/contextual-ad.html', DSP_B_ORIGIN).toString()]: [1, 2],
    },
  });
});

sspARouter.get('/construct-component-auction.js', async (req, res) => {
  console.log('[B&A] Construct component auction for SSP A.');
  const filePath = path.join(
    path.resolve(),
    '/build/public/js/ssp/usecase/bidding-and-auction/ssp-a/construct-component-auction.js',
  );
  const file = await readFile(filePath, {encoding: 'utf8'});
  const compiledFile = await ejs.compile(file);
  const fileContent = compiledFile({SSP_A_ORIGIN, DSP_A_ORIGIN, DSP_B_ORIGIN});

  res.set('content-type', 'text/javascript');

  res.send(fileContent);
});

sspARouter.get('/', (req, res) => {
  res.sendStatus(200);
});

/** sspXYRouter will only serve static files from this static file location. */
sspXRouter.use(
  express.static('src/public/js/ssp/usecase/bidding-and-auction/ssp-x', {
    setHeaders: (res, path) => {
      if (path.includes('decision-logic.js')) {
        res.set('Ad-Auction-Allowed', 'true');
      }

      if (path.includes('run-ad-auction.js')) {
        res.set('Supports-Loading-Mode', 'fenced-frame');
        res.set('Permissions-Policy', 'run-ad-auction=(*)');
      }
    },
  }),
);

/** Full route: /ssp/usecase/bidding-and-auction/service/ad */
sspXRouter.use('/service/ad', adService);

// sspXRouter.get('/service/kv', (req, res) => {
//   res.setHeader('Ad-Auction-Allowed', 'true');

//   res.json({
//     renderUrls: {
//       [new URL('/html/protected-audience-ad.html', DSP_X_ORIGIN,).toString()]: [1, 2],
//       [new URL('/html/protected-audience-ad.html', DSP_Y_ORIGIN,).toString()]: [1, 2],
//     },
//   })
// });

sspXRouter.get('/construct-component-auction.js', async (req, res) => {
  console.log('[B&A] Construct component auction for SSP X.');
  let filePath;
  filePath = path.join(
    path.resolve(),
    '/build/public/js/ssp/usecase/bidding-and-auction/ssp-x/construct-component-auction.js',
  );
  const file = await readFile(filePath, {encoding: 'utf8'});
  const compiledFile = await ejs.compile(file);
  const fileContent = compiledFile({SSP_X_ORIGIN});

  res.set('content-type', 'text/javascript');

  res.send(fileContent);
});

sspXRouter.get('/', (req, res) => {
  res.sendStatus(200);
});

/** sspYRouter will only serve static files from this static file location. */
sspYRouter.use(
  express.static('src/public/js/ssp/usecase/bidding-and-auction/ssp-y', {
    setHeaders: (res, path) => {
      if (path.includes('decision-logic.js')) {
        res.set('Ad-Auction-Allowed', 'true');
      }

      if (path.includes('run-ad-auction.js')) {
        res.set('Supports-Loading-Mode', 'fenced-frame');
        res.set('Permissions-Policy', 'run-ad-auction=(*)');
      }
    },
  }),
);

/** Full route: /ssp/usecase/bidding-and-auction/ssp-y/service/ad */

sspYRouter.use('/service/ad', adService);

/** Full route: /ssp/usecase/bidding-and-auction/ssp-y/service/kv */
// sspYRouter.get('/service/kv', (req, res) => {
//   res.setHeader('Ad-Auction-Allowed', 'true');

//   res.json({
//     renderUrls: {
//       [new URL(
//         '/html/protected-audience-ad.html',
//         DSP_X_ORIGIN,
//       ).toString()]: [1, 2],
//       [new URL(
//         '/html/protected-audience-ad.html',
//         DSP_Y_ORIGIN,
//       ).toString()]: [1, 2],
//     },
//   });
// });

/** Full route: /ssp/usecase/bidding-and-auction/ssp-y/construct-component-auction */
sspYRouter.get('/construct-component-auction.js', async (req, res) => {
  let filePath;
  filePath = path.join(
    path.resolve(),
    '/build/public/js/ssp/usecase/bidding-and-auction/ssp-y/construct-component-auction.js',
  );
  const file = await readFile(filePath, {encoding: 'utf8'});
  const compiledFile = await ejs.compile(file);
  const fileContent = compiledFile({SSP_Y_ORIGIN});

  res.set('content-type', 'text/javascript');

  res.send(fileContent);
});

sspYRouter.get('/', (req, res) => {
  res.sendStatus(200);
});
