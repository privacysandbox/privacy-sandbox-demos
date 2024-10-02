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

const {EXTERNAL_PORT, PORT} = process.env;
const {TRAVEL_HOST, TRAVEL_DETAIL, NEWS_HOST} = process.env;
const {DSP_HOST, DSP_A_HOST, DSP_B_HOST} = process.env;

const app: Application = express();
app.use(express.static('src/public'));
app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('/', async (req: Request, res: Response) => {
  // Check for tags to activate.
  const tags = [];
  if (req.query.tag) {
    if (Array.isArray(req.query.tag)) {
      // Multiple tags were specified as: tag=dsp&tag=dsp-a.
      tags.push(...req.query.tag)
    } else {
      // Just a single tag was specified.
      tags.push(req.query.tag);
    }
  }
  // Set URL to blank if query doesn't include DSP name.
  const DSP_A_TAG_URL = tags.includes('dsp-a') ? new URL(
    `https://${DSP_A_HOST}:${EXTERNAL_PORT}/dsp-tag.js`,
  ) : '';
  const DSP_B_TAG_URL = tags.includes('dsp-b') ? new URL(
    `https://${DSP_B_HOST}:${EXTERNAL_PORT}/dsp-tag.js`,
  ) : '';
  // Set to blank only when some tags are specified but not this one.
  // When no tags are specified, fallback to only activating this tag.
  const DSP_TAG_URL = tags.length == 0 || tags.includes('dsp') ? new URL(
    `https://${DSP_HOST}:${EXTERNAL_PORT}/dsp-tag.js`,
  ) : '';
  const params = {
    title: TRAVEL_DETAIL,
    DSP_TAG_URL,
    DSP_A_TAG_URL,
    DSP_B_TAG_URL,
    EXTERNAL_PORT,
    NEWS_HOST,
    TRAVEL_HOST,
  };
  res.render('index', params);
});

// Serves a static ad creative for all requests from ad-tech.
app.get('/ads', async (req: Request, res: Response) => {
  const imgPath = '/img/emoji_u1f3de.svg';
  console.log('Travel ad redirecting to: ', imgPath);
  res.redirect(302, imgPath);
});

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});
