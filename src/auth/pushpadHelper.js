import fetch from 'isomorphic-fetch';

export const initPushpad = (uid, username, token) => {
  const { PUSHPAD_PROJECT_ID, BUSYPUSH_ENDPOINT } = process.env;

  if (!(window && window.Worker)) { // eslint-disable-line
    return;
  }

  fetch(`${BUSYPUSH_ENDPOINT}/api/getSignature`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uid,
      username,
      token,
    }),
  })
    .then(jsonRes => jsonRes.json())
    .then((res) => {
      if (!(res && res.isValid)) {
        return;
      }

      const { signatureId } = res;

      // code is generated by pushpad
      /* eslint-disable */
      (function(p,u,s,h,x) {
        p.pushpad = p.pushpad || function() {
          (p.pushpad.q = p.pushpad.q || []).push(arguments)
        };
        h = u.getElementsByTagName('head')[0];
        x = u.createElement('script');
        x.async = 1;
        x.src = s;
        h.appendChild(x);
      })(window,document, 'https://pushpad.xyz/pushpad.js');

      pushpad('init', PUSHPAD_PROJECT_ID);
      pushpad('uid', `${uid}`, signatureId);
      pushpad('subscribe', (isSubscribed) => {
        if (!isSubscribed) {
          return;
        }

        // subscribe username in busy-push to check for its activities in Steem blockchain
        fetch(`${BUSYPUSH_ENDPOINT}/api/subscribe`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uid,
            username,
            token,
          }),
        })
      });
      /* eslint-enable */
    }).catch((err) => {
      console.log(err);
    });
}
