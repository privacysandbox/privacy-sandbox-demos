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

import express, {Application, Request, Response} from 'express';

import {EXTERNAL_PORT, PORT, NEWS_HOST, NEWS_DETAIL} from './constants.js';
import {HOME_HOST, SSP_HOST, SSP_A_HOST, SSP_B_HOST} from './constants.js';
import {SSP_A_ORIGIN, SSP_B_ORIGIN, AD_SERVER_HOST} from './constants.js';
import {TOPICS_SERVER_HOST} from './constants.js';

const app: Application = express();

const TITLE = NEWS_DETAIL;
const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
app.use(express.static('src/public'));
app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('/', async (req: Request, res: Response) => {
  res.render('index', {
    title: TITLE,
    lorem: LOREM,
    EXTERNAL_PORT,
    HOME_HOST,
    SSP_A_HOST,
    SSP_B_HOST,
    AD_SERVER_HOST,
    SSP_TAG_URL: `https://${SSP_HOST}/js/ssp/ssp-tag.js`,
    AD_SERVER_LIB_URL: `https://${AD_SERVER_HOST}/js/ad-server-lib.js`,
    HEADER_BIDDING_LIB_URL: `https://${NEWS_HOST}/js/header-bidding-lib.js`,
    isMultiSeller: 'multi' === req.query.auctionType,
  });
});

app.get('/video-ad', async (req: Request, res: Response) => {
  res.render('video-ad', {
    title: TITLE,
    lorem: LOREM,
    EXTERNAL_PORT,
    HOME_HOST,
    SSP_HOST,
  });
});

app.get('/test', async (req: Request, res: Response) => {
  res.render('test', {
    title: TITLE,
    lorem: LOREM,
    EXTERNAL_PORT,
    HOME_HOST,
    SSP_A_ORIGIN,
    SSP_B_ORIGIN,
    AD_SERVER_LIB_URL: new URL(
      `https://${AD_SERVER_HOST}:${EXTERNAL_PORT}/js/ad-server-lib.js`,
    ).toString(),
  });
});

app.get('/test-topics', async (req: Request, res: Response) => {
  const hostname = req.hostname;
  const title = hostname.substring(0, hostname.indexOf('.')) || 'news';
  const params = {
    title,
    TOPICS_SERVER_HOST,
  };
  res.render('test-topics', params);
});

app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);
});
