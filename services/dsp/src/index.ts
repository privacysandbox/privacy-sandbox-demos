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
import express, { Application, Request, Response } from "express"
import cbor from "cbor"
import { decodeDict } from "structured-field-values"
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
  TRIGGER_TYPE
} from "./arapi.js"

const { EXTERNAL_PORT, PORT, DSP_HOST, DSP_TOKEN, DSP_DETAIL, SSP_HOST, SHOP_HOST } = process.env

// in-memory storage for debug reports
const Reports: any[] = []

// clear in-memory storage every 10 min
setInterval(() => {
  Reports.length = 0
}, 1000 * 60 * 10)

const app: Application = express()

app.use((req, res, next) => {
  res.setHeader("Origin-Trial", DSP_TOKEN as string)
  next()
})

app.use(express.urlencoded({ extended: true }))

app.use(express.json()) // To parse the incoming requests with JSON payloads

app.use((req, res, next) => {
  // enable transitional debugging reports (https://github.com/WICG/attribution-reporting-api/blob/main/EVENT.md#optional-transitional-debugging-reports)
  res.cookie("ar_debug", "1", {
    sameSite: "none",
    secure: true,
    httpOnly: true
  })
  next()
})

app.use(
  express.static("src/public", {
    setHeaders: (res: Response, path, stat) => {
      const url = new URL(path, `https://${DSP_HOST}`)
      if (url.pathname.endsWith("bidding_logic.js")) {
        return res.set("X-Allow-FLEDGE", "true")
      }
      if (url.pathname.endsWith("bidding_signal.json")) {
        return res.set("X-Allow-FLEDGE", "true")
      }
    }
  })
)

app.use((req, res, next) => {
  // opt-in fencedframe
  if (req.get("sec-fetch-dest") === "fencedframe") {
    res.setHeader("Supports-Loading-Mode", "fenced-frame")
  }
  next()
})

app.set("view engine", "ejs")
app.set("views", "src/views")

app.get("/ads", async (req, res) => {
  const { advertiser, id } = req.query
  console.log("Loading frame content : ", { advertiser, id })

  const title = `Your special ads from ${advertiser}`

  const move = new URL(`https://${advertiser}:${EXTERNAL_PORT}/items/${id}`)

  const creative = new URL(`https://${advertiser}:${EXTERNAL_PORT}/ads/${id}`)

  const registerSource = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}/register-source`)
  registerSource.searchParams.append("advertiser", advertiser as string)
  registerSource.searchParams.append("id", id as string)

  res.render("ads.html.ejs", { title, move, creative, registerSource })
})

app.get("/join-ad-interest-group.html", async (req: Request, res: Response) => {
  const title = "Join Ad Interest Group"
  res.render("join-ad-interest-group", { title, DSP_TOKEN, DSP_HOST, EXTERNAL_PORT })
})

app.get("/interest-group.json", async (req: Request, res: Response) => {
  const { advertiser, id, adType } = req.query
  if (advertiser === undefined || id === undefined) {
    return res.sendStatus(400)
  }

  const imageCreative = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}/ads`)
  imageCreative.searchParams.append("advertiser", advertiser as string)
  imageCreative.searchParams.append("id", id as string)
  const videoCreative = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}/html/video-ad-creative.html`)
  const renderUrl = adType === "video" ? videoCreative : imageCreative.toString()

  const owner = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}`)
  const biddingLogicUrl = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}/js/bidding_logic.js`)
  const trustedBiddingSignalsUrl = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}/bidding_signal.json`)
  const dailyUpdateUrl = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}/daily_update_url`)

  res.json({
    name: advertiser,
    owner,

    // x-allow-fledge: true
    biddingLogicUrl,

    // x-allow-fledge: true
    trustedBiddingSignalsUrl,
    trustedBiddingSignalsKeys: ["trustedBiddingSignalsKeys-1", "trustedBiddingSignalsKeys-2"],

    // dailyUpdateUrl, // not implemented yet
    userBiddingSignals: {
      user_bidding_signals: "user_bidding_signals"
    },
    ads: [
      {
        renderUrl,
        metadata: {
          type: advertiser
        }
      }
    ]
  })
})

app.get("/bidding_signal.json", async (req: Request, res: Response) => {
  res.setHeader("X-Allow-FLEDGE", "true")
  res.setHeader("X-fledge-bidding-signals-format-version", "2")
  res.json({
    keys: {
      key1: "xxxxxxxx",
      key2: "yyyyyyyy"
    },
    perInterestGroupData: {
      name1: {
        priorityVector: {
          signal1: 100,
          signal2: 200
        }
      }
    }
  })
})

// TODO: Implement
// app.get("/daily_update_url", async (req: Request, res: Response) => {
// })

// ************************************************************************
// [START] Section for Attribution Reporting API Code ***
// ************************************************************************
app.get("/register-source", async (req: Request, res: Response) => {
  const advertiser: string = req.query.advertiser as string
  const id: string = req.query.id as string

  console.log("Registering source attribution for", { advertiser, id })
  if (req.headers["attribution-reporting-eligible"]) {
    //const are = req.headers["attribution-reporting-eligible"].split(",").map((e) => e.trim())
    const are = decodeDict(req.headers["attribution-reporting-eligible"] as string)

    // register navigation source
    if ("navigation-source" in are) {
      const destination = `https://${advertiser}`
      const source_event_id = sourceEventId()
      const debug_key = debugKey()
      const AttributionReportingRegisterSource = {
        destination,
        source_event_id,
        debug_key,
        aggregation_keys: {
          quantity: sourceKeyPiece({
            type: SOURCE_TYPE["click"], // click attribution
            advertiser: ADVERTISER[advertiser],
            publisher: PUBLISHER["news"],
            id: Number(`0x${id}`),
            dimension: DIMENSION["quantity"]
          }),
          gross: sourceKeyPiece({
            type: SOURCE_TYPE["click"], // click attribution
            advertiser: ADVERTISER[advertiser],
            publisher: PUBLISHER["news"],
            id: Number(`0x${id}`),
            dimension: DIMENSION["gross"]
          })
        }
      }

      console.log("Registering navigation source :", { AttributionReportingRegisterSource })
      res.setHeader("Attribution-Reporting-Register-Source", JSON.stringify(AttributionReportingRegisterSource))
      res.status(200).send("attribution nevigation (click) source registered")
    }

    // register event source
    else if ("event-source" in are) {
      const destination = `https://${advertiser}`
      const source_event_id = sourceEventId()
      const debug_key = debugKey()
      const AttributionReportingRegisterSource = {
        destination,
        source_event_id,
        debug_key,
        aggregation_keys: {
          quantity: sourceKeyPiece({
            type: SOURCE_TYPE["view"], // view attribution
            advertiser: ADVERTISER[advertiser],
            publisher: PUBLISHER["news"],
            id: Number(`0x${id}`),
            dimension: DIMENSION["quantity"]
          }),
          gross: sourceKeyPiece({
            type: SOURCE_TYPE["view"], // view attribution
            advertiser: ADVERTISER[advertiser],
            publisher: PUBLISHER["news"],
            id: Number(`0x${id}`),
            dimension: DIMENSION["gross"]
          })
        }
      }

      console.log("Registering event source :", { AttributionReportingRegisterSource })
      res.setHeader("Attribution-Reporting-Register-Source", JSON.stringify(AttributionReportingRegisterSource))
      res.status(200).send("attribution event (view) source registered")
    } else {
      res.status(400).send("'Attribution-Reporting-Eligible' header is malformed") // just send back response header. no content.
    }
  } else {
    res.status(400).send("'Attribution-Reporting-Eligible' header is missing") // just send back response header. no content.
  }
})

