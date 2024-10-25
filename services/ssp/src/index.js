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

// SSP
import express from 'express';
import url from 'url';
import cbor from 'cbor';
import {decodeDict} from 'structured-field-values';
import {
  debugKey,
  sourceEventId,
  sourceKeyPiece,
  triggerKeyPiece,
  ADVERTISER,
  PUBLISHER,
  DIMENSION,
  decodeBucket,
  SOURCE_TYPE,
  TRIGGER_TYPE,
} from './arapi.js';

const {
  EXTERNAL_PORT,
  PORT,
  SSP_HOST,
  SSP_DETAIL,
  SSP_TOKEN,
  DSP_HOST,
  SHOP_HOST,
} = process.env;

// In-memory storage for debug reports
const Reports = [];
// Clear in-memory storage every 10 min
setInterval(
  () => {
    Reports.length = 0;
  },
  1000 * 60 * 10,
);

const app = express();

app.use((req, res, next) => {
  res.setHeader('Origin-Trial', SSP_TOKEN);
  if (
    'origin' in req.headers &&
    req.headers['origin'].startsWith('https://privacy-sandbox-demos-')
  ) {
    res.setHeader('Access-Control-Allow-Origin', req.headers['origin']);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  // Enable transitional debug reports for ARA.
  res.cookie('ar_debug', '1', {
    sameSite: 'none',
    secure: true,
    httpOnly: true,
  });
  next();
});

app.use((req, res, next) => {
  // Opt-in fencedframe
  if (req.get('sec-fetch-dest') === 'fencedframe') {
    res.setHeader('Supports-Loading-Mode', 'fenced-frame');
  }
  next();
});

app.use(
  express.static('src/public', {
    setHeaders: (res, path, stat) => {
      if (path.endsWith('/decision-logic.js')) {
        return res.set('X-Allow-FLEDGE', 'true');
      }
      if (path.endsWith('/run-ad-auction.js')) {
        res.set('Supports-Loading-Mode', 'fenced-frame');
        res.set('Permissions-Policy', 'run-ad-auction=(*)');
      }
    },
  }),
);
app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('/', async (req, res) => {
  const title = SSP_DETAIL;
  res.render('index', {
    title,
    DSP_HOST,
    SSP_HOST,
    EXTERNAL_PORT,
    SHOP_HOST,
  });
});

app.get('/ad-tag.html', async (req, res) => {
  res.render('ad-tag');
});

app.get('/video-ad-tag.html', async (req, res) => {
  res.render('video-ad-tag');
});

app.get('/reports', async (req, res) => {
  res.render('reports', {title: 'Report', Reports});
});

app.get('/auction-config.json', async (req, res) => {
  const dspOrigin = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}`).toString();
  const sspOrigin = new URL(`https://${SSP_HOST}:${EXTERNAL_PORT}`).toString();
  const auctionConfig = {
    'seller': sspOrigin,
    // x-allow-fledge: true
    'decisionLogicURL': `${sspOrigin}js/decision-logic.js`,
    'interestGroupBuyers': [dspOrigin],
    'auctionSignals': {
      'auction_signals': 'auction_signals',
    },
    'sellerSignals': {
      'seller_signals': 'seller_signals',
    },
    'perBuyerSignals': {
      [dspOrigin]: {
        'per_buyer_signals': 'per_buyer_signals',
      },
    },
    // Needed for size macro replacements.
    'requestedSize': {'width': '300px', 'height': '250px'},
    // If set to true, runAdAuction returns a FencedFrameConfig.
    'resolveToConfig': true,
  };
  console.log({auctionConfig});
  res.json(auctionConfig);
});

app.get('/reporting', async (req, res) => {
  handleEventLevelReport(
    req,
    res,
    /* report= */ {
      'category': 'Event log',
      'ts': Date.now().toString(),
      'data': req.query,
    },
  );
});

app.post('/reporting', async (req, res) => {
  handleEventLevelReport(
    req,
    res,
    /* report= */ {
      'category': 'Event log',
      'ts': Date.now().toString(),
      'data': {
        ...req.query,
        ...req.body,
      },
    },
  );
});

