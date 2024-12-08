const DEBUG = false
// const MYSUBDOMAIN = 'https://onesignal-proxy.username.workers.dev'
const osCdnUrl = 'https://cdn.onesignal.com'
const osMainUrl = 'https://onesignal.com'
const osImgUrl = 'https://img.onesignal.com'
const cdkRealName = 'OneSignalSDK'
const cdkFakeName = 'TwoSignalSDK'
const regexSDKFile = new RegExp(cdkRealName + '([\\S]*)\\.js', 'g')
const regexCdnUrl = new RegExp(osCdnUrl, 'g')
const regexMainUrl = new RegExp(osMainUrl, 'g')
const regexImgUrl = new RegExp(osImgUrl, 'g')

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      )
    }

    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function gatherResponse(response) {
  return await response.text()
}

function prepareFromUserHeaders(userIP = '', curHeaders) {
  let headers = {}
  headers['X-Forwarded-For'] = userIP
  headers['X-ProxyUser-Ip'] = userIP
  for (let pair of curHeaders) {
    if (pair[0].toUpperCase() === 'HOST') {
    } else {
      headers[pair[0].toUpperCase()] = pair[1]
    }
  }
  return headers
}

function prepFetchInit(userRequest, cfProp = {}) {
  const userHeaders = prepareFromUserHeaders(
    userRequest.headers.get('CF-Connecting-IP'),
    userRequest.headers.entries(),
  )
  if (DEBUG) {
    cfProp = { cacheTt: 0 }
  }
  return {
    cf: cfProp,
    method: userRequest.method,
    headers: userHeaders,
    body: userRequest.body,
    redirect: 'manual',
  }
}

async function handleEvent(event) {
  const urlFull = event.request.url
  let urlPath = urlFull.replace(/^.*\/\/[^\/]+/, '')

  //routes
  //https://cdn.onesignal.com/sdks/
  if (urlPath.startsWith('/sdks/')) {
    urlPath = urlPath.replace(cdkFakeName, cdkRealName)
    if (
      event.request.method === 'GET' &&
      (urlPath.includes('js') || urlPath.includes('css')) &&
      !urlPath.includes('map')
    ) {
      const resp = await fetch(osCdnUrl + urlPath, prepFetchInit(event.request))
      let bodyText = await gatherResponse(resp)

      bodyText = bodyText.replace(regexCdnUrl, MYSUBDOMAIN)
      bodyText = bodyText.replace(regexMainUrl, MYSUBDOMAIN)
      bodyText = bodyText.replace(regexSDKFile, function (_match, group) {
        group = group ?? ''
        return cdkFakeName + group + '.js'
      })

      return new Response(bodyText, resp)
    } else {
      const resp = await fetch(osCdnUrl + urlPath, prepFetchInit(event.request))
      return new Response(resp.body, resp)
    }
  }
  //https://onesignal.com/api/
  else if (urlPath.startsWith('/api/')) {
    const resp = await fetch(osMainUrl + urlPath, prepFetchInit(event.request))
    const resContType = resp.headers.get('Content-Type') || ''
    if (resContType.includes('javascript') || resContType.includes('json')) {
      let bodyText = await gatherResponse(resp)
      bodyText = bodyText.replace(regexImgUrl, MYSUBDOMAIN + '/osimg')
      return new Response(bodyText, resp)
    }
    return new Response(resp.body, resp)
  }

  //https://img.onesignal.com/
  else if (urlPath.startsWith('/osimg/')) {
    const resp = await fetch(
      osImgUrl + urlPath.replace('/osimg', ''),
      prepFetchInit(event.request, { cacheTt: 2592000 }),
    )
    let respToUser = new Response(resp.body, resp)
    respToUser.headers.delete('Cache-Control')
    respToUser.headers.set('Cache-Control', 'public, max-age=2678400')
    if (urlPath.includes('png')) {
      respToUser.headers.set('Content-Type', 'image/png')
    }
    return respToUser
  } else {
    return new Response('NOT FOUND', { status: 404 })
  }
}
