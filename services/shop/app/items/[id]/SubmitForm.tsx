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

import { redirect } from "next/navigation"
import { getCartFromSession, saveCartToSession } from "../../../lib/cart"
import { fetchItem } from "../../../lib/fetcher"
import { Item, Order, addOrderToCart } from "../../../lib/items"

export default function SubmitForm({ item }: { item: Item }) {
  async function formAction(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    const size = formData.get("size") as string
    const quantity = parseInt(formData.get("quantity") as string)
    const item: Item = await fetchItem(id)
    const order: Order = { item, size, quantity }

    const cart: Order[] = getCartFromSession()
    saveCartToSession(addOrderToCart(order, cart))

    return redirect(`/cart`)
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <section className="flex border-b py-4">
        <input type="hidden" name="id" value={item.id} />
        <label htmlFor="size" className="basis-1/6 text-slate-500">
          Size
        </label>
        <select id="size" name="size" className="basis-5/6 text-slate-800" defaultValue="25.0">
          <option value="22.0">22.0cm</option>
          <option value="22.5">22.5cm</option>
          <option value="23.0">23.0cm</option>
          <option value="23.5">23.5cm</option>
          <option value="24.0">24.0cm</option>
          <option value="24.5">24.5cm</option>
          <option value="25.0">25.0cm</option>
          <option value="25.5">25.5cm</option>
          <option value="26.0">26.0cm</option>
          <option value="26.5">26.5cm</option>
          <option value="27.0">27.0cm</option>
          <option value="27.5">27.5cm</option>
          <option value="28.0">28.0cm</option>
          <option value="28.5">28.5cm</option>
        </select>
      </section>
      <section className="flex border-b py-4">
        <label htmlFor="quantity" className="basis-1/6 text-slate-500">
          Quantity
        </label>
        <select id="quantity" name="quantity" className="basis-5/6 text-slate-800">
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </section>
      <section>
        <h3 className="font-bold">Description</h3>
        <p className="pt-1 text-sm text-slate-800">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <p className="pt-1 text-sm text-slate-800">
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <p className="pt-1 text-sm text-slate-800">
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </p>
        <p className="pt-1 text-sm text-slate-800">
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </section>
      <section className="flex justify-center">
        <button type="submit" className="w-60 border border-slate-600 text-slate-600 hover:bg-slate-400 hover:text-white">
          ADD TO CART
        </button>
      </section>
    </form>
  )
}
