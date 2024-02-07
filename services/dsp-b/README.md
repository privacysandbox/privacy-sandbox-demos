# DSP (Demand Side Platform) in Privacy Sandbox Demos

## /ads

Serving requested Ads. It includes ads creative (Image, Video etc). Clicking ads will guide user to SSP redirector for measurement CTC.

```html
<fencedframe mode="opaque-ads" scrolling="no" width="300" height="250">
  <html lang="en">
    <body>
      <a
        width="300"
        height="250"
        target="_blank"
        rel="noopener noreferrer"
        attributionsrc="https://privacy-sandbox-demos-ssp.dev/register-source?advertiser=privacy-sandbox-demos-shop.dev&amp;id=1fa74"
        href="https://privacy-sandbox-demos-shop.dev/items/1fa74"
      >
        <!-- smaller for avoid scrollbar -->
        <img
          width="294"
          height="245"
          loading="lazy"
          attributionsrc="https://privacy-sandbox-demos-ssp.dev/register-source?advertiser=privacy-sandbox-demos-shop.dev&amp;id=1fa74"
          src="
         https://privacy-sandbox-demos-shop.dev/ads/1fa74"
        />
      </a>
    </body>
  </html>
</fencedframe>
```
