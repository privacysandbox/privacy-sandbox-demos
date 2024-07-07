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
