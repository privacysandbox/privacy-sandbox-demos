# Shopping Site in Privacy Sandbox Demos

## Intro

This app is shopping site demo one of "advertiser" party in Privacy Sandbox Demos world.

## How to Run

You can run this app standalone via.

```sh
$ cd path-to-shop-dir-under-privacy-sandbox-demos
$ npm install
$ npm run dev
```

Default port for standalone builds are `8080` so you can access it with <http://localhost:8080>.

But if app starts via docker-compose, nginx will proxy every request to the apps, so URL will be changes. See the root README.md for more details.

## Architecture

### Building Stacks

- typescript
- next.js
- tailwind
- iron-session

### Basic Architecture

It builds upon basic next.js manner.

- Each pages components are under `./pages` and API endpoints are `./pages/api`
- It's fully SPA but each pages are SSRed.
- Frontend states are managed by `useContext` and updated by `useReducer`.
- Server states (session) are managed by `iron-session`.
  - no session storage on server side, every session are serialized/encrypted in cookie directory.
  - server states will be initialState for react context while SSR.
- Every CSS are styled via tailwind.
- Item information's are encoded in `lib/items.ts`, so no databases in this app.
