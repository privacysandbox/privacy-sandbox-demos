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

"use client"

import Link from "next/link"
import { Order } from "../../lib/items"
import CartItem from "./CartItem"
import useSWR from "swr"

const fetcher = (url: URL) => fetch(url).then((res) => res.json())

const useCart = (fallbackData: Order[]) => {
  const { data, mutate } = useSWR<Order[], Error>("/api/cart", fetcher, {
    fallbackData
  })
  return {
    cart: data || [],
    mutate
  }
}

export default function Cart({ cart: initialState }: { cart: Order[] }) {
  const { cart, mutate } = useCart(initialState)

  const subtotal = cart.reduce((sum, { item, quantity }) => {
    return sum + item.price * quantity
  }, 0)
  const shipping = 40
  const disableCheckout = cart.length === 0
  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-col gap-6" method="post" action="/checkout">
        <ul className="flex flex-col gap-6">
          {cart.map((order) => {
            const key = `${order.item.id}:${order.size}`
            return <CartItem key={key} order={order} mutate={mutate} />
          })}
        </ul>

        <dl className="flex flex-col">
          <div className="flex justify-end gap-2">
            <dt className="font-bold">Subtotal:</dt>
            <dd>${subtotal}.00</dd>
          </div>
          <div className="flex justify-end gap-2">
            <dt className="font-bold">Shipping:</dt>
            <dd>${shipping}.00</dd>
          </div>
          <div className="flex justify-end gap-2">
            <dt className="font-bold">Total:</dt>
            <dd>${subtotal + shipping}.00</dd>
          </div>
        </dl>

        <section className="flex justify-center">
          <button
            type="submit"
            disabled={disableCheckout}
            className="w-60 border border-slate-600 text-slate-600 enabled:hover:bg-slate-400 enabled:hover:text-white disabled:opacity-40"
          >
            CHECKOUT
          </button>
        </section>
      </form>

      <footer className="border-t-2 py-4">
        <Link href="/" className="underline before:content-['<<']">
          continue shopping
        </Link>
      </footer>
    </div>
  )
}
