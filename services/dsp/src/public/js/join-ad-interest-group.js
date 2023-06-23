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
async function getInterestGroup(advertiser, id) {
  const url = new URL(location.origin)
  url.pathname = "/interest-group.json"
  url.searchParams.append("id", id)
  url.searchParams.append("advertiser", advertiser)
  const res = await fetch(url)
  return res.json()
}

document.addEventListener("DOMContentLoaded", async (e) => {
  // Protected Audience API
  const url = new URL(location.href)
  const advertiser = url.searchParams.get("advertiser")
  const id = url.searchParams.get("id")

  const interestGroup = await getInterestGroup(advertiser, id)
  console.log({ interestGroup })

  const kSecsPerDay = 3600 * 24 * 30
  console.log(await navigator.joinAdInterestGroup(interestGroup, kSecsPerDay))

  // Call Topics API for opt-in
  const topics = await document.browsingTopics?.()
  console.log({ topics })
})
