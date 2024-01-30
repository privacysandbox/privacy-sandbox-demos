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

// SSP_A
import express from 'express';

const {
  EXTERNAL_PORT,
  PORT,
  SSP_A_HOST,
  SSP_A_DETAIL,
  SSP_A_TOKEN,
  DSP_HOST,
  SHOP_HOST,
} = process.env;

const app = express();

app.use((req, res, next) => {
  res.setHeader('Origin-Trial', SSP_A_TOKEN);
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  // opt-in fencedframe
  if (req.get('sec-fetch-dest') === 'fencedframe') {
    res.setHeader('Supports-Loading-Mode', 'fenced-frame');
  }
  next();
});

app.use(
  express.static('src/public', {
    setHeaders: (res, path, stat) => {
      if (path.endsWith('/decision-logic.js')) {
        return res.set('X-Allow-FLEDGE', 'true');
      }
      if (path.endsWith('/run-ad-auction.js')) {
        res.set('Supports-Loading-Mode', 'fenced-frame');
        res.set('Permissions-Policy', 'run-ad-auction=(*)');
      }
    },
  }),
);
app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('/', async (req, res) => {
  const title = SSP_A_DETAIL;
  res.render('index.html.ejs', {
    title,
    DSP_HOST,
    SSP_A_HOST,
    EXTERNAL_PORT,
    SHOP_HOST,
  });
});

app.get('/ad-tag.html', async (req, res) => {
  res.render('ad-tag.html.ejs');
});

app.get('/video-ad-tag.html', async (req, res) => {
  res.render('video-ad-tag.html.ejs');
});

app.get('/auction-config.json', async (req, res) => {
  const DSP = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}`);
  const SSP_A = new URL(`https://${SSP_A_HOST}:${EXTERNAL_PORT}`);
  const auctionConfig = {
    // should https & same as decisionLogicUrl's origin
    seller: SSP_A,

    // x-allow-fledge: true
    decisionLogicUrl: `${SSP_A}js/decision-logic.js`,

    interestGroupBuyers: [
      // * is not supported yet
      DSP,
    ],
    // public for everyone
    auctionSignals: {
      auction_signals: 'auction_signals',
    },

    // only for single party
    sellerSignals: {
      seller_signals: 'seller_signals',
    },

    // only for single party
    perBuyerSignals: {
      // listed on interestGroupByers
      [DSP]: {
        per_buyer_signals: 'per_buyer_signals',
      },
    },

    // use with fencedframe
    resolveToConfig: true,
  };
  console.log({auctionConfig});
  res.json(auctionConfig);
});


app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});
