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
"use strict"
const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)
EventTarget.prototype.on = EventTarget.prototype.addEventListener

document.on("DOMContentLoaded", async (e) => {
  $$(".remove-item").forEach(($button) => {
    $button.on("click", async (e) => {
      e.preventDefault()
      const { name } = e.target.dataset
      const url = new URL(`/cart/${name}`, location.href)
      const res = await fetch(url, { method: "delete" })
      console.log(res.ok)
      location.reload()
    })
  })

  $$(".update-qty").forEach(($select) => {
    $select.on("change", async (e) => {
      const quantity = e.target.value
      const name = e.target.name
      const params = new URLSearchParams({ quantity })
      const url = new URL(`/cart/${name}`, location.href)
      const res = await fetch(url, {
        method: "put",
        body: params
      })
      console.log(res.ok)
    })
  })
})
