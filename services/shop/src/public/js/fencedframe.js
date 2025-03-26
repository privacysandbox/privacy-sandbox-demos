const externalPort = '<%= EXTERNAL_PORT %>';

function createFallbackPaymentButton() {
  // For browsers not supporting Fenced Storage Read
  const fallbackButton = document.createElement('button');
  fallbackButton.id = 'fallback-button';
  fallbackButton.innerText = 'PAY NOW';
  fallbackButton.addEventListener('click', () => {
    navigateToCheckout();
  });

  fallbackButton.classList.add(
    'w-60',
    'border',
    'border-slate-600',
    'text-slate-600',
    'enabled:hover:bg-slate-400',
    'enabled:hover:text-white',
    'disabled:opacity-40',
  );
  document.getElementById('button-holder').appendChild(fallbackButton);
}

function navigateToCheckout() {
  const shopHost = '<%= SHOP_HOST %>';
  window.location.href = `https://${shopHost}:${externalPort}/checkout`;
}

function createFencedFrame() {
  const fencedframe = document.createElement('fencedframe');

  const serviceProviderHost = '<%= SERVICE_PROVIDER_HOST %>';

  fencedframe.addEventListener('fencedtreeclick', () => {
    const height = 600;
    const width = 600;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;
    const params =
      'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top;

    window.open(
      `https://${serviceProviderHost}:${externalPort}/popup`,
      'example-pay-popup',
      params,
    );

    window.addEventListener('message', (event) => {
      navigateToCheckout();
    });
  });

  try {
    fencedframe.config = new FencedFrameConfig(
      `https://${serviceProviderHost}:${externalPort}/button`,
    );
    fencedframe.height = '75px';
    fencedframe.width = '250px';
    fencedframe.style.border = '0px';
    fencedframe.style.borderRadius = '25px';

    document.getElementById('button-holder').appendChild(fencedframe);
  } catch (e) {
    console.log('Cannot provide personalized button: ' + e);
    createFallbackPaymentButton();
  }
}

createFencedFrame();
