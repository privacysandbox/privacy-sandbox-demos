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

import "server-only"
import Script from "next/script"
import { DSP_HOST, EXTERNAL_PORT, SHOP_HOST } from "../../../lib/env"

export default async function DSPTag({ id }: { id: string }) {
  const dsp_url = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}/dsp-tag.js`).toString()
  return <Script className="dsp_tag" data-advertiser={SHOP_HOST} data-id={id} src={dsp_url}></Script>
}
