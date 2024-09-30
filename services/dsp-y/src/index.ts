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

// DSP
import express, {Application, Request, Response} from 'express';
import {buildInterestGroup} from './server/helper/build-interest-group.js';

const {EXTERNAL_PORT, PORT, DSP_Y_HOST, DSP_Y_TOKEN, DSP_Y_DETAIL, SHOP_HOST} =
  process.env;

const app: Application = express();

app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Origin-Trial', DSP_Y_TOKEN as string);
  next();
});

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(
  express.static('src/public', {
    setHeaders: (res: Response, path) => {
      const url: URL = new URL(path, `https://${DSP_Y_HOST}`);
      if (url.pathname.endsWith('bidding-logic.js')) {
        return res.set('X-Allow-FLEDGE', 'true');
      }
    },
  }),
);

app.use((req: Request, res: Response, next) => {
  if (req.get('sec-fetch-dest') === 'fencedframe') {
    res.setHeader('Supports-Loading-Mode', 'fenced-frame');
  }
  next();
});

app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('/', async (req: Request, res: Response) => {
  const title = DSP_Y_DETAIL;
  res.render('index', {title, DSP_Y_HOST, SHOP_HOST, EXTERNAL_PORT});
});

app.get(
  '/uc-:useCaseName/join-ad-interest-group.html',
  async (req: Request, res: Response) => {
    const {useCaseName} = req.params;
    const title = 'DSP Y - Join Ad Interest Group';
    res.render(`uc-${useCaseName}/join-ad-interest-group`, {
      title,
      DSP_Y_HOST,
      EXTERNAL_PORT,
    });
  },
);

app.get(
  '/uc-:useCaseName/interest-group.json',
  async (req: Request, res: Response) => {
    const {useCaseName} = req.params;
    const {advertiser, id} = req.query;
    if (
      advertiser === undefined ||
      id === undefined ||
      typeof advertiser !== 'string'
    ) {
      return res.sendStatus(400);
    }

    res.json(buildInterestGroup(useCaseName, advertiser));
  },
);

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});
