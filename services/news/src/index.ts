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

import {
  AD_SERVER_HOST,
  EXTERNAL_PORT,
  HOME_HOST,
  TEXT_LOREM,
  NEWS_DETAIL,
  PORT,
  SSP_A_ORIGIN,
  SSP_B_ORIGIN,
  SSP_ORIGIN,
} from './constants.js';

const app: Application = express();
app.use(express.static('src/public'));
app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('*', async (req: Request, res: Response) => {
  res.render(req.path.substring(1), {
    TITLE: NEWS_DETAIL,
    TEXT_LOREM,
    AD_SERVER_HOST,
    EXTERNAL_PORT,
    HOME_HOST,
    SSP_ORIGIN,
    SSP_A_ORIGIN,
    SSP_B_ORIGIN,
    AD_SERVER_TAG_URL: new URL(
      `https://${AD_SERVER_HOST}:${EXTERNAL_PORT}/js/ssp/ssp-tag.js`,
    ).toString(),
  });
});

app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);
});
