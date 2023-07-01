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

import { cookies } from "next/headers"
import { Item, Order } from "./items"

// TODO
const HOST = "localhost"
const PORT = "8080"
const endpoint = `http://${HOST}:${PORT}/api`

export async function fetchCart() {
  const url = new URL(`${endpoint}/cart`)
  const headers: HeadersInit = {}
  const cartCookie = cookies().get("cart")
  if (cartCookie !== undefined) {
    headers["cookie"] = `cart=${cartCookie.value}`
  }
  const res = await fetch(url, {
    cache: "no-store",
    headers
  })
  const cart: Order[] = await res.json()
  return cart
}

export async function fetchItems(): Promise<Item[]> {
  const url = new URL(`${endpoint}/items`)
  const res = await fetch(url, { cache: "no-store" })
  const items: Item[] = await res.json()
  return items
}

export async function fetchItem(id: string): Promise<Item> {
  const url = new URL(`${endpoint}/items/${id}`)
  const res = await fetch(url, { cache: "no-store" })
  const item: Item = await res.json()
  return item
}
