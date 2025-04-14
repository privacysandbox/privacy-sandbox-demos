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

const items: Item[] = [
  {id: '1f45e', icon: '👞', price: 180, category: 1, name: "Man's Shoe"},
  {id: '1f45f', icon: '👟', price: 100, category: 0, name: 'Running Shoe'},
  {id: '1f460', icon: '👠', price: 200, category: 1, name: 'High-Heeled Shoe'},
  {id: '1f461', icon: '👡', price: 120, category: 0, name: "Woman's Sandal"},
  {id: '1f462', icon: '👢', price: 400, category: 1, name: "Woman's Boot"},
  {id: '1f6fc', icon: '🛼', price: 230, category: 2, name: 'Roller Skate'},
  {id: '1f97e', icon: '🥾', price: 210, category: 2, name: 'Hiking Boot'},
  {id: '1f97f', icon: '🥿', price: 140, category: 0, name: 'Flat Shoe'},
  {id: '1fa70', icon: '🩰', price: 900, category: 2, name: 'Ballet Shoes'},
  {id: '1fa74', icon: '🩴', price: 12, category: 0, name: 'Thong Sandal'},
  {id: '1f3bf', icon: '🎿', price: 1120, category: 2, name: 'Ski Boots'},
  {id: '26f8', icon: '⛸', price: 1200, category: 2, name: 'Ice Skate'},
];

export const CATEGORIES = ['sale', 'luxury', 'sports'];
export const SHIPPING_FEE = 40;

export type Order = {
  item: Item;
  size: string;
  quantity: number;
};

export type Item = {
  id: string;
  icon: string;
  price: number;
  category: number;
  name: string;
};

export const getItems = (): Item[] => {
  return items;
};

export const getItem = (id: string): Item => {
  return items.find((item) => {
    return item.id === id;
  }) as Item;
};

export const displayCategory = (id: number): string => {
  return CATEGORIES.at(id) || 'N/A';
};

export const addOrder = (order: Order, state: Order[]) => {
  const index = state.findIndex(({item, size}) => {
    return order.item.id === item.id && order.size === size;
  });
  if (index > -1) {
    // increase quantity
    const current = state.at(index) as Order;
    const next = {...order, quantity: order.quantity + current.quantity};
    return [next, ...state.slice(0, index), ...state.slice(index + 1)];
  }
  // append
  return [order, ...state];
};

export const removeOrder = (order: Order, state: Order[]) => {
  return state.reduce((acc: Order[], o: Order) => {
    if (o.item.id === order.item.id && o.size === order.size) return acc;
    return [...acc, o];
  }, []);
};

export const updateOrder = (order: Order, state: Order[]) => {
  return state.reduce((acc: Order[], o: Order) => {
    if (order.item.id === o.item.id && order.size === o.size) {
      return [...acc, order];
    }
    return [...acc, o];
  }, []);
};

export const getCartSubtotal = (cart: Order[]) => {
  return cart.reduce((sum, {item, quantity}) => {
    return sum + item.price * quantity;
  }, 0);
};

export const getCartTotal = (cart: Order[]) => {
  return getCartSubtotal(cart) + SHIPPING_FEE;
};

export const constructOrder = (
  itemId: string,
  size: string,
  quantity: number,
): Order => {
  return {
    item: getItem(itemId),
    size,
    quantity,
  };
};
