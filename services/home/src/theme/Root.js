import React from 'react';
import CookieConsent, {
  Cookies,
  getCookieConsentValue,
} from 'react-cookie-consent';

// Default implementation, that you can customize
export default function Root({children}) {
  return (
    <>
      <CookieConsent
        cookieName="CookieConsent"
        location="bottom"
        visible="byCookieValue"
        hideOnAccept={true}
        buttonText="I understand"
        debug={false}
        expire={395}
        sameSite="strict"
        disableStyles={true}
        containerClasses="glue-cookie-notification-bar"
        contentClasses="glue-cookie-notification-bar__text"
        buttonClasses="glue-cookie-notification-bar__accept"
      >
        Privacy Sandbox Demos website uses{' '}
        <a
          href="https://policies.google.com/technologies/cookies"
          target="_blank"
        >
          cookies
        </a>{' '}
        from Google to deliver and enhance the quality of its services and to
        analyze traffic.
      </CookieConsent>
      {children}
    </>
  );
}
