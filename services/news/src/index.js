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
import express from 'express';
const { EXTERNAL_PORT, PORT, HOME_HOST, SSP_HOST, SSP_A_HOST, SSP_B_HOST, AD_SERVER_HOST, NEWS_HOST, NEWS_TOKEN, NEWS_DETAIL, DSP_HOST, } = process.env;
const app = express();
const TITLE = NEWS_DETAIL;
const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
app.use((req, res, next) => {
    res.setHeader('Origin-Trial', NEWS_TOKEN);
    next();
});
app.use(express.static('src/public'));
app.set('view engine', 'ejs');
app.set('views', 'src/views');
app.get('/', async (req, res) => {
    const { auctionType } = req.query;
    const bucket = req.query.key;
    const cloudEnv = req.query.env;
    res.render('index', {
        title: TITLE,
        lorem: LOREM,
        EXTERNAL_PORT,
        HOME_HOST,
        NEWS_TOKEN,
        DSP_HOST,
        SSP_A_HOST,
        SSP_B_HOST,
        AD_SERVER_HOST,
        SSP_TAG_URL: `https://${SSP_HOST}/ad-tag.js`,
        AD_SERVER_LIB_URL: `https://${AD_SERVER_HOST}/js/ad-server-lib.js`,
        HEADER_BIDDING_LIB_URL: `https://${NEWS_HOST}/js/header-bidding-lib.js`,
        isMultiSeller: auctionType === 'multi',
        bucket: bucket,
        cloudEnv: cloudEnv,
    });
});
app.get('/video-ad', async (req, res) => {
    res.render('video-ad', {
        title: TITLE,
        lorem: LOREM,
        EXTERNAL_PORT,
        HOME_HOST,
        NEWS_TOKEN,
        SSP_HOST,
    });
});
app.get('/uc-ba', async (req, res) => {
    res.render('uc-ba', {
        title: TITLE,
        lorem: LOREM,
        UC_BA_SSP_TAG_URL: `https://${SSP_HOST}/uc-ba/js/ad-tag.js`,
    });
});
app.listen(PORT, async () => {
    console.log(`Listening on port ${PORT}`);
});
