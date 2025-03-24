function createFencedFrame() {
  let fencedframe = document.createElement('fencedframe');

  fencedframe.addEventListener('fencedtreeclick', () => {
    let height = 500;
    let width = 600;
    let left = screen.width / 2 - width / 2;
    let top = screen.height / 2 - height / 2;
    let params =
      'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top;

    window.open(
      'https://privacy-sandbox-demos-services.dev/popup',
      'example-pay-popup',
      params,
    );

    window.setTimeout(function () {
      window.location.href = 'https://privacy-sandbox-demos-shop.dev/checkout';
    }, 3000);
  });

  try {
    fencedframe.config = new FencedFrameConfig(
      'https://privacy-sandbox-demos-services.dev/button',
    );

    fencedframe.height = '75px';
    fencedframe.width = '250px';
    fencedframe.style.border = '0px';
    fencedframe.style.borderRadius = '25px';

    document.getElementById('button-holder').appendChild(fencedframe);
  } catch (e) {
    console.log('Cannot provide personalized button.');
  }
}

createFencedFrame();
