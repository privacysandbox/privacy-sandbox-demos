/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * This script is used on service-provider index page
 * It is used to storage last four digits of credit card in shared storage
 */

let cardRegistered = false;
let errorVisible = false;

async function registerCard() {
  let cardNumber = document.getElementById('cardnumber').value;

  if (!/^[0-9\s]{13,19}$/.test(cardNumber)) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = 'Invalid card number format.';
    errorMessage.style.display = 'inline-block';
    errorVisible = true;
    return;
  }

  let lastDigits = cardNumber.slice(-4);

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

  if (errorVisible) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }
}
