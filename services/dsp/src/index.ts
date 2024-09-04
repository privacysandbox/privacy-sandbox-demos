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
  DSP_HOST,
  DSP_TOKEN,
  DSP_DETAIL,
  SSP_HOST,
  SHOP_HOST,
} = process.env;

// In-memory storage for all reports
const Reports: any[] = [];
const EventLevelReports: any[] = [];

// clear in-memory storage every 10 min
setInterval(
  () => {
    Reports.length = 0;
  },
  1000 * 60 * 10,
);

const app: Application = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json()); // To parse the incoming requests with JSON payloads

app.use((req, res, next) => {
  res.setHeader('Origin-Trial', DSP_TOKEN as string);
  next();
});

app.use((req, res, next) => {
  // Enable transitional debugging reports (https://github.com/WICG/attribution-reporting-api/blob/main/EVENT.md#optional-transitional-debugging-reports)
  res.cookie('ar_debug', '1', {
    sameSite: 'none',
    secure: true,
    httpOnly: true,
  });
  next();
});

app.use(
  express.static('src/public', {
    setHeaders: (res: Response, path, stat) => {
      if (path.endsWith('bidding_logic.js')) {
        return res.set('X-Allow-FLEDGE', 'true');
      }
      if (path.endsWith('bidding_signal.json')) {
        return res.set('X-Allow-FLEDGE', 'true');
      }
    },
  }),
);

app.use((req, res, next) => {
  // opt-in fencedframe
  if (req.get('sec-fetch-dest') === 'fencedframe') {
    res.setHeader('Supports-Loading-Mode', 'fenced-frame');
  }
  next();
});

app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('/', async (req: Request, res: Response) => {
  const title = DSP_DETAIL;
  res.render('index', {title, DSP_HOST, SHOP_HOST, EXTERNAL_PORT});
});

app.get('/reports', async (req, res) => {
  res.render('reports', {title: 'Report', Reports});
});

app.get('/ads', async (req, res) => {
  const {advertiser, id} = req.query;
  console.log('Loading frame content : ', {advertiser, id});
  const title = `Your special ads from ${advertiser}`;
  const move = new URL(`https://${advertiser}:${EXTERNAL_PORT}/items/${id}`);
  const creative = new URL(`https://${advertiser}:${EXTERNAL_PORT}/ads/${id}`);
  const registerSource = new URL(
    `https://${DSP_HOST}:${EXTERNAL_PORT}/register-source`,
  );
  registerSource.searchParams.append('advertiser', advertiser as string);
  registerSource.searchParams.append('id', id as string);
  res.render('ads', {title, move, creative, registerSource});
});

app.get('/join-ad-interest-group.html', async (req: Request, res: Response) => {
  const title = 'Join Ad Interest Group';
  res.render('join-ad-interest-group', {
    title,
    DSP_TOKEN,
    DSP_HOST,
    EXTERNAL_PORT,
  });
});

app.get('/interest-group.json', async (req: Request, res: Response) => {
  const {advertiser, id, adType} = req.query;
  if (!advertiser || !id) {
    return res.sendStatus(400);
  }
  const imageCreative = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}/ads`);
  imageCreative.searchParams.append('advertiser', advertiser as string);
  imageCreative.searchParams.append('id', id as string);
  const videoCreative = new URL(
    `https://${DSP_HOST}:${EXTERNAL_PORT}/html/video-ad-creative.html`,
  );
  const renderUrl =
    adType === 'video' ? videoCreative : imageCreative.toString();
  const owner = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}`);
  const biddingLogicUrl = new URL(
    `https://${DSP_HOST}:${EXTERNAL_PORT}/js/bidding_logic.js`,
  );
  const trustedBiddingSignalsUrl = new URL(
    `https://${DSP_HOST}:${EXTERNAL_PORT}/bidding_signal.json`,
  );
  const dailyUpdateUrl = new URL(
    `https://${DSP_HOST}:${EXTERNAL_PORT}/daily_update_url`,
  );
  res.json({
    name: advertiser,
    owner,
    // x-allow-fledge: true
    biddingLogicUrl,
    // x-allow-fledge: true
    trustedBiddingSignalsUrl,
    trustedBiddingSignalsKeys: [
      'trustedBiddingSignalsKeys-1',
      'trustedBiddingSignalsKeys-2',
    ],
    // dailyUpdateUrl, // not implemented yet
    userBiddingSignals: {
      user_bidding_signals: 'user_bidding_signals',
    },
    ads: [
      {
        renderUrl,
        metadata: {
          type: advertiser,
          adType: 'image',
        },
      },
    ],
  });
});

