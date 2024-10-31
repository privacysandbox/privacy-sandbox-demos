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

// SSP-X
import express, {Application, Request, Response} from 'express';
import ucBaRouter from './uc-ba/server/index.js'

const {
  EXTERNAL_PORT,
  PORT,
  SSP_A_HOST,
  SSP_B_HOST,
  SSP_X_HOST,
  SSP_Y_HOST,
  SSP_X_DETAIL,
  DSP_A_HOST,
  DSP_B_HOST,
  DSP_X_HOST,
  DSP_Y_HOST,
  SHOP_HOST,
  NEWS_HOST,
} = process.env;

const ALLOWED_HOSTNAMES = [
  DSP_A_HOST,
  DSP_B_HOST,
  DSP_X_HOST,
  DSP_Y_HOST,
  SSP_A_HOST,
  SSP_B_HOST,
  SSP_X_HOST,
  SSP_Y_HOST,
  NEWS_HOST,
  SHOP_HOST,
];

const app: Application = express();

app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use((req: Request, res: Response, next) => {
  if (req.get('sec-fetch-dest') === 'fencedframe') {
    res.setHeader('Supports-Loading-Mode', 'fenced-frame');
  }
  if (ALLOWED_HOSTNAMES.includes(req.hostname)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  next();
});

app.use('/uc-ba', ucBaRouter);

app.use(express.static('src/public'));

app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('/', async (req: Request, res: Response) => {
  const title = SSP_X_DETAIL;
  res.render('index.html.ejs', {title, EXTERNAL_PORT});
});

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});
