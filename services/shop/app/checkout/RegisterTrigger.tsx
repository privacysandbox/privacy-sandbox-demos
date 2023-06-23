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

import { fromSize } from "../../lib/items"

export const RegisterTrigger = ({
  id,
  quantity,
  size,
  category,
  gross,
  ssp
}: {
  id: string
  quantity: number
  size: string
  category: number
  gross: number
  ssp: string
}) => {
  const src = new URL(ssp)
  src.pathname = "/register-trigger"
  src.searchParams.append("id", `${id}`)
  src.searchParams.append("category", `${category}`)
  src.searchParams.append("quantity", `${quantity}`)
  src.searchParams.append("size", `${fromSize(size)}`)
  src.searchParams.append("gross", `${gross}`)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" width={1} height={1} src={src.toString()} />
  )
}
