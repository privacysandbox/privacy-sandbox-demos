function simulatePayment(message) {
  if (window.opener) {
    window.opener.postMessage(message, '*');
    window.close();
  } else {
    console.log('Opener window is not available.');
  }
}
