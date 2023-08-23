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

import Image from "next/image"
import { displayCategory, Order } from "../../lib/items"
import { RegisterTrigger } from "./RegisterTrigger"

export const CartItem = ({ order, ssp }: { order: Order; ssp: string }) => {
  const { item, size, quantity } = order
  return (
    <li className="grid grid-cols-12 lg:gap-8 gap-4 border">
      <div className="lg:col-span-4 col-span-6 flex flex-col items-center py-4 gap-4 bg-slate-200">
        <Image src={`/image/svg/emoji_u${item.id}.svg`} width={100} height={100} alt={item.name} priority={true}></Image>
        <h2 className="font-bold text-xl text-center text-slate-700 pb-4">{item.name}</h2>
      </div>
      <div className="lg:col-span-8 col-span-6 flex flex-col justify-center gap-2 text-lg text-slate-700 relative">
        <dl className="flex flex-col">
          <div className="flex gap-2">
            <dt className="w-16 font-bold">price:</dt>
            <dd>${item.price}.00</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 font-bold">cat:</dt>
            <dd>{displayCategory(item.category)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 font-bold">size:</dt>
            <dd>{size}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 font-bold">qty:</dt>
            <dd>{quantity}</dd>
          </div>
        </dl>
        <RegisterTrigger id={item.id} quantity={quantity} size={size} category={item.category} gross={item.price} ssp={ssp} />
      </div>
    </li>
  )
}
