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

/**
 * Where is this script used:
 *   This script is loaded on all pages.
 *
 * What does this script do:
 *   This script initializes PSDemo module as an empty namepsace.
 */
(() => {
  window.PSDemo = window.PSDemo || {};

  /** Returns URL query param value as an array. */
  window.PSDemo.getQueryAsArray = (key) => {
    const searchParams = new URL(location.href).searchParams;
    if (searchParams.has(key)) {
      const value = searchParams.get(key);
      if (value) {
        return value.split(',');
      } else {
        return [];
      }
    }
  };

  /** Returns URL query param value as text. */
  window.PSDemo.getQueryAsString = (key) => {
    const searchParams = new URL(location.href).searchParams;
    if (searchParams.has(key)) {
      return searchParams.get(key);
    }
  };
})();
