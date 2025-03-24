function createFencedFrame() {
  let fencedframe = document.createElement('fencedframe');

  let serviceProviderHost = '<%= SERVICE_PROVIDER_HOST %>';
  let shopHost = '<%= SHOP_HOST %>';
  let externalPort = '<%= EXTERNAL_PORT %>';

  fencedframe.addEventListener('fencedtreeclick', () => {
    let height = 500;
    let width = 600;
    let left = screen.width / 2 - width / 2;
    let top = screen.height / 2 - height / 2;
    let params =
      'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top;

    window.open(
      `https://${serviceProviderHost}:${externalPort}/popup`,
      'example-pay-popup',
      params,
    );

    window.setTimeout(function () {
      window.location.href = `https://${shopHost}:${externalPort}/checkout`;
    }, 3000);
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

createFencedFrame();
