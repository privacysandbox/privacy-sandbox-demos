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

import { EXTERNAL_PORT, SSP_HOST } from "../../lib/env"
import { fetchCart } from "../../lib/fetcher"
import { Order } from "../../lib/items"
import { Checkout } from "./Checkout"

export default async function Page() {
  const cart: Order[] = await fetchCart()
  const ssp = `https://${SSP_HOST}:${EXTERNAL_PORT}`
  console.log({ ssp })
  return <Checkout checkout={cart} ssp={ssp}></Checkout>
}
