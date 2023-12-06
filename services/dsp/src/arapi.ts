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

// type: 2bit
const SOURCE_TYPE: {click: number; view: number} = {
  click: 0b10,
  view: 0b11,
};

// advertiser: 16bit
const ADVERTISER: {[index: string]: number} = {};
ADVERTISER[process.env.SHOP_HOST as string] = 0b0;
ADVERTISER[process.env.TRAVEL_HOST as string] = 0b1;

// publisher:  16bit
const PUBLISHER: {[index: string]: number} = {};
PUBLISHER[process.env.NEWS_HOST as string] = 0b0;

// dimension: 8bit
const DIMENSION: {quantity: number; gross: number} = {
  quantity: 0b0,
  gross: 0b1,
};

// type 8bit
const TRIGGER_TYPE = {
  quantity: 0b1000_0000,
  gross: 0b1100_0000,
};

export {SOURCE_TYPE, ADVERTISER, PUBLISHER, DIMENSION, TRIGGER_TYPE};

type AggregationKeyStructure = {
  type: number;
  advertiser: number;
  publisher: number;
  id: number;
  dimension: number;
};

export function sourceKeyPiece(ako: AggregationKeyStructure) {
  console.log(ako);
  const source = encodeSource(ako);
  const uint64: bigint = new DataView(source).getBigUint64(0, false);
  return `0x${(uint64 << 64n).toString(16)}`;
}

type AggregatableTriggerData = {
  type: number;
  id: number;
  size: number;
  category: number;
  option: number;
};

export function triggerKeyPiece(atd: AggregatableTriggerData) {
  console.log(atd);
  const trigger = encodeTrigger(atd);
  const uint64 = new DataView(trigger).getBigUint64(0, false);
  return `0x${'0'.repeat(16)}${uint64.toString(16)}`;
}

// type:        2bit
// dimension:   6bit
// id:         24bit
// advertiser: 16bit
// publisher:  16bit
// -----------------
//             64bit
function encodeSource(ako: AggregationKeyStructure) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  const first32 = (((ako.type << 6) + ako.dimension) << 24) + ako.id;
  view.setUint32(0, first32);
  view.setUint16(4, ako.advertiser);
  view.setUint16(6, ako.publisher);
  return buffer;
}

function decodeSource(buffer: ArrayBuffer): AggregationKeyStructure {
  const view = new DataView(buffer);
  const first32 = view.getUint32(0);
  const id = first32 & (2 ** 24 - 1);
  const first8 = first32 >>> 24;
  const dimension = first8 & 0b111111;
  const type = first8 >>> 6;
  const advertiser = view.getUint16(4);
  const publisher = view.getUint16(6);
  return {type, dimension, id, advertiser, publisher};
}

// type:      8bit
// id:       24bit
// size:      8bit
// category:  8bit
// option:   16bit
// -----------------
//             64bit
function encodeTrigger(atd: AggregatableTriggerData) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, (atd.type << 24) + atd.id);
  view.setUint8(4, atd.size);
  view.setUint8(5, atd.category);
  view.setUint16(6, atd.option);
  return buffer;
}

function decodeTrigger(buffer: ArrayBuffer): AggregatableTriggerData {
  const view = new DataView(buffer);
  const first32 = view.getUint32(0);
  const type = first32 >>> 24;
  const id = first32 & 0xffffff;
  const size = view.getUint8(4);
  const category = view.getUint8(5);
  const option = view.getUint16(6);
  return {type, id, size, category, option};
}

export function decodeBucket(buffer: ArrayBuffer) {
  const u8a = new Uint8Array(buffer);
  const sourceBuf = u8a.slice(0, u8a.length / 2);
  const source: AggregationKeyStructure = decodeSource(sourceBuf.buffer);
  const triggerBuf = u8a.slice(u8a.length / 2, u8a.length);
  const trigger: AggregatableTriggerData = decodeTrigger(triggerBuf.buffer);

  const aggregation_keys: {[index: string]: string} = {};
  aggregation_keys.type = key_from_value(SOURCE_TYPE, source.type);
  aggregation_keys.dimension = key_from_value(DIMENSION, source.dimension);
  aggregation_keys.id = source.id.toString(16);
  aggregation_keys.advertiser = key_from_value(ADVERTISER, source.advertiser);
  aggregation_keys.publisher = key_from_value(PUBLISHER, source.publisher);

  const aggregatable_trigger_data: {[index: string]: string} = {};
  aggregatable_trigger_data.type = key_from_value(TRIGGER_TYPE, trigger.type);
  aggregatable_trigger_data.id = trigger.id.toString(16);
  aggregatable_trigger_data.size = trigger.size.toString();
  aggregatable_trigger_data.category = trigger.category.toString();
  aggregatable_trigger_data.option = trigger.option.toString();

  return {
    aggregation_keys,
    aggregatable_trigger_data,
  };
}

export function sourceEventId() {
  // 64bit dummy value
  return ((1n << 64n) - 1n).toString();
}

export function debugKey(): string {
  // 64bit dummy value
  return ((1n << 64n) - 2n).toString();
}

function key_from_value(object: any, value: any) {
  const key: string = Object.keys(object).find(
    (key) => object[key] === value,
  ) as string;

  return key;
}

function test() {
  const advertiser = ADVERTISER['shop'];
  const publisher = PUBLISHER['news'];
  const id = 0xff;
  const dimension = DIMENSION['gross'];
  const size = (26.5 - 20) * 10;
  const category = 1;
  const source_type = SOURCE_TYPE.click;
  const trigger_type = TRIGGER_TYPE.gross;
  const option = 2;

  const source_key = sourceKeyPiece({
    type: source_type,
    dimension,
    id,
    advertiser,
    publisher,
  });
  console.log({source_key});

  const trigger_key = triggerKeyPiece({
    type: trigger_type,
    id,
    size,
    category,
    option,
  });
  console.log({trigger_key});

  const source = encodeSource({
    type: source_type,
    dimension,
    id,
    advertiser,
    publisher,
  });
  console.log(decodeSource(source));

  const trigger = encodeTrigger({
    type: trigger_type,
    id,
    size,
    category,
    option,
  });
  console.log(decodeTrigger(trigger));
}

test();
