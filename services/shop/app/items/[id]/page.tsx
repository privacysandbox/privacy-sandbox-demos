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
import { displayCategory, Item } from "../../../lib/items"

import Script from "next/script"
import SubmitForm from "./SubmitForm"
import { fetchItem } from "../../../lib/fetcher"

type Params = {
  id: string
}

export default async function Page({ params }: { params: Params }) {
  const { id } = params
  const item: Item = await fetchItem(id)
  const { SHOP_HOST, DSP_HOST, EXTERNAL_PORT } = process.env
  return (
    <div className="flex flex-col gap-6">
      <main className="grid lg:grid-cols-2">
        <section className="">
          <Image src={`/image/svg/emoji_u${item.id}.svg`} width={500} height={500} alt={item.name} priority={true}></Image>
        </section>
        <section className="">
          <h2 className="text-2xl font-bold text-slate-800">{item.name}</h2>
          <div className="flex gap-4 text-slate-500 border-b py-4">
            <span>${item.price}.00</span>
            <span>/</span>
            <span>{displayCategory(item.category)}</span>
          </div>
          <SubmitForm item={item}></SubmitForm>
        </section>
      </main>

      <footer className="border-t-2 py-4">
        <Link href="/" className="underline before:content-['<<']">
          continue shopping
        </Link>
        <Script
          className="dsp_tag"
          data-advertiser={SHOP_HOST}
          data-id={item.id}
          src={new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}/dsp-tag.js`).toString()}
        ></Script>
      </footer>
    </div>
  )
}
