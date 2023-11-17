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

const {PORT} = process.env;

const app: Application = express();

app.use((req, res, next) => {
  res.setHeader('Observe-Browsing-Topics', '?1');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use(express.static('src/public'));
app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('/', async (req: Request, res: Response) => {
  const browsingTopics = req.get('Sec-Browsing-Topics');
  res.json({topics: browsingTopics});
});

app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);
});
