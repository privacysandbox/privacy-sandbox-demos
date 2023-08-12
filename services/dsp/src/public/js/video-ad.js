(async () => {
    const data = {
        adVastUrl: 'https://pubads.g.doubleclick.net/gampad/ads?' +
        'iu=/21775744923/external/single_ad_samples&sz=640x480&' +
        'cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&' +
        'gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&' +
        'impl=s&correlator=',
    }
    window.top.postMessage(JSON.stringify(data), '*')
})()