// ************************************************************************
// Attribution Reporting HTTP handlers
// ************************************************************************
app.get('/attribution/register-source', async (req, res) => {
  if (!req.headers['attribution-reporting-eligible']) {
    res.status(400).send('"Attribution-Reporting-Eligible" header is missing');
    return;
  }
  if (registerNavigationAttributionSourceIfApplicable(req, res)) {
    res.status(200).send('Attribution nevigation (click) source registered');
  } else if (registerEventAttributionSourceIfApplicable(req, res)) {
    res.status(200).send('Attribution event (view) source registered');
  } else {
    res
      .status(400)
      .send('"Attribution-Reporting-Eligible" header is malformed');
  }
});

app.get('/attribution/register-trigger', async (req, res) => {
  const {id, quantity, size, category, gross} = req.query;
  const AttributionReportingRegisterTrigger = {
    event_trigger_data: [
      {
        trigger_data: '1',
        priority: '100',
        // deduplication_key: '1234',
      },
    ],
    aggregatable_trigger_data: [
      {
        key_piece: triggerKeyPiece({
          type: TRIGGER_TYPE['quantity'],
          id: parseInt(id, 16),
          size: Number(size),
          category: Number(category),
          option: 0,
        }),
        source_keys: ['quantity'],
      },
      {
        key_piece: triggerKeyPiece({
          type: TRIGGER_TYPE['gross'],
          id: parseInt(id, 16),
          size: Number(size),
          category: Number(category),
          option: 0,
        }),
        source_keys: ['gross'],
      },
    ],
    aggregatable_values: {
      // TODO: scaling
      quantity: Number(quantity),
      gross: Number(gross),
    },
    debug_key: debugKey(),
  };
  res.setHeader(
    'Attribution-Reporting-Register-Trigger',
    JSON.stringify(AttributionReportingRegisterTrigger),
  );
  res.sendStatus(200);
});

app.post(
  '/.well-known/attribution-reporting/report-event-attribution',
  async (req, res) => {
    console.log(
      '[ARA] Received event-level report on live endpoint: ',
      req.body,
    );
    Reports.push({
      category: 'ARA event-level',
      ts: Date.now().toString(),
      data: event_report,
    });
    res.sendStatus(200);
  },
);

app.post(
  '/.well-known/attribution-reporting/debug/report-event-attribution',
  async (req, res) => {
    console.log(
      '[ARA] Received event-level report on debug endpoint: ',
      req.body,
    );
    Reports.push({
      category: 'ARA event-level debug',
      ts: Date.now().toString(),
      data: req.body,
    });
    res.sendStatus(200);
  },
);

app.post(
  '/.well-known/attribution-reporting/debug/report-aggregate-attribution',
  async (req, res) => {
    console.log(
      '[ARA] Received aggregatable report on debug endpoint: ',
      req.body,
    );
    const debugReport = req.body;
    debugReport.shared_info = JSON.parse(debugReport.shared_info);
    debugReport.aggregation_service_payloads =
      debugReport.aggregation_service_payloads.map((e) => {
        const plain = Buffer.from(e.debug_cleartext_payload, 'base64');
        const debug_cleartext_payload = cbor.decodeAllSync(plain);
        e.debug_cleartext_payload = debug_cleartext_payload.map(
          ({data, operation}) => {
            return {
              operation,
              data: data.map(({value, bucket}) => {
                return {
                  value: value.readUInt32BE(0),
                  bucket: decodeBucket(bucket),
                };
              }),
            };
          },
        );
        return e;
      });
    console.log(
      '[ARA] Received aggregatable report on debug endpoint: ',
      JSON.stringify(debugReport),
    );
    // Save to global storage
    Reports.push({
      category: 'ARA aggregate debug',
      ts: Date.now().toString(),
      data: debugReport,
    });
    res.sendStatus(200);
  },
);

app.post(
  '/.well-known/attribution-reporting/report-aggregate-attribution',
  async (req, res) => {
    const report = req.body;
    report.shared_info = JSON.parse(report.shared_info);
    console.log(
      '[ARA] Received aggregatable report on live endpoint: ',
      JSON.stringify(report),
    );
    Reports.push({
      category: 'ARA aggregate',
      ts: Date.now().toString(),
      data: report,
    });
    res.sendStatus(200);
  },
);

