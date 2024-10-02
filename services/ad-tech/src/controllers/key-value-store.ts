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

/** BYOS Implementation of K/V Server */
export const KeyValueStore = (() => {
  const keyValueStore = new Map<string, string>([
    ['isActive','true'],
    ['minBid','1.5'],
    ['maxBid', '2.5'],
    ['multiplier', '1.1'],
  ]);

  // Reset values every 30 mins.
  setInterval(() => {
    keyValueStore.set('isActive', 'true');
    keyValueStore.set('minBid', '1.5');
    keyValueStore.set('maxBid', '2.5');
    keyValueStore.set('multiplier', '1.1');
  }, 1000 * 60 * 30);

  /** Set wrapper with value checking. */
  const set = (key: string, value?: string) => {
    if (value) {
      keyValueStore.set(key, value);
    }
  }

  /** Returns multiple keys queried from Protected Audience. */
  const getMultiple = (keys: string[]): {[index: string]: string} => {
    if (!keys) {
      return {};
    }
    const signals: {[index: string]: string} = {};
    for (const key of keys) {
      if (key && keyValueStore.has(key)) {
        signals[key] = keyValueStore.get(key)!;
      }
    }
    return signals;
  };

  return {
      set,
      getMultiple,
      get: keyValueStore.get,
      keys: keyValueStore.keys,
      entries: keyValueStore.entries,
  };
})();
