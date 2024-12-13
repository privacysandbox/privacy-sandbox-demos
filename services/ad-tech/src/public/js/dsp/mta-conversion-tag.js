(() => {
  const $ins = document.querySelector('ins.mta_conversion_tag');
  const scriptSrc = document.currentScript.getAttribute('src');
  const purchaseValue = document.currentScript.getAttribute('purchaseValue');
  const mtaConversionTagURL = new URL(scriptSrc);
  mtaConversionTagURL.pathname = '/dsp/mta-conversion.html';
  mtaConversionTagURL.searchParams.append('purchaseValue', purchaseValue);

  const $iframe = document.createElement('iframe');
  $iframe.width = 1;
  $iframe.height = 1;
  $iframe.src = mtaConversionTagURL;
  $iframe.setAttribute('scrolling', 'no');
  $iframe.setAttribute('style', 'border: none');
  $ins.appendChild($iframe);
})();
