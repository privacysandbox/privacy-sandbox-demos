let dsp = document.currentScript.getAttribute('dsp');
let bucket = document.currentScript.getAttribute('bucket');
let cloudEnv = document.currentScript.getAttribute('cloudenv');
window.addEventListener('load', (event) => {
  // if((cloudEnv == 'aws' || cloudEnv == 'gcp') && bucket != "undefined"){
  //   let iframe = document.createElement('iframe');
  //   iframe.src = `https://${dsp}/private-aggregation-${cloudEnv}?bucket=${bucket}`;
  //   document.body.appendChild(iframe);
  // }
  if((cloudEnv == 'aws' || cloudEnv == 'gcp') && bucket != "undefined"){
    let iframe = document.createElement('iframe');
    iframe.src = `https://${dsp}/private-aggregation?bucket=${bucket}&cloudEnv=${cloudEnv}`;
    document.body.appendChild(iframe);
  }
});
