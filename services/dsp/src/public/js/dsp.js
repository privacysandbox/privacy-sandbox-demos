let dsp = document.currentScript.getAttribute('dsp');
window.addEventListener('load', (event) => {
  let iframeAws = document.createElement('iframe');
  let iframeGcp = document.createElement('iframe');
  // let dsp = document.currentScript.getAttribute('dsp');
  iframeAws.src = `https://${dsp}/private-aggregation-aws`;
  iframeGcp.src = `https://${dsp}/private-aggregation-gcp`;
  document.body.appendChild(iframeAws);
  document.body.appendChild(iframeGcp);
});
