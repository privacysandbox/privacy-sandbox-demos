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

import ejs from 'ejs';
import express, {NextFunction, Application, Request, Response} from 'express';
import session from 'express-session';
import MemoryStoreFactory from 'memorystore';

import {
  AD_TECHS_TO_TAG_FOR_CONVERSIONS,
  DSP_HOST,
  DSP_A_HOST,
  DSP_B_HOST,
  DSP_X_HOST,
  DSP_Y_HOST,
  EXTERNAL_PORT,
  PORT,
  SHOP_DETAIL,
  SHOP_HOST,
  SSP_HOST,
  SSP_A_HOST,
  SSP_B_HOST,
  SERVICE_PROVIDER_HOST,
} from './lib/constants.js';
import {
  addOrder,
  constructOrder,
  displayCategory,
  getCartSubtotal,
  getCartTotal,
  getItem,
  getItems,
  Order,
  removeOrder,
  SHIPPING_FEE,
  updateOrder,
} from './lib/items.js';

const app: Application = express();

declare module 'express-session' {
  interface SessionData {
    cart: Order[];
  }
}

app.set('trust proxy', 1); // required for Set-Cookie with Secure

// Due to express >= 4 changes, we need to pass express-session to the
// function memorystore exports in order to extend session.Store:
const MemoryStore = MemoryStoreFactory(session);

const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    name: '__session', // https://firebase.google.com/docs/hosting/manage-cache#using_cookies
    secret: 'THIS IS SECRET FOR DEMO', // replace with your secret at build time.
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      sameSite: 'strict', // we don't plan to use this cookie in a third aprty context
      maxAge: oneDay,
    },
    store: new MemoryStore({
      checkPeriod: oneDay,
    }),
  }),
);

app.use((req, res, next) => {
  // res.setHeader("Origin-Trial", NEWS_TOKEN as string)
  res.setHeader('Cache-Control', 'private');
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

/** Custom handler to use EJS renderer for JavaScript files. */
app.get('/js/*.js', async (req: Request, res: Response) => {
  const filePath = `src/public${req.path}`;
  res.set('Content-Type', 'application/javascript');
  ejs.renderFile(
    filePath,
    {SERVICE_PROVIDER_HOST, SHOP_HOST, EXTERNAL_PORT},
    (err: any, content: any) => {
      if (err) {
        console.log('Encountered error rendering static JS', {
          filePath,
          err,
        });
        res.status(500).send();
        return;
      }
      if (content) {
        res.send(content);
      } else {
        res.status(404).send();
      }
    },
  );
});

app.use(express.urlencoded({extended: true}));
app.use(express.static('src/public'));
app.set('view engine', 'ejs');
app.set('views', 'src/views');

/** Assembles an attribution trigger URL with conversion context. */
const constructConversionTriggerUrl = (host: string, order: Order): string => {
  const triggerUrl = new URL(`https://${host}:${EXTERNAL_PORT}`);
  triggerUrl.pathname = '/attribution/register-trigger';
  const {item, size, quantity} = order;
  triggerUrl.searchParams.append('conversionType', 'purchase');
  triggerUrl.searchParams.append('itemId', item.id);
  triggerUrl.searchParams.append('category', `${item.category}`);
  triggerUrl.searchParams.append('quantity', `${quantity}`);
  triggerUrl.searchParams.append('price', `${item.price}`);
  triggerUrl.searchParams.append('size', size);
  triggerUrl.searchParams.append('gross', `${item.price * quantity}`);
  return triggerUrl.toString();
};

// TODO(sidsahoo): Discuss use-case design for Attribution Reporting.
const getEventTriggerUrl = (itemId: string, conversionType: string) => {
  const item = getItem(itemId);
  const eventTriggerUrl = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}`);
  eventTriggerUrl.pathname = '/attribution/register-event-level-trigger';
  eventTriggerUrl.searchParams.append('conversionType', conversionType);
  eventTriggerUrl.searchParams.append('itemId', item.id);
  eventTriggerUrl.searchParams.append('category', `${item.category}`);
  eventTriggerUrl.searchParams.append('price', `${item.price}`);
  return eventTriggerUrl.toString();
};

// view helper
app.locals = {
  title: SHOP_DETAIL,
  displayCategory,
  DSP_TAG_URL: new URL(
    `https://${DSP_HOST}:${EXTERNAL_PORT}/js/dsp/dsp-tag.js`,
  ),
  DSP_A_TAG_URL: new URL(
    `https://${DSP_A_HOST}:${EXTERNAL_PORT}/js/dsp/dsp-tag.js`,
  ),
  DSP_B_TAG_URL: new URL(
    `https://${DSP_B_HOST}:${EXTERNAL_PORT}/js/dsp/dsp-tag.js`,
  ),
  DSP_X_TAG_URL: new URL(
    `https://${DSP_X_HOST}:${EXTERNAL_PORT}/js/dsp/dsp-tag.js`,
  ),
  DSP_Y_TAG_URL: new URL(
    `https://${DSP_Y_HOST}:${EXTERNAL_PORT}/js/dsp/dsp-tag.js`,
  ),
  MTA_CONVERSION_TAG_URL: new URL(
    `https://${DSP_HOST}:${EXTERNAL_PORT}/js/dsp/usecase/multi-touch-attribution/mta-conversion-tag.js`,
  ).toString(),
  getCartTotal,
  getConversionTriggerUrls: (order: Order) =>
    AD_TECHS_TO_TAG_FOR_CONVERSIONS.map((host) =>
      constructConversionTriggerUrl(host, order),
    ),
  getEventTriggerUrl,
};

