let cardRegistered = false;

async function registerCard() {
  let lastDigits = document.getElementById('cardnumber').value.slice(-4);

  await window.sharedStorage.clear();
  await window.sharedStorage.set('lastDigits', lastDigits);

  var button = document.getElementById('demo-button');

  cardRegistered = true;
  button.innerHTML = 'Card Registered!';
  button.style.backgroundColor = '#3bd897';
  button.style.color = 'white';

  setTimeout(function () {
    resetButton();
  }, 2000);
}

function resetButton() {
  if (cardRegistered) {
    var button = document.getElementById('demo-button');

    button.innerHTML = 'Update Card Number';
    button.style.backgroundColor = 'white';
    button.style.color = '#3bd897';
  }
}
