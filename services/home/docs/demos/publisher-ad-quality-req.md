---
title: Incorporating publisher ad quality requirements in Protected Audience
sidebar_position: 3
---

import Tabs from '@theme/Tabs'; import TabItem from '@theme/TabItem';

# Incorporating publisher ad quality requirements in Protected Audience

<Tabs>
<TabItem value="overview" label="Overview" default>

## Overview

### Description

Often publishers have requirements on the types of ads they’re willing to display for example:

- Excluding adult only ads.
- Including ads only for relevant product types based on quality metrics.

During the Protected Audience auction, SSPs can implement this behavior by using a combination of DSP-supplied metadata with the bid and the SSP's own
creative metadata stored in its Key/Value (K/V) server that the SSP might have gathered from an out-of-band review process.

### Privacy Sandbox APIs

- [Protected Audience API](https://developers.google.com/privacy-sandbox/private-advertising/protected-audience)
- [Fenced Frames](https://developers.google.com/privacy-sandbox/private-advertising/fenced-frame)
- [Key/Value Service](https://developers.google.com/privacy-sandbox/private-advertising/protected-audience#key-value-service-detail)

### Related parties

- Publisher
- SSP
- Advertiser
- DSP

</TabItem>
<TabItem value="scope" label="Scope">

## Scope

### Goals

In this demo, we explore the scenario where a publisher would like to exclude ads with certain creative tags. We’ll demonstrate the publisher page
relying on ad sellers -- a publisher ad-server and multiple SSPs -- to execute a Protected Audience auction, supplying tags to exclude _(e.g.
`"redShoe"`)_. The sellers will block some ads by retrieving ad metadata associated with the ad URLs from their K/V server _(e.g.
`{"product_tags": ["redShoe", "shortsShoe"]}`)_ and matching them against the exclusion tags.

### Assumptions

- We assume the SSP has deployed a Key/Value service, either in the Bring-Your-Own-Server (BYOS) mode or in a Trusted Execution Environment (TEE).
- The SSP has a database relating ad `renderURL`s to ad metadata and this information is available in the K/V service.

### Key Exclusions

- Dynamic updates of K/V pairs coming from the SSP backend (we will use static data for this demo).
- Excluding ads based on DSP supplied meta-data.

### System Design

Using Protected Audience API, the user visits a shopping site, and gets added to an interest group. Later the same user visits a news site. Before the
auction, we establish tags used to exclude certain ads;

- In a real world use case, the publisher would set ad exclusion tags in an SSPs admin UI.
- In our demo, the user presses one of several buttons to set an exclusion tag through a url parameter.

The ad auction will receive key / value meta-data from the SSP, indicating the product tags of each ad. If they match the excluded product tag, the ad
will be excluded from the auction, and the user will see no ad.

#### User Journey

```mermaid
sequenceDiagram
Title: Enforcing publisher ad requirements in Protected Audience using K/V

participant Browser
participant Publisher
participant SSP
participant Advertiser
participant DSP

Browser->>Advertiser:Visits shop site and views product
Advertiser->>Browser:Adds DSP tag on the page
Browser->>DSP:Browser requests scripts from DSP
DSP->>Browser:Call joinAdInterestGroup() with the config

Browser->>Publisher:Visits news site
note right of Browser: With optional "?excludeCreativeTag=" param, value e.g. "redShoe"
Publisher->>Browser: Adds SSP tag on the page
SSP->>Browser: Browser loads scripts from SSP, incl. auction config with trustedScoringSignalsURL
Browser->>Browser: Adds sellerSignals to auction config, incl. excluded product tag.
SSP->>Browser:SSP calls runAdAuction with the config

Browser->>SSP:Get Key/Values
note right of Browser: Keys are ad urls
SSP->>Browser:Returns Keys/Values
note right of Browser: Response like: {"product_tags": ["redShoe", "shortsShoe"]}

Browser->>Browser:scoreAd(...)
note right of Browser: Uses the product tags for the ad from the K/V signal & the excludeCreativeTag from the seller signals.
note right of Browser: Scores 0 if ad product tags include excludeCreativeTag.

Browser ->> Browser: Return ad in the runAdAuction call if there’s a winner
SSP ->> Browser: Set iframe src attribute or fenced frame config property with the ad
Browser ->> DSP: Fetch ad
Browser ->> Browser: Render ad
```

[Full-sized diagram](./img/publisher-ad-quality-req-flow.png)

</TabItem>
<TabItem value="demo" label="Demo">

## Demo

### Prerequisites

- Latest stable version of Chrome (Open `chrome://version` to check your current version)
- Enable Privacy Sandbox APIs (Open `chrome://settings/adPrivacy` to enable _Site-suggested ads_)
- Clear your browsing history before you run one of the demo scenario below (Open `chrome://settings/clearBrowserData` to delete your browsing
  history)

### User Journey

1. [Navigate to shop site](https://privacy-sandbox-demos-shop.dev/) (advertiser)
2. Click on any "shoe" product item on the shop site. The shop (advertiser) would assume the user is interested in this type of shoe, so they would
   leverage Protected Audience API and ask the browser to join an ad interest group for this product.
3. [Navigate to this page on the news site](https://privacy-sandbox-demos-news.dev/publisher-ad-quality-req) (publisher)
4. Observe the ad served on the news site is for the shoe product you recently browsed.
5. Click on a button which matches your selected shoe:
   - Hide Red Shoes
   - Hide Blue Shoes
   - Hide Brown Shoes
   - Hide Sports Shoes

The page will refresh automatically and for the right combination of the shoe product you initially browsed and one of the above buttons clicked, the
shoe ad from Protected Audience will not be delivered. Instead, the ad from the contextual auction will be delivered. This is because:

- The button adds the `excludeCreativeTag` parameter to the page url, which in turn gets included in the publisher's ad slot configurations.
- The ad-server tag reads these ad slot configurations provided by the publisher and shares it with the SSPs so that these exclusion tags are included
  in `sellerSignals` of each of the component auction configurations.
- During the Protected Audience auction, the browser retrieves creative metadata from each of the seller's K/V server. In response, SSPs return a list
  of product tags associated with the ad referenced by the interest group `renderURL`.
- Finally in the `scoreAd()` function, the SSP assigns the bid a desirability score of 0 if the product tags matches any of the exclusion tags
  provided by the publisher.

### Implementation details

To add the user to an interest group, we reuse the implementation from the
[basic retargeting / remarketing ad campaign use-case demo](retargeting-remarketing). It’s in the second half -- the auction execution and ad delivery
-- where this use case differs from the regular Retargeting / Remarketing use-case. This is also why, this use-case is on a different page on the news
site.

##### News page & SSP tag

The news page lists the available ad slot on the page in the
[`window.PSDemo.PAGE_ADS_CONFIG`](https://github.com/privacysandbox/privacy-sandbox-demos/blob/main/services/news/src/views/publisher-ad-quality-req.ejs#L29)
object. While doing so, publisher JavaScript reads the `excludeCreativeTag` URL query parameter and includes it in the ad slot configuration as
[`sellerSignalExcludeCreativeTag`](https://github.com/privacysandbox/privacy-sandbox-demos/blob/main/services/news/src/views/publisher-ad-quality-req.ejs#L26).

```js title="Publisher configures ad slots on the page"
// Find creative tags to exclude on page, and include in seller signals.
const sellerSignalExcludeCreativeTag =
  window.PSDemo.getQueryAsString('excludeCreativeTag');
// Publishers configure the ad units available on the page.
window.PSDemo.PAGE_ADS_CONFIG = Object.freeze({
  otherSellers,
  // Ad units to request bids for.
  adUnits: [{
    code: 'displayFencedFrameAdUnit',
    auctionId: `PUB-${crypto.randomUUID()}`,
    divId: 'display-ad--fenced-frame',
    adType: 'DISPLAY',
    size: [300, 250],
    isFencedFrame: true,
    sellerSignalExcludeCreativeTag,
  }],
});
```

To deliver an ad for this ad slot, the news page also includes a third-party tag:
[ad-server-tag.js](https://github.com/privacysandbox/privacy-sandbox-demos/blob/main/services/news/src/views/publisher-ad-quality-req.ejs#L43) from
the ad-server service.

```html title="Ad-server tag on publisher page: https://privacy-sandbox-demos-news.dev"
<script
  async
  defer
  src="https://privacy-sandbox-demos-ad-server.dev/js/ssp/ad-server-tag.js"
></script>
```

. as part of its adUnits list
[(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/main/services/news/src/views/publisher-ad-quality-req.ejs#L39). The news
page also includes the SSP tag
[(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/main/services/ad-tech/src/public/js/ssp/ssp-tag.js) this will;

- Create the auction iframe
  [(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/21e23fa81783a3e7d1fac9da3e77904e893a1aee/services/ad-tech/src/public/js/ssp/ssp-tag.js#L166-L175).
- Load run-sequential-ad-auction.html into it
  [(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/21e23fa81783a3e7d1fac9da3e77904e893a1aee/services/ad-tech/src/public/js/ssp/ssp-tag.js#L45).
- Send the adUnit (which contains the sellerSignals) to into the iframe using `iframeEl.contentWindow.postMessage`
  [(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/21e23fa81783a3e7d1fac9da3e77904e893a1aee/services/ad-tech/src/public/js/ssp/ssp-tag.js#L186).

##### Client side auction code

The html in the iframe (run-sequential-ad-auction.html) loads run-sequential-ad-auction.js
[(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/21e23fa81783a3e7d1fac9da3e77904e893a1aee/services/ad-tech/src/views/ssp/run-sequential-ad-auction.ejs#L43).
The run-sequential-ad-auction.js script
[(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/21e23fa81783a3e7d1fac9da3e77904e893a1aee/services/ad-tech/src/public/js/ssp/run-sequential-ad-auction.js)
prepares the auction config for this use case by;

- **Passing sellerSignalExcludeCreativeTag param**: getBidRequestUrlsWithContext
  [(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/21e23fa81783a3e7d1fac9da3e77904e893a1aee/services/ad-tech/src/public/js/ssp/run-sequential-ad-auction.js#L61-L76)
  creates URLs which contain the sellerSignalExcludeCreativeTag & call remote path /ssp/contextual-bid/ (see below). The response contains auction
  config, including the sellerSignalExcludeCreativeTag. These are later fed into executeSequentialAuction.
- **Getting trusted scoring signals:**: Creates URLs
  [(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/21e23fa81783a3e7d1fac9da3e77904e893a1aee/services/ad-tech/src/public/js/ssp/run-sequential-ad-auction.js#L119-L123)
  to call the remote path /ssp/realtime-signals/scoring-signal.json, (see below). These return JSON structured tags for each ad.

##### Server side auction code

The file seller-contextual-bidder-router.ts handles the path /ssp/contextual-bid/ & returns sellerSignalExcludeCreativeTag in the seller signals for
the auction config
[(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/21e23fa81783a3e7d1fac9da3e77904e893a1aee/services/ad-tech/src/routes/ssp/seller-contextual-bidder-router.ts#L46-L58).

The file scoring-signals-router.ts handles the path /ssp/realtime-signals/scoring-signal.json & returns ad tags from a predefined list
[(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/21e23fa81783a3e7d1fac9da3e77904e893a1aee/services/ad-tech/src/routes/ssp/scoring-signals-router.ts#L60-L72).

##### Making a decision on a creative

The auction-decision-logic.js script contains the scoreAd function. Its isCreativeBlocked function
[(code link)](https://github.com/privacysandbox/privacy-sandbox-demos/blob/21e23fa81783a3e7d1fac9da3e77904e893a1aee/services/ad-tech/src/public/js/ssp/default/auction-decision-logic.js#L82)
uses trusted scoring signals for each ad & sellerSignalExcludeCreativeTag to score matched ads as 0.

### Related API documentation

- [Protected Audience Overview - Google Developers](https://developers.google.com/privacy-sandbox/private-advertising/protected-audience)
- [Protected Audience developer guide - Google Developers](https://developers.google.com/privacy-sandbox/private-advertising/protected-audience-api)
- [Key / Value Service Overview - Google Developers](https://developers.google.com/privacy-sandbox/blog/fledge-service-overview#key-value-service)
- [Fenced Frames Overview - Google Developers](https://developers.google.com/privacy-sandbox/private-advertising/fenced-frame)

</TabItem>
</Tabs>
