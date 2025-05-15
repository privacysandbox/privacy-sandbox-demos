---
title: Retargeting ads with Protected Audience and Frequency Capping
sidebar_position: 1
---

import Tabs from '@theme/Tabs'; import TabItem from '@theme/TabItem';

# Retargeting / remarketing ads with Frequency Capping

<Tabs>
<TabItem value="overview" label="Overview" default>

## Overview

### Description

Remarketing is a type of online advertising that allows you to show ads to people who have already visited your website. You can create custom
audiences based on different criteria, such as pages visited or products added to the cart. Remarketing can help you increase brand awareness, drive
traffic back to your website, and boost sales.

**Frequency Capping** is a feature used in conjunction with advertising to limit the number of times a specific ad is shown to the same user within a given time period. This helps prevent ad fatigue, improves user experience, and can make ad spend more efficient.

In this demo, we showcase basic remarketing and then demonstrate frequency capping. After an initial ad view, a subsequent refresh within a short window will show the same ad. A further refresh within that window will trigger the frequency cap, and a shrug emoji (🤷) will be displayed instead of the ad, indicating the cap has been met (e.g., 1 impression per 1 minute).

### Privacy Sandbox APIs and related documentation

- [Protected Audience Overview - Google Developers :arrow_upper_right:](https://privacysandbox.google.com/private-advertising/protected-audience)
- [Protected Audience Developer Guide - Google Developers :arrow_upper_right:](https://privacysandbox.google.com/private-advertising/protected-audience-api)
- [Fenced Frames Overview - Google Developers :arrow_upper_right:](https://privacysandbox.google.com/private-advertising/fenced-frame)

### Related parties

- Publisher (News site)
- Supply Side Platform (SSP)
- Advertiser (Shop site)
- Demand Side Platform (DSP)

</TabItem>
<TabItem value="design" label="Design">

## Design

### Goals

In this demo, we assume an advertiser would like to drive traffic back to their website. Remarketing can help an advertiser to get people who have
already visited their website to come back for more or to complete a purchase. This can be done by showing them ads about the product they have
previously looked at, on other websites.

Additionally, this demo aims to:
- Demonstrate how frequency capping can be implemented with Protected Audience to limit ad impressions to the same user within a defined time window.
- Show a fallback behavior (displaying a shrug emoji) when an ad's frequency cap is met.

### Assumptions

This use case assumes the advertiser (shop site) can bid on the publisher (news site) inventory through an agreement between their respective ad-tech
platforms. The frequency capping logic is primarily handled within the buyer's bidding script (`generateBid`).

### Key Exclusions

The demo does not integrate existing auction mechanisms, such as header bidding. It is only scoped to the on-device auction with Protected Audience
API. As a simple demonstration of the Protected Audience API, the auction only involves a single seller servicing a single ad slot for an opportunity
to deliver a display ad.

### System Design

When the user visits a shopping site, the browser joins an interest group using the Protected Audience API. Later the same user visits a news site. On
this site, the browser runs an on-device auction, with ad-tech-provided scripts selecting the winning ad which will be rendered in the ad slot on the
page. Frequency capping rules are evaluated during the bidding process.

#### Protected Audience Flow

Below is a general introduction of Remarketing using Privacy Sandbox Protected Audience API. Frequency capping logic is applied by the `generateBid` function using `browserSignals.prevWinsMs`.

![Protected Audience Flow](./img/retargeting-remarketing-flow.png)
*(The core flow remains the same; frequency capping is a condition within the bidding logic)*



#### User Journey (Conceptual)

The overall Protected Audience flow for joining an interest group on the advertiser site (e.g., a shop) and the initial ad auction on the publisher site (e.g., a news site) follows the standard remarketing pattern. The frequency capping feature introduces specific behavior during subsequent page refreshes on the publisher site, as detailed below:

1.  **Initial Ad View on Publisher Site (Baseline):**
    *   The user, having previously visited the advertiser's site and been added to an ad interest group, now visits the publisher site.
    *   The browser initiates a Protected Audience auction.
    *   The DSP's `generateBid` function evaluates the ad. Since there are no relevant prior wins for this specific ad within a frequency capping window to consider yet, it bids for the ad.
    *   The ad wins the auction and is rendered to the user. This first view of the ad on the publisher's page establishes a baseline and effectively starts the 1-minute frequency capping window.

2.  **Ad Shown on First Refresh (Meeting the "1 View" Cap):**
    *   The user refreshes the publisher page within 1 minute of the initial ad view (this is the **first refresh**).
    *   Another Protected Audience auction is triggered.
    *   The browser calls the DSP's `generateBid` function. The `browserSignals.prevWinsMs` argument provided to this function will now include a record of the ad's win from the user's initial page view.
    *   The bidding logic is configured with a frequency cap of "1 view in 1 minute." This means that after the initial baseline view, the ad is allowed to be shown **one more time** (on this first refresh) within that 1-minute window.
    *   `generateBid` determines the cap allows this one showing and bids for the ad.
    *   The ad wins the auction again and is rendered. This view fulfills the "1 view allowed per 1 minute window" frequency cap.

3.  **Frequency Cap Enforced (Second Refresh - Shrug Emoji):**
    *   The user refreshes the publisher page *again* (this is the **second refresh**), still within that original 1-minute window that began with the initial ad view.
    *   A new Protected Audience auction takes place.
    *   The `generateBid` function is invoked again. `browserSignals.prevWinsMs` now contains records of the ad's win from both the initial page load and the first refresh.
    *   The bidding logic evaluates `prevWinsMs` and sees that the "1 view allowed in 1 minute" cap (which was met by the ad shown on the first refresh) would be exceeded if the ad were shown again.
    *   Therefore, `generateBid` does not bid for the original ad (or bids 0). Instead, it is configured to bid a nominal amount for a default or fallback ad creative, which in this demo is one that displays a shrug emoji (🤷).
    *   The "shrug emoji ad" wins the auction (or if no ad wins and the publisher has a fallback, that is displayed).
    *   The shrug emoji 🤷 is rendered in the ad slot, demonstrating that the frequency cap for the original ad has been successfully applied.

</TabItem>
<TabItem value="demo" label="Demo">

## Demo

### Prerequisites

- Latest stable version of Chrome (Open `chrome://version` to check your current version)
- Enable Privacy Sandbox APIs (Open `chrome://settings/adPrivacy` to enable _Site-suggested ads_)
- Clear your browsing history before you run one of the demo scenario below (Open `chrome://settings/clearBrowserData` to delete your browsing
  history)

### User Journey

1.  [Navigate to shop site :arrow_upper_right:](https://privacy-sandbox-demos-shop.dev/) (advertiser)
2.  Click on any "shoe" product item on the shop site.
    - The shop (advertiser) would assume the user is interested in this type of product, so they would leverage Protected Audience API and ask the
      browser to join an ad interest group for this product or this specific product category. The interest group configuration may include metadata for frequency capping (e.g., max views, time window).
3.  [Navigate to the news site :arrow_upper_right:](https://privacy-sandbox-demos-news.dev/) (publisher)
4.  Observe the ad served on the news site.
    - If you previously browsed the "shoe" product on the shop site, you will be shown an ad for the same product. This is the **first view** of the ad.
    - When the page was loaded, Protected Audience API allowed the SSP to run an ad auction on the publisher site.
    - The winning advertiser of this ad auction gets their ad creative to be displayed on the publisher site.
5.  **Refresh** the news site page (e.g., by pressing F5 or Ctrl+R/Cmd+R) within 1 minute of the first ad view.
    - You should see the **same ad** again. This is the **second view** (or first counted view against the cap, depending on implementation, for this demo let's say the cap is 1 view, and the first refresh is that one view).
    - The `generateBid` function in the DSP's bidding script would have checked `browserSignals.prevWinsMs` and determined that the frequency cap (e.g., 1 view in 1 minute) has not yet been exceeded for this refresh.
6.  **Refresh** the news site page **again** within the same 1 minute window from the *initial ad view that started the 1-minute window*.
    - This time, you should see a **shrug emoji (🤷)** instead of the ad.
    - The `generateBid` function, upon checking `browserSignals.prevWinsMs`, would determine that showing the ad again would exceed the frequency cap (e.g., 1 view allowed in 1 minute was already shown on the previous refresh).
    - Consequently, it might not bid for that ad, or it might bid for a special `renderURL` that displays the shrug emoji. If no ad wins the auction, the publisher page might also be configured to display a default message or emoji.

### Implementation details

For retargeting/remarketing implementation details, please refer to that feature's demo page. Only frequency capping implementation details are listed here.

#### How is frequency capping implemented in the auction? (see step #5 & #6 of user journey)

Frequency capping is primarily implemented within the `generateBid` function of the buyer's bidding script (`auction-bidding-logic.js`). This script has access to `browserSignals`, which includes `prevWinsMs`. `prevWinsMs` is an array of previous wins for ads from this interest group in auctions on the same device, for the same publisher.

Here are the main changes in `auction-bidding-logic.js`
```js 
// Add frequency capping intervals
const ONE_MINUTE_MS = 60 * 1000; // 60 seconds * 1000 ms/sec
const MAX_IMPRESSIONS_PER_MINUTE_PER_AD = 1;

function shouldShowAd(prevWinsMs, currentAd) { // currentAd is the ad we're considering showing
  if (!prevWinsMs || !currentAd) {
      return true; // No previous wins or no current ad, so show the ad
  }

  const recentWinsForCurrentAdOneMin = prevWinsMs.filter(([timeDeltaMs, ad]) => {
      return timeDeltaMs <= ONE_MINUTE_MS && ad.renderURL === currentAd.renderURL; // Filter by time and ad renderURL
  });

  return recentWinsForCurrentAdOneMin.length < MAX_IMPRESSIONS_PER_MINUTE_PER_AD 
```
```js
// If FC is met, show default ads (shrug emoji), default ads wins in this case
 if (!selectedAd) {
    //log("can't select display ad, no matching ad type found", {interestGroup});
    return {bid: '0.0'};
  } else if (!shouldShowAd(browserSignals.prevWinsMs, selectedAd)) { 
    //log('frequency capping', {interestGroup, browserSignals});
    [selectedAd] = interestGroup.ads.filter(
      (ad) => 'DEFAULT' === ad.metadata.adType,
    );
  }
```

Another main change is in `interest-group-helper.ts`. We need the default ads to be added to interest group
```js
/** Returns the interest group default display ad to for the given advertiser when frequenc cap is met. */
const getDefaultDisplayAdForRequest = (
  targetingContext: TargetingContext,
): InterestGroupAd => {
  const {advertiser} = targetingContext;
  const renderUrl = new URL(
    `https://${HOSTNAME}:${EXTERNAL_PORT}/ads/display-ads`,
  );
  renderUrl.searchParams.append('advertiser', advertiser);
  renderUrl.searchParams.append('itemId', '1f937');
  
  const ad: InterestGroupAd = {
    renderURL: `${renderUrl.toString()}&${MACRO_DISPLAY_RENDER_URL_AD_SIZE}`,
    metadata: {
      advertiser,
      adType: AdType.DEFAULT,
      adSizes: [{width: '300px', height: '250px'}],
    },
    sizeGroup: 'medium-rectangle',
    buyerReportingId: 'buyerSpecificInfo0',
    buyerAndSellerReportingId: 'seatid-000',
  };
  if (targetingContext.isUpdateRequest) {
    // Only include deal IDs in update requests.
    ad.selectableBuyerAndSellerReportingIds = ['deal-1', 'deal-2', 'deal-3'];
  }
  return ad;
};
```
*Note: The `browserSignals.prevWinsMs` array records wins for ads from the *same interest group*, for the *same seller (publisher)*, on the *same device*. The `renderURL` comparison ensures the cap is applied to the specific ad creative.*


### API Reference

- [Protected Audience API overview](https://privacysandbox.google.com/private-advertising/protected-audience)
- [Protected Audience API: developer guide](https://privacysandbox.google.com/private-advertising/protected-audience-api) (See `generateBid` and `browserSignals.prevWinsMs`)

</TabItem>
</Tabs>