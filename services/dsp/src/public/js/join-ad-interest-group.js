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

// Protected Audience API
async function getInterestGroupFromServer() {
  const currentUrl = new URL(location.href)
  const advertiser = currentUrl.searchParams.get("advertiser")
  const id = currentUrl.searchParams.get("id")
  const interestGroupUrl = new URL(location.origin)
  interestGroupUrl.pathname = "/interest-group.json"
  interestGroupUrl.searchParams.append("id", id)
  interestGroupUrl.searchParams.append("advertiser", advertiser)
  const allSearchParams = location.search.substring(1).split('&')
    .forEach(searchParam => {
      const keyValuePair = searchParam.split('=')
      if (keyValuePair.length == 2) {
        interestGroupUrl.searchParams.append(keyValuePair[0], keyValuePair[1])
      }
    })
  const res = await fetch(interestGroupUrl)
  return res.json()
}

document.addEventListener("DOMContentLoaded", async (e) => {
  if (navigator.joinAdInterestGroup === undefined) {
    return console.log("Protected Audience API is not supported")
  }

  // Protected Audience API
  const url = new URL(location.href)
  let interestGroup
  if (url.searchParams.get("ad-type") === "video") {
    interestGroup = {
      name: url.searchParams.get("advertiser"),
      owner: url.origin,
  
      // x-allow-fledge: true
      biddingLogicUrl: `${url.origin}/js/bidding_logic.js`,
  
      // x-allow-fledge: true
      trustedBiddingSignalsUrl: `${url.origin}/bidding_signal.json`,
      trustedBiddingSignalsKeys: ["trustedBiddingSignalsKeys-1", "trustedBiddingSignalsKeys-2"],
  
      // dailyUpdateUrl, // not implemented yet
      userBiddingSignals: {
        user_bidding_signals: "user_bidding_signals"
      },
      ads: [
        {
          renderUrl: "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=",
          metadata: {
            type: url.searchParams.get("advertiser")
          }
        }
      ]
    }
  } else {
    interestGroup = await getInterestGroupFromServer()
  }
  console.log({ interestGroup })

  const kSecsPerDay = 3600 * 24 * 30
  console.log(await navigator.joinAdInterestGroup(interestGroup, kSecsPerDay))

  // TODO: consider using Topics API for choosing Ads
  // const topics = await document.browsingTopics?.()
  // console.log({ topics })
})
