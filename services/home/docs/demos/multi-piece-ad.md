---
title: Ads Composed of Multiple Pieces
sidebar_position: 9
---

multi-piece-ad

import Tabs from '@theme/Tabs'; import TabItem from '@theme/TabItem';

# Ads Composed of Multiple Pieces

<Tabs>
<TabItem value="overview" label="Overview" default>
## Overview
### Description
Advertisers can display multiple products/pieces in one ad unit, allowing users to click directly to individual product pages. This is achieved
through a template 'container' with customizable product slots.

### Privacy Sandbox APIs

- [Protected Audience API](https://developer.chrome.com/docs/privacy-sandbox/protected-audience/)

### Related parties

- SSP
- Advertiser
- DSP

</TabItem>
<TabItem value="design" label="Design">
## Design

### Goals

In this demo, the auction setup and execution is similar to the
[sequential setup of Protected Audience with contextual ad auction](https://privacy-sandbox-demos.dev/docs/demos/sequential-auction-setup/) demo. So,
please check this use case implementation first if you want to learn about the Protected Audience auction setup.

The only incremental difference in this use-case is that the advertiser can provide more than one product that the user interacted with in the same ad
slot.

### Assumptions​

This use case assumes the advertiser (shop site) can bid on the publisher (news site) inventory through an agreement between their respective DSP and
SSP platforms.

We use "MULTIPIECE" as a new ad request type for demonstration purposes, but in real life applications, such a signal to communicate the support for a
multi-piece ad may not be required.

### System Design

Using Protected Audience API, the user visits a product in the shopping site, and gets added to an interest group. This interest group can include a
list of products that this user has interacted with, which can be tracked using first-party data. This list will be stored in the `adComponents` field
of the interest group object.

Later the same user visits a news site. There, the browser runs an on-device auction with the Protected Audience API, and the ad seller’s scoring
logic will select the winning ad which will be dynamically rendered on the publisher page.

</TabItem>

<TabItem value="demo" label="Demo">

## Demo

### Prerequisites

- Latest stable version of Chrome (Open `chrome://version` to check your current version)
- Enable Privacy Sandbox APIs (Open `chrome://settings/adPrivacy` to enable _Site-suggested ads_ and _Ad measurement_)
- Clear your browsing history before you run one of the demo scenario below (Open `chrome://settings/clearBrowserData` to delete your browsing
  history)

### User Journey #1

1. [Navigate to shop site](https://privacy-sandbox-demos-shop.dev/) (Advertiser)
2. Click on a “shoe” product item on the shop site.
   - The shop (advertiser) would assume the user is interested in this type of product, so they would leverage Protected Audience API and ask the
     browser to join an ad interest group for this product or this specific product category.
3. [Navigate to news site](https://privacy-sandbox-demos-news.dev/pa-iframe-multi-piece-ad) (Publisher)
4. Observe the ad served on the news site. The shoe that you previously browsed will be shown between other 4 shoes in a multi-piece ad.

### Implementation details

**How is the product browsed added to an Interest Group?**

To implement the multi-piece ad, the user joins the interest group which contains one ad in the ads field and also contains a list of products/ads in
the `adComponents` field.

The top-level ad ("container") includes some slots that can be filled in with specific products ("ad components").

The `adComponents` field contains the various ad components that can be used to construct "ads composed of multiple pieces". Similar to the ads field,
each entry is an object that includes a `renderURL`,optional `adRenderId`, and `metadata` fields.

```javascript
const myGroup = {
  'owner': 'https://www.example-dsp.com',
  'name': 'womens-running-shoes',
  'ads': [
    {renderUrl: "container.html", sizeGroup: 'group1', ...},
    {renderUrl: shoesAd2, sizeGroup: 'group2'},
  ],
  'adComponents': [
    {renderUrl: runningShoes1, sizeGroup: 'group2', ...},
    {renderUrl: runningShoes2, sizeGroup: 'group2', ...},
    {renderUrl: gymShoes, sizeGroup: 'group2', ...},
  ],
  'adSizes': {
    'size1': {width: '100', height: '100'},
    'size2': {width: '100', height: '200'},
    'size3': {width: '75', height: '25'},
    'size4': {width: '100', height: '25'},
  },
  'sizeGroups': {
    'group1': ['size1', 'size2', 'size3'],
    'group2': ['size3', 'size4'],
  },
  ...
};
```

The `adSizes` field contains a dictionary of named ad sizes. Each size has the format `{ width: widthVal, height: heightVal }`, where the values can
have either pixel units (e.g. `100` or `100px`) or screen dimension coordinates (e.g. `100sw` or `100sh`).

The `sizeGroups` field contains a dictionary of named lists of ad sizes. Each ad declared above must specify a size group, saying which sizes it might
be loaded at.

**How do we serve a Multi Piece Ad?**

If the bid returns a multi piece ad, the creative's URL ("container") must match the `renderURL` of an ad in the interest group's ads list.

And, it also needs to return the `adComponents` field with the selected products for this creative. In this case, each value in the `adComponents`
list must match one of `adComponent`'s `renderURL` and sizes available in the interest group. Partners can also use `sizeGroup` instead of `size`.

Importantly, the `adComponents` list doesn't have to include every item from the interest group's `adComponent`, giving ad-techs the flexibility to
choose which ads or products to display.

```javascript
const bid = {
  ...,
  'bid': bidValue,
  'bidCurrency': 'USD',
  'render': {
    'url': 'https://www.example.com/ads/multi-piece-container.html',
    'width': renderWidth,
    'height': renderHeight
  },
  'adComponents': [
    {
        'url': 'https://www.example.com/ads/multi-piece-product1.html',
        'width': componentWidth1,
        'height': componentHeight1
    },
    {
        'url': 'https://www.example.com/ads/multi-piece-product1.html',
        'width': componentWidth2,
        'height': componentHeight2
    },
    ...
  ],
}
```

To serve ads from `adComponents`, you can utilize either iframes or Fenced Frames.

For iframes, the `navigator.adAuctionComponents(numberOfAdComponents)` function provides an array containing the requested number of `AdComponents`
along with their respective `renderURL`.

Alternatively, for Fenced Frames, the `window.fence.getNestedConfigs()` function returns an array of `FencedFrameConfig` objects.

### Related API documentation

- [Ads Composed of Multiple Pieces](https://github.com/WICG/turtledove/blob/main/FLEDGE.md#34-ads-composed-of-multiple-pieces)
- [Protected Audience API overview](https://privacysandbox.google.com/private-advertising/protected-audience)

</TabItem>

</Tabs>
