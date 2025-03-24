/*
 Copyright 2025 Google LLC

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
app.use(express.static('src/public'));
app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('/', async (req: Request, res: Response) => {
  res.render('index');
});

app.get('/button', async (req: Request, res: Response) => {
  res.set({'supports-loading-mode': 'fenced-frame'});
  res.render('button');
});

app.get('/popup', async (req: Request, res: Response) => {
  res.render('popup');
});

app.listen(PORT, function () {
  console.log(`Service provider listening on port ${PORT}`);
});
