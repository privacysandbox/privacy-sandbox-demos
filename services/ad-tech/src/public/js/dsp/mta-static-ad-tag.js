(() => {
  const $ins = document.querySelector('div.ad-slot');
  const scriptSrc = document.currentScript.getAttribute('src');
  const staticAdURL = new URL(scriptSrc);
  staticAdURL.pathname = '/ads/mta-ads';

  const $iframe = document.createElement('iframe');
  $iframe.width = 300;
  $iframe.height = 250;
  $iframe.src = staticAdURL;
  $iframe.setAttribute('scrolling', 'no');
  $iframe.setAttribute('style', 'border: none');
  $iframe.setAttribute('allow', 'attribution-reporting');
  $ins.appendChild($iframe);
})();