/** Serves the main index page with all products listed. */
app.get('/', async (req: Request, res: Response) => {
  res.render('index', {
    items: getItems(),
  });
});

/** Serves the image creative from shop site (redirected from ad-tech). */
app.get('/ads/:id?', async (req: Request, res: Response) => {
  const id = req.params.id ? req.params.id : '1f6d2';
  const imgPath = `/image/svg/emoji_u${id}.svg`;
  console.log(`redirecting to /image/svg/emoji_u${id}.svg`);
  res.redirect(301, imgPath);
});

/** Serves the item detail page. */
app.get('/items/:id', async (req: Request, res: Response) => {
  const {usecase} = req.query;
  const {id} = req.params;
  res.render('item', {
    item: getItem(id),
    SHOP_HOST,
    usecase,
  });
});

/** Serves the cart page after user adds an item to cart. */
app.post('/cart', async (req: Request, res: Response, next: NextFunction) => {
  const {id, size, quantity} = req.body;
  const order = constructOrder(id, size, quantity);
  const cart = addOrder(order, req.session.cart!);
  req.session.cart = cart;
  // Save the session before redirection to ensure page load does not happen
  // before session is saved.
  req.session.save(function (err: Error) {
    if (err) return next(err);
    res.redirect(303, '/cart');
  });
});

/** Renders the cart page. */
app.get('/cart', async (req: Request, res: Response) => {
  const cart = req.session.cart!;
  res.render('cart', {
    cart,
    shipping: SHIPPING_FEE,
    subtotal: getCartSubtotal(cart),
    total: getCartTotal(cart),
  });
});

/** Updates the cart in the session without a page reload. */
app.put('/cart/:name', async (req: Request, res: Response) => {
  const {name} = req.params;
  const {quantity} = req.body;
  const [id, size] = name.split(':');
  const order = constructOrder(id, size, quantity);
  const cart = updateOrder(order, req.session.cart as Order[]);
  req.session.cart = cart;
  res.status(204).end();
});

/** Deletes an item from the cart in the session without a page reload. */
app.delete('/cart/:name', async (req: Request, res: Response) => {
  const {name} = req.params;
  const [id, size] = name.split(':');
  const order = constructOrder(id, size, /* quantity= */ 0);
  const cart = removeOrder(order, req.session.cart!);
  req.session.cart = cart;
  res.status(204).end();
});

/** Redirects checkout form submit from the cart page. */
app.post('/checkout', async (req: Request, res: Response) => {
  res.redirect(303, '/checkout');
});

/** Renders the checkout page. */
app.get('/checkout', async (req: Request, res: Response) => {
  const cart = req.session.cart!;
  req.session.destroy(() => Promise.resolve());
  res.render('checkout', {
    cart,
    shipping: SHIPPING_FEE,
    subtotal: getCartSubtotal(cart),
    total: getCartTotal(cart),
  });
});

app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);
});
