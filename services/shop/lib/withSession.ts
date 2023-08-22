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

import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next"
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiHandler } from "next"
import { Order } from "./items"

const sessionOptions = {
  password: "complex_password_at_least_32_characters_long", // TODO
  cookieName: "__session",
  secure: process.env.NODE_ENV === "production",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production"
  }
}

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions)
}

export function withSessionSsr<P extends { [key: string]: unknown } = { [key: string]: unknown }>(
  handler: (context: GetServerSidePropsContext) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
) {
  return withIronSessionSsr(handler, sessionOptions)
}

declare module "iron-session" {
  interface IronSessionData {
    cart: Order[]
  }
}
