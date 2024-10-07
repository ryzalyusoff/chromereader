import * as impactheroModule from '/javascripts/impacthero_background.js';
impactheroModule.initialize();

import '/javascripts/libs/safe-browsing.js';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == 'safe-browsing-agreement') {
    // Store and remember user's click stream consent
    chrome.storage.local.set({ safe_browsing: request.agreement });
    chrome.storage.local.set({ permissionsGranted: request.agreement });
  } else if (request.action == 'safe-browsing-start') {
    globalThis.safeBrowsing().then((service) => service.enable());
  } else {
  }
});
chrome.storage.local.get(function (storage) {
  if (typeof storage.safe_browsing !== 'undefined' && storage.safe_browsing == true) {
    if (storage.safe_browsing == true) {
      globalThis.safeBrowsing().then((service) => service.enable());
    }
  }
});

// Open reader
function startChromeReader(tab) {
  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: [
      'javascripts/readability.js',
      'javascripts/jquery-3.4.1.min.js',
      'javascripts/screenfull.min.js',
      'javascripts/articulate.min.js',
      'javascripts/app.js',
    ],
  });
}

// Listen for the extension's click
chrome.action.onClicked.addListener((tab) => {
  startChromeReader(tab);
});

// Create contextMenu for user text selection
/*
chrome.contextMenus.create({
  id: "view-selection",
  title: "View this selection in ReaderMode",
  contexts:["selection"]
});
*
/

// Create contextMenu for when user want to link with CR automatically
/*
linkCMId = chrome.contextMenus.create({
  id: "view-linked-page",
  title: "View the linked page using ReaderMode",
  contexts:["link"]
});
*/
/*
chrome.contextMenus.onClicked.addListener(function (clickData) {
  if (clickData.menuItemId == "view-selection") {
    chrome.tabs.query({ active: true }, function(tabs) {
      let tab = tabs[0];
      startChromeReader(tab);
    });
  } else if(clickData.menuItemId == "view-linked-page" && clickData.linkUrl) {
    chrome.tabs.create(
      { url: clickData.linkUrl, active: false },
      function(newTab) {
        startChromeReader(newTab);
      }
    );
  } else {
  }
});
*/

// Listen for the keyboard shortcut
/*
chrome.commands.onCommand.addListener(function(command) {
  if(command == "start-chrome-reader") {
    startChromeReader(tab);
  }
});
*/

// AutoRun setting if url match saved rules
chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  if (info.status === 'complete') {
    var url = new URL(tab.url);
    var protocol = url.protocol; // http: or https:
    var domain = url.hostname; // domain name
    var pathname = url.pathname.substring(1); // use substring to remove '/' at the beginning

    chrome.storage.sync.get(['cr_auto_run_rules'], function (result) {
      let default_val = result.cr_auto_run_rules;
      if (default_val) {
        rules = JSON.parse(default_val);

        for (var key in rules) {
          var id = rules[key]['id'];

          var domain_is = rules[key]['domain_name_is'];
          var url_is = rules[key]['url_is'];
          var url_is_not = rules[key]['url_is_not'];
          var url_contains = rules[key]['url_contains'];
          var url_does_not_contain = rules[key]['url_does_not_contain'];
          var url_starts_with = rules[key]['url_starts_with'];
          var url_ends_with = rules[key]['url_ends_with'];
          var url_rule_in_sentence = rules[key]['url_rule_in_sentence'];

          if (
            domain_is != '' &&
            url_is != '' &&
            url_is_not != '' &&
            url_contains != '' &&
            url_contains != '' &&
            url_does_not_contain != '' &&
            url_starts_with != '' &&
            url_ends_with != ''
          ) {
            if (
              domain == domain_is &&
              url == url_is &&
              url != url_is_not &&
              pathname.indexOf(url_contains) > -1 &&
              pathname.indexOf(url_does_not_contain) === -1 &&
              pathname.startsWith(url_starts_with) &&
              pathname.endsWith(url_ends_with)
            ) {
              startChromeReader(tab);
            }
          } else if (
            domain_is != '' &&
            url_is != '' &&
            url_is_not != '' &&
            url_contains != '' &&
            url_contains != '' &&
            url_does_not_contain != '' &&
            url_starts_with != ''
          ) {
            if (
              domain == domain_is &&
              url == url_is &&
              url != url_is_not &&
              pathname.indexOf(url_contains) > -1 &&
              pathname.indexOf(url_does_not_contain) === -1 &&
              pathname.startsWith(url_starts_with)
            ) {
              startChromeReader(tab);
            }
          } else if (
            domain_is != '' &&
            url_is != '' &&
            url_is_not != '' &&
            url_contains != '' &&
            url_contains != '' &&
            url_does_not_contain != ''
          ) {
            if (
              domain == domain_is &&
              url == url_is &&
              url != url_is_not &&
              pathname.indexOf(url_contains) > -1 &&
              pathname.indexOf(url_does_not_contain) === -1
            ) {
              startChromeReader(tab);
            }
          } else if (domain_is != '' && url_is != '' && url_is_not != '' && url_contains != '' && url_contains != '') {
            if (domain == domain_is && url == url_is && url != url_is_not && pathname.indexOf(url_contains) > -1) {
              startChromeReader(tab);
            }
          } else if (domain_is != '' && url_is != '' && url_is_not != '') {
            if (domain == domain_is && url == url_is && url != url_is_not) {
              startChromeReader(tab);
            }
          } else if (domain_is != '' && url_is != '') {
            if (domain == domain_is && url == url_is) {
              startChromeReader(tab);
            }
          } else if (domain_is != '') {
            if (domain == domain_is) {
              startChromeReader(tab);
            }
          } else {
          }
        }
      }
    });
  }
});
