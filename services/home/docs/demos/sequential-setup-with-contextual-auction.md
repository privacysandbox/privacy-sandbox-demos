---
title: Sequential setup of Protected Audience with contextual ad auction
sidebar_position: 2
---

import Tabs from '@theme/Tabs'; import TabItem from '@theme/TabItem';

# Sequential setup of Protected Audience with contextual ad auction

<Tabs>
<TabItem value="overview" label="Overview" default>

## Overview

### Description

While Protected Audience may enable the delivery of more relevant ads by considering cross-site context without relying on tracking identifiers and
third-party cookies, publishers will continue to diversify their ad demand sources with an intention to optimize for revenue. Additionally, there is
always a possibility that the Protected Audience auction may not return a valid result because of multiple reasons such as: no interest groups were
eligible, all eligible ads were blocked, or a timeout was hit, etc. The publisher, regardless of the auction mechanism, would still want to fill the
ad slot with an ad. So, we anticipate that publishers will continue to rely on their current contextual auction setup while exploring Protected
Audience as an additional demand source that may or may not beat the contextual demand floor.

For a deeper walkthrough of this sequential auction setup, see:
[Sequential auction setup with contextual ad auction - Google Developers](https://developers.google.com/privacy-sandbox/private-advertising/auction/sequential-auction)

### Privacy Sandbox APIs

- [Protected Audience](https://developers.google.com/privacy-sandbox/private-advertising/protected-audience)
- [Fenced Frames](https://developers.google.com/privacy-sandbox/private-advertising/fenced-frame)

### Related parties

- Publisher
- Publisher Ad Server
- Supply Side Platform (SSP)
- Advertiser
- Demand Side Platform (DSP)

</TabItem>
<TabItem value="scope" label="Scope">

## Scope

### Goals

In this demo, we aim to demonstrate a basic sequential auction setup with a focus on the data flow from the perspective of the Protected Audience
auction and abstract a lot of the technical nuance of the contextual auction. Building on the
[basic retargeting / remarketing ad campaign use-case demo](retargeting-remarketing), this demo shows a more realistic sequential setup with multiple
buyers and sellers participating in the ad delivery process. This demo will also demonstrate SSPs sourcing `buyerSignals` from DSPs and including them
in the Protected Audience auction configuration.

### Key Exclusions

This demo abstracts a lot of the complexity in the contextual auction. For starters, this demo doesn't integrate with any real header bidding library.
Additionally, this demo doesn't aim to replicate the integration patterns between the publisher ad server and other ad sellers or SSPs across various
ad delivery setups. This demo focuses on a few exemplary 'signals' as opposed to an industry spec such as OpenRTB.

### System Design

// TODO: Building on the existing single seller auction, ...

#### Protected Audience Flow

![Sequential auction setup flow](./img/sequential-setup-with-contextual-auction-flow.png)

#### User Journey (TODO)

```mermaid
sequenceDiagram
Title: Sequential setup of Protected Audience with contextual ad auction

autonumber

actor User
participant Browser
participant Advertiser as Advetiser site
participant Publisher as Publisher site
box rgb(200, 220, 240) Sellers
    participant SellerTop as Top-level seller
    participant SellerA as Seller A
    participant SellerB as Seller B
end
box rgb(220, 240, 220) Buyers
    participant Buyers
end

Note right of User: Pre-auction
User ->> Advertiser: Visit advertiser page
Advertiser ->> Buyers: Load buyer scripts
Buyers ->> Browser: Add user to the interest group for the site

Note right of User: Top-level auction
User ->> Publisher: Visit publisher page
Publisher ->> SellerTop: Load top-level seller script
activate SellerTop
SellerTop ->> SellerA: Fetch component config
SellerTop ->> SellerB: Fetch component config
SellerTop ->> Browser: Start top-level auction with component configs added (runAdAuction)
deactivate SellerTop

    Note right of User: Seller A's auction (in parallel)
    Browser ->> SellerA: Load Seller A's script and start component auction
    activate SellerA
    Browser ->> Browser: Read interest groups of all participating buyers
    Browser ->> Buyers: Fetch bidding scripts and trusted bidding signals
    Browser ->> Browser: Generate each bid from buyer's logic (generateBid)
    Browser ->> SellerA: Fetch scoring script trusted scoring signals
    Browser ->> Browser: Score each ad with seller's scoring script (scoreAd)
    Browser ->> Browser: Choose the highest scoring ad from seller's score of each ad
    deactivate SellerA

    Note right of User: Seller B's auction (in parallel)
    Browser ->> SellerB: Load Seller A's script and start component auction
    activate SellerB
    Browser ->> Browser: Read interest groups of all participating buyers
    Browser ->> Buyers: Fetch bidding scripts and trusted bidding signals
    Browser ->> Browser: Generate each bid from buyer's logic (generateBid)
    Browser ->> SellerA: Fetch scoring script trusted scoring signals
    Browser ->> Browser: Score each ad with seller's scoring script (scoreAd)
    Browser ->> Browser: Choose the highest scoring ad from seller's scores of each ad
    deactivate SellerB

Note right of User: Top-level auction continued
Browser ->> SellerTop: Fetch top-level scoring script and trusted scoring signals
activate SellerTop
Browser ->> Browser: Score each component auction winning ad with top-seller's scoring script (scoreAd)
Browser ->> Browser: Choose the highest scoring ad from top-level seller's scoreof each component ad
deactivate SellerTop

Browser ->> SellerTop: Report event-level and aggregate result
Browser ->> SellerA: Report event-level and aggregate result
Browser ->> SellerB: Report event-level and aggregate result

Note right of User: Winner is chosen
    Browser ->> Buyers: Report event-level win or aggregate loss result
    Browser ->> SellerTop: Return Opaque URN or FencedFrameConfig object that contains the ad location
    SellerTop ->> Browser: Set iframe src or fenced frame config
    Buyers ->> Browser: Provide ad
    Browser ->> User: Render ad (iframe or fenced frame)

Note right of User: No winner is chosen
    Browser ->> Buyers: Report aggregate loss result
    Browser ->> SellerTop: Returns 'null'
    SellerTop ->> Browser: Set iframe src to a default or contextual ad
    Browser ->> User: Render default or contextual ad

```

</TabItem>
<TabItem value="demo" label="Demo">

## Demo (TODO)

### Prerequisites (TODO)

- Latest stable version of Chrome (Open `chrome://version` to check your current version)
- Enable Privacy Sandbox APIs (Open `chrome://settings/adPrivacy` to enable _Site-suggested ads_)
- Clear your browsing history before you run one of the demo scenario below (Open `chrome://settings/clearBrowserData` to delete your browsing
  history)

### User Journey (TODO)

1. [Navigate to shop site](https://privacy-sandbox-demos-shop.dev/) (advertiser)
2. Click on any "shoe" product item on the shop site.
   - The shop (advertiser) would assume the user is interested in this type of product, so they would leverage Protected Audience API and ask the
     browser to join an ad interest group for this product or this specific product category.
3. [Navigate to the news site](https://privacy-sandbox-demos-news.dev/) (publisher)
4. Observe the ad served on the news site
   - If you previously browsed the "shoe" product on the shop site, you will be shown an ad for the same product.
   - When the page was loaded, Protected Audience API allowed the SSP to run an ad auction on the publisher site.
   - The winning advertiser of this ad auction gets their ad creative to be displayed on the publisher site. In this case you have cleared the browser
     history and only browsed 1 advertiser site page so you are only seeing 1 ad creative from the same advertiser.

### Implementation details

The user is added to interest groups by DSPs using the same mechanism as described in the
[basic remarketing / retargeting use-case demo](retargeting-remarketing). The incremental difference in the implementation of this demo is on the
publisher page.

#### How does the publisher pass the ad unit configurations for a given page to the publisher ad server?

The news page lists the available ad slots on the page in the
[`window.PSDemo.PAGE_ADS_CONFIG`](https://github.com/privacysandbox/privacy-sandbox-demos/blob/main/services/news/src/views/fenced-frame-display-ad.ejs#L16-38)
object.

```js title="Publisher configures ad slots on page: https://privacy-sandbox-demos-news.dev"
// List of additional sellers that the publisher ad server should include in the ad delivery process.
const otherSellers = window.PSDemo.getUrlQueryAsArray('otherSellers') || [
  'https://privacy-sandbox-demos-ssp.dev',
  'https://privacy-sandbox-demos-ssp-a.dev',
  'https://privacy-sandbox-demos-ssp-b.dev',
];
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
  }],
});
```

To deliver an ad for this ad slot, the news page also includes a third-party tag:
[ad-server-tag.js](https://github.com/privacysandbox/privacy-sandbox-demos/blob/main/services/news/src/views/fenced-frame-display-ad.ejs#L39-41) from
the publisher ad server.

```html title="Ad server tag on publisher page: https://privacy-sandbox-demos-news.dev/fenced-frame-display-ad"
<script async defer
        src="https://privacy-sandbox-demos-ad-server.dev/js/ssp/ad-server-tag.js"
></script>
```

#### How does the publisher ad server initiate the contextual auction?

#### How does the publisher ad server integrate the Protected Audience auction in a sequential manner?

#### How is the relevant ad delivered to the user? (see step #4 of User Journey)

This
[run-simple-ad-auction.js](https://github.com/privacysandbox/privacy-sandbox-demos/blob/main/services/ad-tech/src/public/js/ssp/run-simple-ad-auction.js)
script executes a Protected Audience auction using auction configurations retrieved from its server.

```js title="SSP script loaded on publisher page: https://privacy-sandbox-demos-news.dev"
document.addEventListener("DOMContentLoaded", async (e) => {
  // Retrieve auction configuration from its own server.
  const auctionConfig = await getAuctionConfig(adUnit);
  // Execute the Protected Audience auction.
  const adAuctionResult = await navigator.runAdAuction(auctionConfig);
  // Finally handle the auction result.
  if (!adAuctionResult) {
    document.getElementById(adUnit.divId).innerText = 'No eligible ads';
  } else {
    const adFrame = document.createElement('fencedframe');
    adFrame.config = adAuctionResult;
    [adFrame.width, adFrame.height] = adUnit.size;
    log('delivering ads in ', {
      adFrame,
      adUnit,
      auctionConfig,
      adAuctionResult,
    });
    document.getElementById(adUnit.divId).appendChild(adFrame);
  }
});
```

The Protected Audience auction is orchestrated by the browser, executing bidding and decision logic provided by the ad buyer and ad seller
respectively to arrive at the winning ad. The result of this ad auction is displayed within a Fenced Frame. This ad auction result represents the
winning [`renderURL`](https://github.com/privacysandbox/privacy-sandbox-demos/blob/main/services/ad-tech/src/routes/common/ads-router.ts#L34) included
in the interest group.

```html title="Protected Audience auction result delivered in a fenced-frame"
<fencedframe width="300" height="250">
  #document (https://privacy-sandbox-demos-dsp.dev/ads/display-ads?advertiser=privacy-sandbox-demos-shop.dev&itemId=1f460)
  <html lang="en">
    …
  </html>
</fencedframe>
```

## Related API documentation

- [Protected Audience Overview - Google Developers](https://developers.google.com/privacy-sandbox/private-advertising/protected-audience)
- [Protected Audience Developer Guide - Google Developers](https://developers.google.com/privacy-sandbox/private-advertising/protected-audience-api)
- [Sequential setup with contextual ad auction - Google Developers](https://developers.google.com/privacy-sandbox/private-advertising/auction/sequential-auction)
- [Fenced Frames Overview - Google Developers](https://developers.google.com/privacy-sandbox/private-advertising/fenced-frame)

</TabItem>
</Tabs>