// ************************************************************************
// Attribution Reporting helper functions
// ************************************************************************
const registerNavigationAttributionSourceIfApplicable = (req, res) => {
  if (
    !('attribution-reporting-eligible' in req.headers) ||
    !(
      'navigation-source' in
      decodeDict(req.headers['attribution-reporting-eligible'])
    )
  ) {
    return false;
  }
  const advertiser = req.query.advertiser;
  const id = req.query.id;
  console.log('[ARA] Registering navigation source attribution for', {
    advertiser,
    id,
  });
  const destination = `https://${advertiser}`;
  const source_event_id = sourceEventId();
  const debug_key = debugKey();
  const AttributionReportingRegisterSource = {
    demo_host: 'ssp', // Included for debugging, not an actual field.
    destination,
    source_event_id,
    debug_key,
    debug_reporting: true, // Enable verbose debug reports.
    aggregation_keys: {
      quantity: sourceKeyPiece({
        type: SOURCE_TYPE['click'], // click attribution
        advertiser: ADVERTISER[advertiser],
        publisher: PUBLISHER['news'],
        id: Number(`0x${id}`),
        dimension: DIMENSION['quantity'],
      }),
      gross: sourceKeyPiece({
        type: SOURCE_TYPE['click'], // click attribution
        advertiser: ADVERTISER[advertiser],
        publisher: PUBLISHER['news'],
        id: Number(`0x${id}`),
        dimension: DIMENSION['gross'],
      }),
    },
  };
  console.log('[ARA] Registering navigation source :', {
    AttributionReportingRegisterSource,
  });
  res.setHeader(
    'Attribution-Reporting-Register-Source',
    JSON.stringify(AttributionReportingRegisterSource),
  );
  return true;
};

const registerEventAttributionSourceIfApplicable = (req, res) => {
  if (
    !('attribution-reporting-eligible' in req.headers) ||
    !(
      'event-source' in
      decodeDict(req.headers['attribution-reporting-eligible'])
    )
  ) {
    return false;
  }
  const advertiser = req.query.advertiser;
  const id = req.query.id;
  console.log('[ARA] Registering event source attribution for', {
    advertiser,
    id,
  });
  const destination = `https://${advertiser}`;
  const source_event_id = sourceEventId();
  const debug_key = debugKey();
  const AttributionReportingRegisterSource = {
    demo_host: 'ssp', // Included for debugging, not an actual field.
    destination,
    source_event_id,
    debug_key,
    debug_reporting: true, // Enable verbose debug reports.
    aggregation_keys: {
      quantity: sourceKeyPiece({
        type: SOURCE_TYPE['view'], // view attribution
        advertiser: ADVERTISER[advertiser],
        publisher: PUBLISHER['news'],
        id: Number(`0x${id}`),
        dimension: DIMENSION['quantity'],
      }),
      gross: sourceKeyPiece({
        type: SOURCE_TYPE['view'], // view attribution
        advertiser: ADVERTISER[advertiser],
        publisher: PUBLISHER['news'],
        id: Number(`0x${id}`),
        dimension: DIMENSION['gross'],
      }),
    },
  };
  console.log('[ARA] Registering event source :', {
    AttributionReportingRegisterSource,
  });
  res.setHeader(
    'Attribution-Reporting-Register-Source',
    JSON.stringify(AttributionReportingRegisterSource),
  );
  return true;
};

// ************************************************************************
// Miscellaneous helper functions
// ************************************************************************
const handleEventLevelReport = (req, res, report) => {
  console.log('Event-level report received: ', req.originalUrl, report);
  Reports.push(report);
  // Check if request is eligible for ARA.
  if (!('attribution-reporting-eligible' in req.headers)) {
    res
      .status(200)
      .send(`Event-level report received: ${JSON.stringify(req.query)}`);
    return;
  }
  // Try registering attribution sources.
  if (registerNavigationAttributionSourceIfApplicable(req, res)) {
    console.log('[ARA] Navigation source registered');
  } else if (registerEventAttributionSourceIfApplicable(req, res)) {
    console.log('[ARA] Event source registered');
  }
  // Check if redirect is needed.
  if ('redirect' in req.query) {
    const query = Object.entries(req.query)
      .filter(([key, _]) => key !== 'redirect')
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const redirectUrl = `${req.query['redirect']}/attribution/register-source?${query}`;
    res.redirect(redirectUrl);
  } else {
    res
      .status(200)
      .send(
        `Event-level report received and attribution source registered: ${JSON.stringify(
          req.query,
        )}`,
      );
  }
};

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});
