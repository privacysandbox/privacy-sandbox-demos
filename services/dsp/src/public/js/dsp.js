let dsp = document.currentScript.getAttribute('dsp');
window.addEventListener("load", (event) => {
    let iframe = document.createElement('iframe');
    let iframe2 = document.createElement('iframe');
    // let dsp = document.currentScript.getAttribute('dsp');
    iframe.src = `https://${dsp}/private-aggregation-aws`;
    iframe2.src = `https://${dsp}/private-aggregation-gcp`;
    document.body.appendChild(iframe);
    document.body.appendChild(iframe2);
  });
