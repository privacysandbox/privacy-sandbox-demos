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

type Props = {
  title?: string
}

export default function Head({ title = "Shopping DEMO" }: Props) {
  const { SHOP_TOKEN } = process.env
  return (
    <>
      <meta charSet="utf-8"></meta>
      <title>{title}</title>
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👟</text></svg>"
      ></link>
      {/* <meta httpEquiv="origin-trial" content={SHOP_TOKEN}></meta> */}
    </>
  )
}
