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

import Link from "next/link"
import Image from "next/image"
import { Item } from "../lib/items"
import { fetchItems } from "../lib/fetcher"

const ItemCard = ({ item }: { item: Item }) => {
  return (
    <li key={item.id} className="border shadow rounded flex flex-col text-center justify-between">
      <Link href={`/items/${item.id}`} className="flex flex-col items-center pt-8 pb-4 px-4 gap-6 bg-gray-100 hover:bg-gray-200">
        <Image src={`/image/svg/emoji_u${item.id}.svg`} width={100} height={100} alt={item.name}></Image>
        <div>
          <div className="font-bold text-xl text-slate-800">{item.name}</div>
          <div className="font-mono text-slate-600">${item.price}</div>
        </div>
      </Link>
    </li>
  )
}

export default async function Page() {
  const items = await fetchItems()
  return (
    <div className="flex flex-col gap-6">
      <div className="hidden lg:block">
        <Image
          src={`/image/shop.webp`}
          width={1280}
          height={300}
          alt="shopping site hero image"
          className="object-cover object-[0%_5%] h-[300px]"
        ></Image>
      </div>

      <main className="">
        <ul className="grid lg:grid-cols-4 grid-cols-2 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </ul>
      </main>

      <footer className="border-t-2 py-4">
        <p className="underline text-slate-400 text-right">
          Photo by <a href="https://unsplash.com/@bruno_kelzer?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Bruno Kelzer</a> on{" "}
          <a href="https://unsplash.com/s/photos/shopping-cart?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
        </p>
      </footer>
    </div>
  )
}
