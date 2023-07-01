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

import { NextResponse } from "next/server"
import { getItem } from "../../../../lib/items"

type Params = {
  id: string
}

export async function GET(_: Request, { params }: { params: Params }) {
  const id = params.id
  const item = await getItem(id)
  return NextResponse.json(item)
}
