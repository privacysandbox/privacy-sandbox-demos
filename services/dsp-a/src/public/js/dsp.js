let dsp = document.currentScript.getAttribute('dsp');
window.addEventListener('load', (event) => {
  let iframe = document.createElement('iframe');
  // let dsp = document.currentScript.getAttribute('dsp');
  iframe.src = `https://${dsp}/private-aggregation`;
  document.body.appendChild(iframe);
});
