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
// import cbor from "cbor"
// import { decodeDict } from "structured-field-values"
// import {
//   debugKey,
//   sourceEventId,
//   sourceKeyPiece,
//   triggerKeyPiece,
//   ADVERTISER,
//   PUBLISHER,
//   DIMENSION,
//   decodeBucket,
//   SOURCE_TYPE,
//   TRIGGER_TYPE
// } from "./arapi.js"

const {
  EXTERNAL_PORT,
  PORT,
  SSP_A_HOST,
  SSP_A_DETAIL,
  SSP_A_TOKEN,
  DSP_A_HOST,
  DSP_A_HOST_INTERNAL,
  DSP_B_HOST,
  DSP_B_HOST_INTERNAL,
  SHOP_HOST,
  NEWS_HOST,
} = process.env;

const DSP_A = new URL(`https://${DSP_A_HOST}:${EXTERNAL_PORT}`);
const DSP_B = new URL(`https://${DSP_B_HOST}:${EXTERNAL_PORT}`);
const SSP_A = new URL(`https://${SSP_A_HOST}:${EXTERNAL_PORT}`);

const DSP_A_INTERNAL = new URL(`http://${DSP_A_HOST_INTERNAL}:${PORT}`);
const DSP_B_INTERNAL = new URL(`http://${DSP_B_HOST_INTERNAL}:${PORT}`);

// // in-memory storage for debug reports
// const Reports = [];
// // clear in-memory storage every 10 min
// setInterval(() => {
//   Reports.length = 0;
// }, 1000 * 60 * 10);

const app = express();

app.use((req, res, next) => {
  res.setHeader('Origin-Trial', SSP_A_TOKEN);
  next();
});

app.use(express.json());

// app.use((req, res, next) => {
//   // enable transitional debugging reports (https://github.com/WICG/attribution-reporting-api/blob/main/EVENT.md#optional-transitional-debugging-reports)
//   res.cookie("ar_debug", "1", {
//     sameSite: "none",
//     secure: true,
//     httpOnly: true
//   });
//   next();
// });

app.use((req, res, next) => {
  // opt-in fencedframe
  if (req.get('sec-fetch-dest') === 'fencedframe') {
    res.setHeader('Supports-Loading-Mode', 'fenced-frame');
  }
  next();
});

