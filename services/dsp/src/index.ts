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

const { EXTERNAL_PORT, PORT, DSP_HOST, DSP_TOKEN, DSP_DETAIL, SSP_HOST, SHOP_HOST } = process.env

const app: Application = express()

app.use((req, res, next) => {
  res.setHeader("Origin-Trial", DSP_TOKEN as string)
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
app.set("view engine", "ejs")
app.set("views", "src/views")

app.get("/join-ad-interest-group.html", async (req: Request, res: Response) => {
  const title = "Join Ad Interest Group"
  res.render("join-ad-interest-group", { title, DSP_TOKEN, DSP_HOST, EXTERNAL_PORT })
})

app.get("/interest-group.json", async (req: Request, res: Response) => {
  const { advertiser, id } = req.query
  if (advertiser === undefined || id === undefined) {
    return res.sendStatus(400)
  }

  const ssp = new URL(`https://${SSP_HOST}:${EXTERNAL_PORT}/ads`)
  ssp.searchParams.append("advertiser", advertiser as string)
  ssp.searchParams.append("id", id as string)
  const renderUrl = ssp.toString()

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

app.get("/", async (req: Request, res: Response) => {
  const title = DSP_DETAIL
  res.render("index", { title, DSP_HOST, SHOP_HOST, EXTERNAL_PORT })
})

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`)
})
