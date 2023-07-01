import Script from "next/script"

const { SHOP_HOST, DSP_HOST, EXTERNAL_PORT } = process.env

export default async function DSPTag({ id }: { id: string }) {
  const dsp_url = new URL(`https://${DSP_HOST}:${EXTERNAL_PORT}/dsp-tag.js`).toString()
  return <Script className="dsp_tag" data-advertiser={SHOP_HOST} data-id={id} src={dsp_url}></Script>
}
