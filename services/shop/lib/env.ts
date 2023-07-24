// External Port (bind by Nginx)
export const EXTERNAL_PORT = process.env.EXTERNAL_PORT || 443

// Bind by each Application Server (fixed value)
export const PORT = process.env.PORT || 8080

// home
export const HOME_HOST = process.env.HOME_HOST || "privacy-sandbox-demos-home.dev"
export const HOME_TOKEN = process.env.HOME_TOKEN || ""
export const HOME_DETAIL = process.env.HOME_DETAIL || "Home page of Privacy Sandbox Demos"

// Publisher
//// news
export const NEWS_HOST = process.env.NEWS_HOST || "privacy-sandbox-demos-news.dev"
export const NEWS_TOKEN = process.env.NEWS_TOKEN || ""
export const NEWS_DETAIL = process.env.NEWS_DETAIL || "Publisher: News media site"

// Advertizer
//// shop
export const SHOP_HOST = process.env.SHOP_HOST || "privacy-sandbox-demos-shop.dev"
export const SHOP_TOKEN = process.env.SHOP_TOKEN || ""
export const SHOP_DETAIL = process.env.SHOP_DETAIL || "Advertiser: EC shopping site"

//// travel
export const TRAVEL_HOST = process.env.TRAVEL_HOST || "privacy-sandbox-demos-travel.dev"
export const TRAVEL_TOKEN = process.env.TRAVEL_TOKEN || ""
export const TRAVEL_DETAIL = process.env.TRAVEL_DETAIL || "Advertiser: EC travel site"

// Adtech
//// dsp
export const DSP_HOST = process.env.DSP_HOST || "privacy-sandbox-demos-dsp.dev"
export const DSP_TOKEN = process.env.DSP_TOKEN || ""
export const DSP_DETAIL = process.env.DSP_DETAIL || "Ad-Platform: DSP for advertiser"

//// ssp
export const SSP_HOST = process.env.SSP_HOST || "privacy-sandbox-demos-ssp.dev"
export const SSP_TOKEN = process.env.SSP_TOKEN || ""
export const SSP_DETAIL = process.env.SSP_DETAIL || "Ad-Platform: SSP for publisher"

//// Collector for Aggregation Service
export const COLLECTOR_HOST = process.env.COLLECTOR_HOST || "privacy-sandbox-demos-collector.dev"
export const COLLECTOR_TOKEN = process.env.COLLECTOR_TOKEN || ""
export const COLLECTOR_DETAIL = process.env.COLLECTOR_DETAIL || ""

// IDP
export const IDP_HOST = process.env.IDP_HOST || "privacy-sandbox-demos-idp.dev"
export const IDP_TOKEN = process.env.IDP_TOKEN || ""
export const IDP_DETAIL = process.env.IDP_DETAIL || "Identity Provider for relying parties. Also Issuing Private State Token"
