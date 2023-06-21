# 🔛 `onesignal-proxy` Proxy for OneSignal Web Push service on Cloudflare Workers.

Some users use ad blockers that block the domain name of the OneSignal Web Push.  
In this case, these users will not receive notifications and service worker not init on site (critical if you use additional service worker).  
This worker proxy requests from WEB users to OneSignal Web Push SDK backend via Cloudflare Workers and your domain name.

[`index.js`](https://github.com/verificatorrus/onesignal-proxy/blob/master/index.js) is the content of the proxy script.  
[`wrangler.toml`](https://github.com/verificatorrus/onesignal-proxy/blob/master/wrangler.toml) is the content of the proxy configuration.

## Requirements

✅ You need to have Cloudflare [registration](https://dash.cloudflare.com/login)  
✅ You need to have OneSignal [registration](https://dash.cloudflare.com/login)

Example configuration for domain **https://yourdomain.com** and proxy setup **https://onesignal.username.workers.dev** don't forget change them, to your real domain name.


### Setup proxy via Cloudflare dashboard

#### Create worker in dashboard

[Create a Worker](https://dash.cloudflare.com/?account=workers)  
✅ Edit name:

```
onesignal-proxy
```

✅ Remove existing code from **Script** field  
✅ Copy code from [`index.js`](https://github.com/verificatorrus/onesignal-proxy/blob/master/index.js) and paste to **Script** field  
✅ Uncomment line 2 and edit it with the worker domain that Cloudflare provides you with

```
const MYSUBDOMAIN = 'https://onesignal-proxy.username.workers.dev'
```
<img src="https://raw.githubusercontent.com/verificatorrus/onesignal-proxy/master/create-worker-dashboard.png"  width="320">


### Edit files on your hosting

#### Edit OneSignal init script address in site pages

```html
<head>
  <script
    src="https://onesignal-proxy.username.workers.dev/sdks/OneSignalSDK.js"
    async=""
  ></script>
  <script>
    var OneSignal = window.OneSignal || []
    OneSignal.push(function() {
      OneSignal.init({
        appId: 'YOUR_APP_ID',
        notifyButton: {
          enable: true,
        },
      })
      OneSignal.showNativePrompt()
    })
  </script>
</head>
```

#### Edit https://yoursite.com/OneSignalSDKWorker.js

```javascript
importScripts('https://onesignal-proxy.username.workers.dev/sdks/OneSignalSDK.js')
```

🎉 DONE!

https://dash.cloudflare.com/?account=workers

### Alternative: Publish via Cloudflare Wrangler

#### Install [wrangler](https://github.com/cloudflare/wrangler)

```
npm i @cloudflare/wrangler -g
```

#### Configure wrangler

```
wrangler config
```

#### Setup wrangler configuration file

Edit file [`wrangler.toml`](https://github.com/verificatorrus/onesignal-proxy/blob/master/wrangler.toml)

Setup **account_id** and **zone_id** from [Cloudflare dashboard](https://dash.cloudflare.com/?zone=)

Setup **route** and **vars**: with your domain:

```
route = "https://onesignal.example.com/*"
vars = { MYDOMAIN = "https://onesignal.example.com"}
```

#### Publish to cloudflare

```
wrangler publish
```

🎉 DONE!