app.use(
  express.static('src/public', {
    setHeaders: (res, path) => {
      const shouldAddAuctionHeader = [
        'decision-logic.js',
        'trusted.json',
        'direct.json',
      ].some((fileName) => path.includes(fileName));

      if (shouldAddAuctionHeader) {
        return res.set('Ad-Auction-Allowed', 'true');
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
  const title = SSP_A_DETAIL;
  res.render('index.html.ejs', {
    title,
    DSP_A_HOST,
    DSP_B_HOST,
    SSP_A_HOST,
    EXTERNAL_PORT,
    SHOP_HOST,
  });
});

// app.get("/register-source", async (req, res) => {
//   const { advertiser, id } = req.query
//   console.log("Registering source attribution for", { advertiser, id })
//   if (req.headers["attribution-reporting-eligible"]) {
//     //const are = req.headers["attribution-reporting-eligible"].split(",").map((e) => e.trim())
//     const are = decodeDict(req.headers["attribution-reporting-eligible"])

//     // register navigation source
//     if ("navigation-source" in are) {
//       const destination = `https://${advertiser}`
//       const source_event_id = sourceEventId()
//       const debug_key = debugKey()
//       const AttributionReportingRegisterSource = {
//         destination,
//         source_event_id,
//         debug_key,
//         aggregation_keys: {
//           quantity: sourceKeyPiece({
//             type: SOURCE_TYPE["click"], // click attribution
//             advertiser: ADVERTISER[advertiser],
//             publisher: PUBLISHER["news"],
//             id: Number(`0x${id}`),
//             dimension: DIMENSION["quantity"]
//           }),
//           gross: sourceKeyPiece({
//             type: SOURCE_TYPE["click"], // click attribution
//             advertiser: ADVERTISER[advertiser],
//             publisher: PUBLISHER["news"],
//             id: Number(`0x${id}`),
//             dimension: DIMENSION["gross"]
//           })
//         }
//       }

//       console.log("Registering navigation source :", { AttributionReportingRegisterSource })
//       res.setHeader("Attribution-Reporting-Register-Source", JSON.stringify(AttributionReportingRegisterSource))
//       res.status(200).send("attribution nevigation (click) source registered")
//     }

//     // register event source
//     else if ("event-source" in are) {
//       const destination = `https://${advertiser}`
//       const source_event_id = sourceEventId()
//       const debug_key = debugKey()
//       const AttributionReportingRegisterSource = {
//         destination,
//         source_event_id,
//         debug_key,
//         aggregation_keys: {
//           quantity: sourceKeyPiece({
//             type: SOURCE_TYPE["view"], // view attribution
//             advertiser: ADVERTISER[advertiser],
//             publisher: PUBLISHER["news"],
//             id: Number(`0x${id}`),
//             dimension: DIMENSION["quantity"]
//           }),
//           gross: sourceKeyPiece({
//             type: SOURCE_TYPE["view"], // view attribution
//             advertiser: ADVERTISER[advertiser],
//             publisher: PUBLISHER["news"],
//             id: Number(`0x${id}`),
//             dimension: DIMENSION["gross"]
//           })
//         }
//       }

//       console.log("Registering event source :", { AttributionReportingRegisterSource })
//       res.setHeader("Attribution-Reporting-Register-Source", JSON.stringify(AttributionReportingRegisterSource))
//       res.status(200).send("attribution event (view) source registered")
//     } else {
//       res.status(400).send("'Attribution-Reporting-Eligible' header is malformed") // just send back response header. no content.
//     }
//   } else {
//     res.status(400).send("'Attribution-Reporting-Eligible' header is missing") // just send back response header. no content.
//   }
// })

// app.get("/register-trigger", async (req, res) => {
//   const { id, quantity, size, category, gross } = req.query

//   const AttributionReportingRegisterTrigger = {
//     aggregatable_trigger_data: [
//       {
//         key_piece: triggerKeyPiece({
//           type: TRIGGER_TYPE["quantity"],
//           id: parseInt(id, 16),
//           size: Number(size),
//           category: Number(category),
//           option: 0
//         }),
//         source_keys: ["quantity"]
//       },
//       {
//         key_piece: triggerKeyPiece({
//           type: TRIGGER_TYPE["gross"],
//           id: parseInt(id, 16),
//           size: Number(size),
//           category: Number(category),
//           option: 0
//         }),
//         source_keys: ["gross"]
//       }
//     ],
//     aggregatable_values: {
//       // TODO: scaling
//       quantity: Number(quantity),
//       gross: Number(gross)
//     },
//     debug_key: debugKey()
//   }
//   res.setHeader("Attribution-Reporting-Register-Trigger", JSON.stringify(AttributionReportingRegisterTrigger))
//   res.sendStatus(200)
// })

app.get('/ad-tag.html', async (req, res) => {
  res.render('ad-tag.html.ejs');
});

app.get('/video-ad-tag.html', async (req, res) => {
  res.render('video-ad-tag.html.ejs');
});

// app.get("/reports", async (req, res) => {
//   res.render("reports.html.ejs", { title: "Report", Reports })
// })

async function getHeaderBiddingAd() {
  const headerBids = await Promise.all(
    [`${DSP_A_INTERNAL}header-bid`, `${DSP_B_INTERNAL}header-bid`].map(
      async (dspUrl) => {
        const response = await fetch(dspUrl);
        const result = await response.json();
        return result;
      },
    ),
  );

  const [highestBid] = headerBids.sort((a, b) => b.bid - a.bid);
  return highestBid;
}

function getComponentAuctionConfig() {
  return {
    seller: SSP_A,
    decisionLogicUrl: `${SSP_A}js/decision-logic.js`,
    trustedScoringSignalsURL: `${SSP_A}/signals/trusted.json`,
    directFromSellerSignals: `${SSP_A}/signals/direct.json`,
    interestGroupBuyers: [DSP_A, DSP_B],
    perBuyerSignals: {
      [DSP_A]: {'some-key': 'some-value'},
      [DSP_B]: {'some-key': 'some-value'},
    },
    deprecatedReplaceInURN: {
      '%%SSP_VAST_URI%%': `${SSP_A}/vast/preroll`,
    },
  };
}

app.get('/header-bid', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', `https://${NEWS_HOST}`);

  res.json({
    seller: SSP_A,
    headerBiddingAd: await getHeaderBiddingAd(),
    componentAuctionConfig: getComponentAuctionConfig(),
  });
});

async function getAdServerAd() {
  const adServerBids = await Promise.all(
    [`${DSP_A_INTERNAL}ad-server-bid`, `${DSP_B_INTERNAL}ad-server-bid`].map(
      async (dspUrl) => {
        const response = await fetch(dspUrl);
        const result = await response.json();
        return result;
      },
    ),
  );

  const [highestBid] = adServerBids.sort((a, b) => b.bid - a.bid);
  return highestBid;
}

app.get('/ad-server-bid', async (req, res) => {
  res.json({
    seller: SSP_A,
    adServerAd: await getAdServerAd(),
  });
});

// app.post("/.well-known/attribution-reporting/debug/report-aggregate-attribution", async (req, res) => {
//   const debug_report = req.body
//   debug_report.shared_info = JSON.parse(debug_report.shared_info)

//   console.log(JSON.stringify(debug_report, " ", " "))

//   debug_report.aggregation_service_payloads = debug_report.aggregation_service_payloads.map((e) => {
//     const plain = Buffer.from(e.debug_cleartext_payload, "base64")
//     const debug_cleartext_payload = cbor.decodeAllSync(plain)
//     e.debug_cleartext_payload = debug_cleartext_payload.map(({ data, operation }) => {
//       return {
//         operation,
//         data: data.map(({ value, bucket }) => {
//           return {
//             value: value.readUInt32BE(0),
//             bucket: decodeBucket(bucket)
//           }
//         })
//       }
//     })
//     return e
//   })

//   console.log(JSON.stringify(debug_report, " ", " "))

//   // save to global storage
//   Reports.push(debug_report)

//   res.sendStatus(200)
// })

// app.post("/.well-known/attribution-reporting/report-aggregate-attribution", async (req, res) => {
//   const report = req.body
//   report.shared_info = JSON.parse(report.shared_info)
//   console.log(JSON.stringify(report, " ", " "))
//   res.sendStatus(200)
// })

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});
