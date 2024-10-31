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

import {Router} from 'express';
const {
  EXTERNAL_PORT,
  SSP_HOST,
  SSP_A_HOST,
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

const router = Router();

router.get('/', (req, res) => {
  res.json(200);
});

router.get('/service/kv', (req, res) => {
  res.setHeader('Ad-Auction-Allowed', true);

  res.json({
    renderUrls: {
      [new URL('/uc-ba/html/ad.html', DSP_X_ORIGIN)]: [1, 2],
      [new URL('/uc-ba/html/ad.html', DSP_Y_ORIGIN)]: [1, 2],
    },
  });
});

router.get('/auction-config.json', (req, res) => {
  res.json({
    seller: SSP_ORIGIN,
    decisionLogicURL: new URL('/uc-ba/js/decision-logic.js', SSP_ORIGIN),
    trustedScoringSignals: new URL('/uc-ba/service/kv', SSP_ORIGIN),
    resolveToConfig: true,
  });
});

router.get('/ad-tag.html', async (req, res) => {
  res.render('uc-ba/ad-tag', {
    UC_BA_SSP_A_TAG_URL: new URL('/uc-ba/js/ad-tag.js', SSP_A_ORIGIN),
    UC_BA_SSP_X_TAG_URL: new URL('/uc-ba/js/ad-tag.js', SSP_X_ORIGIN),
    UC_BA_SSP_Y_TAG_URL: new URL('/uc-ba/js/ad-tag.js', SSP_Y_ORIGIN),
  });
});

router.get('/ad-tag.js', async (req, res) => {
  res.render('uc-ba/ad-tag', {});
});

export default router;