app.get("/register-trigger", async (req: Request, res: Response) => {
  const id: string = req.query.id as string
  const quantity: string = req.query.quantity as string
  const size: string = req.query.size as string
  const category: string = req.query.category as string
  const gross: string = req.query.gross as string

  const AttributionReportingRegisterTrigger = {
    aggregatable_trigger_data: [
      {
        key_piece: triggerKeyPiece({
          type: TRIGGER_TYPE["quantity"],
          id: parseInt(id, 16),
          size: Number(size),
          category: Number(category),
          option: 0
        }),
        source_keys: ["quantity"]
      },
      {
        key_piece: triggerKeyPiece({
          type: TRIGGER_TYPE["gross"],
          id: parseInt(id, 16),
          size: Number(size),
          category: Number(category),
          option: 0
        }),
        source_keys: ["gross"]
      }
    ],
    aggregatable_values: {
      // TODO: scaling
      quantity: Number(quantity),
      gross: Number(gross)
    },
    debug_key: debugKey()
  }
  res.setHeader("Attribution-Reporting-Register-Trigger", JSON.stringify(AttributionReportingRegisterTrigger))
  res.sendStatus(200)
})

app.post("/.well-known/attribution-reporting/debug/report-aggregate-attribution", async (req: Request, res: Response) => {
  console.log(`Attribution Reporting - Received Aggregatable Report on debug endpoint`)
  const debug_report = req.body
  debug_report.shared_info = JSON.parse(debug_report.shared_info)

  console.log(JSON.stringify(debug_report, null, "\t"))

  debug_report.aggregation_service_payloads = debug_report.aggregation_service_payloads.map((e: any) => {
    const plain = Buffer.from(e.debug_cleartext_payload, "base64")
    const debug_cleartext_payload = cbor.decodeAllSync(plain)
    e.debug_cleartext_payload = debug_cleartext_payload.map(({ data, operation }) => {
      return {
        operation,
        data: data.map(({ value, bucket }: any) => {
          return {
            value: value.readUInt32BE(0),
            bucket: decodeBucket(bucket)
          }
        })
      }
    })
    return e
  })

  console.log(JSON.stringify(debug_report, null, "\t"))

  // save to global storage
  Reports.push(debug_report)

  res.sendStatus(200)
})

app.post("/.well-known/attribution-reporting/report-aggregate-attribution", async (req: Request, res: Response) => {
  console.log(`Attribution Reporting - Received Aggregatable Report on live endpoint`)
  const report = req.body
  report.shared_info = JSON.parse(report.shared_info)
  console.log(JSON.stringify(report, null, "\t"))
  res.sendStatus(200)
})

app.get("/reports", async (req, res) => {
  res.render("reports.html.ejs", { title: "Report", Reports })
})

// ************************************************************************
// [END] Section for Attribution Reporting API Code ***
// ************************************************************************

app.post("/.well-known/private-aggregation/report-shared-storage", (req, res) => {
  console.log(`Private Aggregation for Shared Storage - Received Aggregatable Report on live endpoint`)

  let aggregationReport = req.body
  console.log(req.body)

  res.sendStatus(200)
})

app.get("/private-aggregation", (req, res) => {
  res.render("private-aggregation")
})

app.post("/.well-known/private-aggregation/debug/report-shared-storage", (req, res) => {
  let timeStr = new Date().toISOString()
  console.log(`Private Aggregation for Shared Storage - Received Aggregatable Report on debug endpoint`)

  let aggregationReport = req.body

  console.log(aggregationReport)

  res.sendStatus(200)
})

app.get("/", async (req: Request, res: Response) => {
  const title = DSP_DETAIL
  res.render("index", { title, DSP_HOST, SHOP_HOST, EXTERNAL_PORT })
})

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`)
})
