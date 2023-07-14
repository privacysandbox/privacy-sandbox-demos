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

import { NextRequest, NextResponse } from "next/server"
import { getCartFromSession, saveCartToSession } from "../../../../lib/cart"
import { Item, Order, getItem, removeOrderFromCart, updateOrderInCart } from "../../../../lib/items"

type Params = {
  id: string
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const id = params.id as string
  const formData = await req.formData()
  const size = formData.get("size") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const item: Item = (await getItem(id)) as Item
  const order: Order = {
    item,
    size,
    quantity
  }
  const cart: Order[] = getCartFromSession()
  saveCartToSession(updateOrderInCart(order, cart))
  return NextResponse.json(cart)
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const id = params.id as string
  const size = req.nextUrl.searchParams.get("size")
  const item: Item = (await getItem(id)) as Item
  const order: Order = {
    item,
    size: size as string,
    quantity: 0
  }
  const cart: Order[] = getCartFromSession()
  saveCartToSession(removeOrderFromCart(order, cart))
  return new NextResponse(null, {
    status: 204
  })
}
