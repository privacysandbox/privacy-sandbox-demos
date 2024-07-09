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

(() => {
    window.fence.reportEvent({
        'eventType': 'impression',
        'destination': [
            'buyer',
            'seller',
            'component-seller',
        ],
    });
    window.fence.setReportEventDataForAutomaticBeacons({
        'eventType': 'reserved.top_navigation_start',
        'eventData': '{"event": "top_navigation_start"}',
        'destination': [
            'seller',
            'buyer',
            'component-seller',
        ],
    });
    window.fence.setReportEventDataForAutomaticBeacons({
        'eventType': 'reserved.top_navigation_commit',
        'eventData': '{"event": "top_navigation_commit"}',
        'destination': [
            'seller',
            'buyer',
            'component-seller',
        ],
    });
})();
