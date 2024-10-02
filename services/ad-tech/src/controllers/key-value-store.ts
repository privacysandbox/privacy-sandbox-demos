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

/** BYOS Implementation of K/V Server. */
export class KeyValueStore {
  private readonly keyValueStore = new Map<string, string>();
  private readonly defaultData;

  /**
   * @param defaultValues The default values to insert into the store.
   * @param resetIntervalInMins Interval to reset the store to default values.
   */
  constructor(defaultValues: string[][], resetIntervalInMins: number = 30) {
    console.log('Initializing in-memory key value store.');
    this.defaultData = defaultValues;
    this.rewriteDefaults();
    setInterval(this.rewriteDefaults, 1000 * 60 * resetIntervalInMins);
  }

  /** Rewrites the default data in the store. */
  rewriteDefaults = () => {
    console.log('Resetting real-time signals.');
    for (const pair of this.defaultData) {
      this.keyValueStore.set(pair[0], pair[1]);
    }
  };

  /** Set wrapper with value checking. */
  set = (key: string, value?: string) => {
    if (value) {
      console.log('Adding new real-time signal.', {key, value});
      this.keyValueStore.set(key, value);
    }
  };

  /** Returns multiple keys queried from Protected Audience. */
  getMultiple = (keys: string[]): {[index: string]: string} => {
    if (!keys) {
      return {};
    }
    const signals: {[index: string]: string} = {};
    for (const key of keys) {
      if (key && this.keyValueStore.has(key)) {
        const value = this.keyValueStore.get(key);
        if (value) {
          signals[key] = value;
        }
      }
    }
    return signals;
  };
}
