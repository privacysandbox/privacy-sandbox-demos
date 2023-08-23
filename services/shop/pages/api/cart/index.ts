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

import { Order, Item, getItem, addOrder } from "../../../lib/items"
import type { NextApiRequest, NextApiResponse } from "next"
import { withSessionRoute } from "../../../lib/withSession"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cart: Order[] = req.session.cart || []
  const { url, method, body } = req

  if (method === "GET") {
    res.json(cart)
  }

  if (method === "POST") {
    const id = req.body.id as string
    const size = req.body.size as string
    const quantity = parseInt(req.body.quantity)
    const item: Item = (await getItem(id)) as Item
    const order: Order = {
      item,
      size,
      quantity
    }
    req.session.cart = addOrder(order, cart)
    await req.session.save()
    res.redirect(302, "/cart")
  }

  if (method === "DELETE") {
    req.session.destroy()
    res.status(204)
    res.send("")
  }
}

export default withSessionRoute(handler)
