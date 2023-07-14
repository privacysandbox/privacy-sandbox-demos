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

const items: Item[] = [
  /*👞*/ { id: "1f45e", price: 180, category: 1, name: "Man's Shoe" },
  /*👟*/ { id: "1f45f", price: 100, category: 0, name: "Running Shoe" },
  /*👠*/ { id: "1f460", price: 200, category: 1, name: "High-Heeled Shoe" },
  /*👡*/ { id: "1f461", price: 120, category: 0, name: "Woman's Sandal" },
  /*👢*/ { id: "1f462", price: 400, category: 1, name: "Woman's Boot" },
  /*🛼*/ { id: "1f6fc", price: 230, category: 2, name: "Roller Skate" },
  /*🥾*/ { id: "1f97e", price: 210, category: 2, name: "Hiking Boot" },
  /*🥿*/ { id: "1f97f", price: 140, category: 0, name: "Flat Shoe" },
  /*🩰*/ { id: "1fa70", price: 900, category: 2, name: "Ballet Shoes" },
  /*🩴*/ { id: "1fa74", price: 12, category: 0, name: "Thong Sandal" },
  /*🎿*/ { id: "1f3bf", price: 1120, category: 2, name: "Ski Boots" },
  /*⛸*/ { id: "26f8", price: 1200, category: 2, name: "Ice Skate" }
]

export const CATEGORIES = ["sale", "luxury", "sports"]

export type Cart = Order[]

export type Order = {
  item: Item
  size: string
  quantity: number
}

export type Item = {
  id: string
  price: number
  category: number
  name: string
}

export async function getItems(): Promise<Item[]> {
  return items
}

export async function getItem(id: string): Promise<Item> {
  return items.find((item) => {
    return item.id === id
  }) as Item
}

export function displayCategory(id: number): string {
  return CATEGORIES.at(id) || "N/A"
}

export function toSize(num: number): string {
  return `${num / 10 + 20}`
}

export function fromSize(size: string): number {
  return (Number(size) - 20) * 10
}

export const addOrderToCart = (order: Order, cart: Cart): Cart => {
  const index = cart.findIndex(({ item, size }) => {
    return order.item.id === item.id && order.size === size
  })
  if (index > -1) {
    // increase quantity
    const current = cart.at(index) as Order
    const next = { ...order, quantity: order.quantity + current.quantity }
    return [next, ...cart.slice(0, index), ...cart.slice(index + 1)]
  }
  // append
  return [order, ...cart]
}

export const removeOrderFromCart = (order: Order, cart: Cart): Cart => {
  return cart.reduce((acc: Cart, o: Order) => {
    if (o.item.id === order.item.id && o.size === order.size) return acc
    return [...acc, o]
  }, [])
}

export const updateOrderInCart = (order: Order, cart: Cart): Cart => {
  return cart.reduce((acc: Cart, o: Order) => {
    if (order.item.id === o.item.id && order.size === o.size) {
      return [...acc, order]
    }
    return [...acc, o]
  }, [])
}
