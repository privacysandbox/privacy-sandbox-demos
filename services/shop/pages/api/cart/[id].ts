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

import type { NextApiRequest, NextApiResponse } from "next"
import { withSessionRoute } from "../../../lib/withSession"
import { getItem, Order, removeOrder, updateOrder } from "../../../lib/items"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cart: Order[] = req.session.cart || []
  const { url, method, body } = req
  console.log(url, method, body, cart)

  if (method === "POST") {
    const { size, quantity } = body
    const id = req.query.id as string
    const item = await getItem(id)
    const order: Order = {
      item,
      size,
      quantity
    }
    req.session.cart = updateOrder(order, cart)
    await req.session.save()
    res.status(204)
    res.send("")
  }

  if (method === "DELETE") {
    const { id, size } = req.query
    const item = await getItem(id as string)
    const order: Order = {
      item,
      size: size as string,
      quantity: 0
    }
    req.session.cart = removeOrder(order, cart)
    await req.session.save()
    res.status(204)
    res.send("")
  }
}

export default withSessionRoute(handler)
