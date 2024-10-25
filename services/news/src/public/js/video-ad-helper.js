/*
 Copyright 2022 Google LLC

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
 * Where is this script used:
 *   This script is included on publisher pages to help deliver video ads.
 *
 * What does this script do:
 *   This library is responsible for interpreting ad-tech's VAST XML responses
 *   to video ad requests and configuring the video player on the page.
 *
 * Source: https://github.com/googleads/googleads-ima-html5
 */

window.PSDemo = window.PSDemo || {};

window.PSDemo.VideoAdHelper = (() => {
  let adsManager;
  let adsLoader;
  let adDisplayContainer;
  let intervalTimer;
  let isAdPlaying;
  let isContentFinished = false;
  let playButton;
  let videoContent;
  let adsCompleted = false;
  let isVideoLoaded = false;

  /** Sets up IMA ad display container, ads loader, and makes an ad request. */
  const setUpIMA = async (vastXml) => {
    if (!vastXml) {
      return console.log('[PSDemo] No VAST XML provided.');
    }
    // Create the ad display container.
    createAdDisplayContainer();
    // Create ads loader.
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);
    // Listen and respond to ads loaded and error events.
    adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false,
    );
    adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
      false,
    );
    // An event listener to tell the SDK that our content video
    // is completed so the SDK can play any post-roll ads.
    const contentEndedListener = function () {
      // An ad might have been playing in the content element, in which case the
      // content has not actually ended.
      if (isAdPlaying) return;
      isContentFinished = true;
      adsLoader.contentComplete();
    };
    videoContent.onended = contentEndedListener;
    const adsRequest = new google.ima.AdsRequest();
    // Set ad to provided VAST XML, which is either a URL representing the XML
    // or the XML text itself.
    if (vastXml.startsWith('https')) {
      adsRequest.adTagUrl = vastXml;
    } else {
      adsRequest.adsResponse = vastXml;
    }
    // Specify the linear and nonlinear slot sizes. This helps the SDK to
    // select the correct creative if multiple are returned.
    adsRequest.linearAdSlotWidth = 640;
    adsRequest.linearAdSlotHeight = 400;
    adsRequest.nonLinearAdSlotWidth = 640;
    adsRequest.nonLinearAdSlotHeight = 150;
    adsLoader.requestAds(adsRequest);
  };

  /** Sets the 'adContainer' div as the IMA ad display container. */
  function createAdDisplayContainer() {
    // We assume the adContainer is the DOM id of the element that will house
    // the ads.
    adDisplayContainer = new google.ima.AdDisplayContainer(
      document.getElementById('adContainer'),
      videoContent,
    );
  }

  /** Loads the video content and initializes IMA ad playback. */
  const playContentMaybeAds = () => {
    if (!isVideoLoaded) {
      // Initialize the container. Must be done through a user action on mobile
      // devices. But load the video only once.
      videoContent.load();
      isVideoLoaded = true;
    }
    if (!adsManager || adsCompleted) {
      // Play content if adsManager isn't initialized or finished.
      videoContent.paused ? videoContent.play() : videoContent.pause();
      return;
    }
    if (isAdPlaying) {
      // If ad is currently playing, then ignore user's request.
      return;
    }
    if (adDisplayContainer) {
      adDisplayContainer.initialize();
    }
    try {
      // Initialize the ads manager. Ad rules playlist will start at this time.
      adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
      // Call play to start showing the ad. Single video and overlay ads will
      // start at this time; the call will be ignored for ad rules.
      adsManager.start();
    } catch (adError) {
      // An error may be thrown if there was a problem with the VAST response.
      videoContent.paused ? videoContent.play() : videoContent.pause();
    }
  };

  /** Handles the ad manager loading and sets ad event listeners. */
  const onAdsManagerLoaded = (adsManagerLoadedEvent) => {
    // Get the ads manager.
    const adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    // videoContent should be set to the content video element.
    adsManager = adsManagerLoadedEvent.getAdsManager(
      videoContent,
      adsRenderingSettings,
    );
    // Add listeners to the required events.
    adsManager.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
    );
    adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
      onContentPauseRequested,
    );
    adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
      onContentResumeRequested,
    );
    adsManager.addEventListener(
      google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
      onAdEvent,
    );
    // Listen to any additional events, if necessary.
    adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdEvent);
    console.log('[PSDemo] Video ad loaded in player.');
  };

  /** Handles actions taken in response to ad events. */
  const onAdEvent = (adEvent) => {
    console.log('[PSDemo] Received video ads manager event', {adEvent});
    // Retrieve the ad from the event. Some events (for example,
    // ALL_ADS_COMPLETED) don't have ad object associated.
    const ad = adEvent.getAd();
    switch (adEvent.type) {
      case google.ima.AdEvent.Type.LOADED:
        // This is the first event sent for an ad - it is possible to
        // determine whether the ad is a video ad or an overlay.
        if (!ad.isLinear()) {
          // Position AdDisplayContainer correctly for overlay.
          // Use ad.width and ad.height.
          videoContent.play();
        }
        break;
      case google.ima.AdEvent.Type.STARTED:
        // This event indicates the ad has started - the video player
        // can adjust the UI, for example display a pause button and
        // remaining time.
        if (ad.isLinear()) {
          // For a linear ad, a timer can be started to poll for
          // the remaining time.
          intervalTimer = setInterval(function () {
            // Example: const remainingTime = adsManager.getRemainingTime();
          }, 300); // every 300ms
        }
        break;
      case google.ima.AdEvent.Type.COMPLETE:
        // This event indicates the ad has finished - the video player
        // can perform appropriate UI actions, such as removing the timer for
        // remaining time detection.
        if (ad.isLinear()) {
          clearInterval(intervalTimer);
        }
        break;
      case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
        // This event indicates that all ads have finished playing. Flip flag
        // to indicate completion which simplifies the checks for play / pause.
        adsCompleted = true;
        break;
    }
  };

  /** Handles ad errors. */
  const onAdError = (adErrorEvent) => {
    // Handle the error logging.
    console.log(
      '[PSDemo] Video ads manager encountered an error',
      adErrorEvent.getError(),
    );
    adsManager.destroy();
  };

  /** Pauses video content and sets up ad UI. */
  const onContentPauseRequested = () => {
    isAdPlaying = true;
    videoContent.pause();
    // This function is where you should setup UI for showing ads (for example,
    // display ad timer countdown, disable seeking and more.)
    // setupUIForAds();
  };

  /** Resumes video content and removes ad UI. */
  const onContentResumeRequested = () => {
    isAdPlaying = false;
    if (!isContentFinished) {
      videoContent.play();
    }
    // This function is where you should ensure that your UI is ready
    // to play content. It is the responsibility of the Publisher to
    // implement this function when necessary.
    // setupUIForContent();
  };

  /** Initializes IMA setup. */
  (() => {
    videoContent = document.getElementById('videoContent');
    if (!videoContent) {
      console.log('[PSDemo] No video content found.');
      return;
    }
    playButton = document.getElementById('playButton');
    if (playButton) {
      playButton.addEventListener('click', playContentMaybeAds);
      console.log('[PSDemo] Video content initialized.');
    } else {
      console.log('[PSDemo] Play button for video not found.');
    }
  })();

  // Exported members of VideoAdHelper
  return {
    setUpIMA,
  };
})();