app.get('/bidding_signal.json', async (req: Request, res: Response) => {
  res.setHeader('X-Allow-FLEDGE', 'true');
  res.setHeader('X-fledge-bidding-signals-format-version', '2');
  res.json({
    keys: {
      key1: 'xxxxxxxx',
      key2: 'yyyyyyyy',
    },
    perInterestGroupData: {
      name1: {
        priorityVector: {
          signal1: 100,
          signal2: 200,
        },
      },
    },
  });
});

// TODO: Implement
// app.get("/daily_update_url", async (req: Request, res: Response) => {
// })

const handleEventLevelReport = (req: Request, res: Response, report: any) => {
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
    const redirectUrl = `${req.query['redirect']}/register-source?${query}`;
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

app.get('/reporting', async (req: Request, res: Response) => {
  handleEventLevelReport(
    req,
    res,
    /* report= */ {
      category: 'Event log',
      ts: Date.now().toString(),
      data: req.query,
    },
  );
});

app.post('/reporting', async (req: Request, res: Response) => {
  handleEventLevelReport(
    req,
    res,
    /* report= */ {
      category: 'Event log',
      ts: Date.now().toString(),
      data: {
        ...req.query,
        ...req.body,
      },
    },
  );
});

// ************************************************************************
// [START] Section for Attribution Reporting API Code
// ************************************************************************
const registerNavigationAttributionSourceIfApplicable = (
  req: Request,
  res: Response,
) => {
  if (
    !('attribution-reporting-eligible' in req.headers) ||
    !(
      'navigation-source' in
      decodeDict(req.headers['attribution-reporting-eligible'] as string)
    )
  ) {
    return false;
  }
  const advertiser = req.query.advertiser as string;
  const id = req.query.id as string;
  console.log('[ARA] Registering navigation source attribution for', {
    advertiser,
    id,
  });
  const destination = `https://${advertiser}`;
  const source_event_id = sourceEventId();
  const debug_key = debugKey();
  const AttributionReportingRegisterSource = {
    demo_host: 'dsp', // Included for debugging, not an actual field.
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

const registerEventAttributionSourceIfApplicable = (
  req: Request,
  res: Response,
) => {
  if (
    !('attribution-reporting-eligible' in req.headers) ||
    !(
      'event-source' in
      decodeDict(req.headers['attribution-reporting-eligible'] as string)
    )
  ) {
    return false;
  }
  const advertiser: string = req.query.advertiser as string;
  const id: string = req.query.id as string;
  console.log('[ARA] Registering event source attribution for', {
    advertiser,
    id,
  });
  const destination = `https://${advertiser}`;
  const source_event_id = sourceEventId();
  const debug_key = debugKey();
  const AttributionReportingRegisterSource = {
    demo_host: 'dsp', // Included for debugging, not an actual field.
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

app.get('/register-source', async (req: Request, res: Response) => {
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

function getTriggerData(cvType: string) {
  console.log('conversion type: %s', cvType);
  switch (cvType) {
    case 'see-cart':
      return 5;
    case 'add-to-cart':
      return 6;
    default:
      return 0;
  }
}
app.get('/trigger-attribution', async (req: Request, res: Response) => {
  console.log(`Event trigger attribution - Received Event Level trigger`);
  const cvType: string = req.query['conversion-type'] as string;
  const triggerData = getTriggerData(cvType);
  // TODO: reort's 'trigger_data': 0 or 1 which doesn't match
  const eventTriggerData = [
    {
      trigger_data: `${triggerData}`,
    },
  ];
  const AttributionReportingRegisterTrigger = {
    event_trigger_data: eventTriggerData,
    debug_key: debugKey(),
    debug_reporting: true,
  };

  res.set(
    'Attribution-Reporting-Register-Trigger',
    JSON.stringify(AttributionReportingRegisterTrigger),
  );

  res.sendStatus(200);
});

app.get('/register-trigger', async (req: Request, res: Response) => {
  const id: string = req.query.id as string;
  const quantity: string = req.query.quantity as string;
  const size: string = req.query.size as string;
  const category: string = req.query.category as string;
  const gross: string = req.query.gross as string;
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
      '\x1b[1;31m%s\x1b[0m',
      `🚀 Adtech has received an event-level report from the browser`,
    );
    console.log(
      'REGULAR REPORT RECEIVED (event-level):\n=== \n',
      req.body,
      '\n=== \n',
    );
    const debug_report = req.body;

    EventLevelReports.push(debug_report);

    res.sendStatus(200);
  },
);

app.post(
  '/.well-known/attribution-reporting/debug/report-event-attribution',
  async (req: Request, res: Response) => {
    console.log(
      `Event Attribution Reporting - Received Event Level Report on debug endpoint`,
    );
    const debug_report = req.body;
    console.log(debug_report);

    // save to global storage
    EventLevelReports.push(debug_report);

    res.sendStatus(200);
  },
);

app.post(
  '/.well-known/attribution-reporting/debug/report-aggregate-attribution',
  async (req: Request, res: Response) => {
    console.log(
      '[ARA] Received event-level report on live endpoint: ',
      req.body,
    );
    Reports.push({
      category: 'ARA event-level',
      ts: Date.now().toString(),
      data: req.body,
    });
    res.sendStatus(200);
  },
);

app.post(
  '/.well-known/attribution-reporting/debug/report-event-attribution',
  async (req: Request, res: Response) => {
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
  async (req: Request, res: Response) => {
    const debugReport = req.body;
    debugReport.shared_info = JSON.parse(debugReport.shared_info);
    debugReport.aggregation_service_payloads =
      debugReport.aggregation_service_payloads.map((e: any) => {
        const plain = Buffer.from(e.debug_cleartext_payload, 'base64');
        const debug_cleartext_payload = cbor.decodeAllSync(plain);
        e.debug_cleartext_payload = debug_cleartext_payload.map(
          ({data, operation}) => {
            return {
              operation,
              data: data.map(({value, bucket}: any) => {
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
  async (req: Request, res: Response) => {
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
app.get('/reports', async (req, res) => {
  res.render('reports.html.ejs', {title: 'Report', Reports});
});

app.post('/reset-reports', async (req, res) => {
  EventLevelReports.length = 0;
  res.redirect(303, '/event-level-reports');
});

app.get('/event-level-reports', async (req, res) => {
  res.render('event-level-reports.html.ejs', {
    title: 'Event Level Report',
    EventLevelReports,
  });
});
// ************************************************************************
// [END] Section for Attribution Reporting API Code ***
// ************************************************************************

app.post(
  '/.well-known/private-aggregation/report-shared-storage',
  (req, res) => {
    console.log(
      '[pAgg+SS] Received aggregatable report on live endpoint: ',
      req.body,
    );
    Reports.push({
      category: 'pAgg with SS',
      ts: Date.now().toString(),
      data: req.body,
    });
    res.sendStatus(200);
  },
);

app.post(
  '/.well-known/private-aggregation/debug/report-shared-storage',
  (req, res) => {
    console.log(
      '[pAgg+SS] Received aggregatable report on debug endpoint: ',
      req.body,
    );
    Reports.push({
      category: 'pAgg with SS',
      ts: Date.now().toString(),
      data: req.body,
    });
    res.sendStatus(200);
  },
);

app.get('/private-aggregation', (req, res) => {
  const bucket = req.query.bucket;
  const cloudEnv = req.query.cloudEnv;
  console.log(`${bucket}, ${cloudEnv}`);
  res.render('private-aggregation', {
    bucket: bucket,
    cloudEnv: cloudEnv,
  });
});

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});
