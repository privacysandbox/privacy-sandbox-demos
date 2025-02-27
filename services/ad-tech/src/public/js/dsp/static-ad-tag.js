// TODO(sidsahoo): Deprecate
(() => {
  const $script = document.currentScript;
  const scriptSrc = $script.getAttribute('src');
  const staticAdURL = new URL(scriptSrc);
  staticAdURL.pathname = '/ads/static-ads';

  const $iframe = document.createElement('iframe');
  $iframe.width = 300;
  $iframe.height = 250;
  $iframe.src = staticAdURL;
  $iframe.setAttribute('scrolling', 'no');
  $iframe.setAttribute('style', 'border: none');
  $iframe.setAttribute('allow', 'attribution-reporting');
  $script.parentElement.insertBefore($iframe, $script);
})();
