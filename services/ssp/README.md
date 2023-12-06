# SSP (Supply Side Platform) in Privacy Sandbox Demos

## Intro

This app is a demo of "SSP" party in Privacy Sandbox Demos world.

Provides 3rd Party Tag for publisher who intends to display ads in their own site (`news` in Privacy Sandbox Demos).

## How to use 3rd Party Tag

Each site should paste a line below into HTML to embed ads which SSP provides.

```html
<script defer class="ssp_tag" src="https://privacy-sandbox-demos-ssp.dev/ad-tag.js"></script>
```

## Inside ad-tag.js

### ad-tag.js

Simply embedding `ad-tag.html` into the caller site.

```html
<iframe allow="attribution-reporting" src="https://privacy-sandbox-demos-ssp.dev/ad-tag.html"> </iframe>
```

## ad-tag.html

It's add page by SSP choosing ads to be shown. Decision logic, running auction can be here. Embedding `/ads` with some parameters in iframe.

```html
<iframe allow="attribution-reporting" src="https://privacy-sandbox-demos-ssp.dev/ad-tag.html">
  <iframe allow="attribution-reporting" src="/ads?advertiser=foo&id=bar"> </iframe>
</iframe>
```

## CAUTION !!!

THIS IS ONLY A DEMO SO SOME SECURITY PROBLEM MAY HAPPEN. NEVER DEPLOY THIS IN PRODUCTION AS-IS.
