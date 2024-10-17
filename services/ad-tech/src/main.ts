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

import express, {Application} from 'express';
import cors from 'cors';
import {HOSTNAME, PORT} from './lib/constants.js';
import {AdsRouter} from './routes/common/ads-router.js';
import {AttributionReportingRouter} from './routes/common/attribution-reporting-router.js';
import {CommonRouter} from './routes/common/common-router.js';
import {ReportRouter} from './routes/common/report-router.js';
import {TopicsRouter} from './routes/common/topics-router.js';
import {BiddingSignalsRouter} from './routes/dsp/bidding-signals-router.js';
import {BuyerContextualBidderRouter} from './routes/dsp/buyer-contextual-bidder.js';
import {BuyerRouter as BuyerMiscRouter} from './routes/dsp/buyer-router.js';
import {ScoringSignalsRouter} from './routes/ssp/scoring-signals-router.js';
import {SellerContextualBidder} from './routes/ssp/seller-contextual-bidder.js';
import {SellerRouter} from './routes/ssp/seller-router.js';
import {WellKnownAttributionReportingRouter} from './routes/well-known/attribution-reporting-router.js';
import {WellKnownPrivateAggregationRouter} from './routes/well-known/private-aggregation-router.js';

const app: Application = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());
app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.use('/', CommonRouter);

app.use('/.well-known/private-aggregation', WellKnownPrivateAggregationRouter);
app.use(
  '/.well-known/attribution-reporting',
  WellKnownAttributionReportingRouter,
);

app.use('/ads', AdsRouter);
app.use('/reporting', ReportRouter);
app.use('/attribution', AttributionReportingRouter);
app.use('/topics', TopicsRouter);

app.use('/dsp', BuyerMiscRouter);
app.use('/dsp/contextual-bid', BuyerContextualBidderRouter);
app.use('/dsp/realtime-signals', BiddingSignalsRouter);

app.use('/ssp', SellerRouter);
app.use('/ssp/contextual-bid', SellerContextualBidder);
app.use('/ssp/realtime-signals', ScoringSignalsRouter);

app.listen(PORT, function () {
  console.log(HOSTNAME, ' listening on port ', PORT);
});
