const externalPort = '<%= EXTERNAL_PORT %>';

function createPaymentButtons() {
  createSecondaryPaymentButton('CREDIT CARD');
  createSecondaryPaymentButton('BANK TRANSFER');

  const fencedframe = document.createElement('fencedframe');

  const serviceProviderHost = '<%= SERVICE_PROVIDER_HOST %>';

  fencedframe.addEventListener('fencedtreeclick', () => {
    const height = 600;
    const width = 600;
    const y = window.top.outerHeight / 2 + window.top.screenY - height / 2;
    const x = window.top.outerWidth / 2 + window.top.screenX - width / 2;

    const params = `width=${width}, height=${height}, top=${y}, left=${x}`;

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
  }
}

function createSecondaryPaymentButton(buttonText) {
  const button = document.createElement('button');
  button.innerText = buttonText;
  button.addEventListener('click', () => {
    navigateToCheckout();
  });

  button.classList.add(
    'w-60',
    'border',
    'border-slate-600',
    'text-slate-600',
    'enabled:hover:bg-slate-400',
    'enabled:hover:text-white',
    'disabled:opacity-40',
    'rounded',
  );

  document.getElementById('button-holder').appendChild(button);
}

function navigateToCheckout() {
  const shopHost = '<%= SHOP_HOST %>';
  window.location.href = `https://${shopHost}:${externalPort}/checkout`;
}

createPaymentButtons();
