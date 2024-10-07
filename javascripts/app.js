// Theme settings
var cr_background_color_light, cr_background_color_dark;
var cr_text_color_light, cr_text_color_dark;
var cr_link_color_light, cr_link_color_dark;

// Encode/Decode HTML based on LZW compression
function compressHTML(c){var x='charCodeAt',b,e={},f=c.split(""),d=[],a=f[0],g=256;for(b=1;b<f.length;b++)c=f[b],null!=e[a+c]?a+=c:(d.push(1<a.length?e[a]:a[x](0)),e[a+c]=g,g++,a=c);d.push(1<a.length?e[a]:a[x](0));for(b=0;b<d.length;b++)d[b]=String.fromCharCode(d[b]);return d.join("")}
function decompressHTML(b){var a,e={},d=b.split(""),c=f=d[0],g=[c],h=o=256;for(b=1;b<d.length;b++)a=d[b].charCodeAt(0),a=h>a?d[b]:e[a]?e[a]:f+c,g.push(a),c=a.charAt(0),e[o]=f+c,o++,f=a;return g.join("")}

// Check if string is empty
function isEmpty(value) {
  return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
}

// Toggle display outline
function outlineDisplayToggle(doc) {
  var outline = $(doc).find("#cr-outline");

  // Hide Sidebar when the first page reload if mobile
  var width = $(window).width();

  if(width <= 1280){
    $(outline).hide();
    $(outline).css('width', '0');
  } else {
    $(outline).show();
    outline.css('width', '250px');
  }

  // Hide Sidebar when the first page reload if resized
  $(window).resize(function() {
    width = $(window).width();
    if(width <= 1280){
      $(outline).hide();
      $(outline).css('width', '0');
    } else {
      $(outline).show();
      $(outline).css('width', '250px');
    }
  });
}

// Return preloader html
function getPreloader(){
  var preloader = `<div id='cr-pre-loader' style='
      width: 250px;
      height: 100px;
      text-align: center;
      font-family: "Helvetica Neue";
      font-weight: 200;
      color: #c1c1c1;
      letter-spacing: 0.5;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      -ms-transform: translate(-50%, -50%); /* for IE 9 */
      -webkit-transform: translate(-50%, -50%); /* for Safari */
    '>
      <style>
        @keyframes pulse {
          0% { transform: scale(0.95);box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.3); }
          70% { transform: scale(1);box-shadow: 0 0 0 10px rgba(0, 0, 0, 0); }
          100% { transform: scale(0.95);box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
        }
      </style>
      <div class="blobs-container text-center" style="margin: 0px auto;margin-bottom: 30px;width: 50px;">
        <div class="blob" style="
          background: #dddddd;
          border-radius: 50%;
          margin: 10px;
          height: 20px;
          width: 20px;
          box-shadow: 0 0 0 0 rgba(0, 0, 0, 1);
          transform: scale(1);
          animation: pulse 2s infinite;"
        >
        </div>
      </div>
      <p>Fetching relevant contents...</p>
    </div>`;

  return preloader
}

// Added pre-loader
function startPreloader(doc){
  //pulse_preloader_url = chrome.runtime.getURL('assets/images/pulse-preloader.svg');
  preloader = getPreloader();
  $(doc).find("body").prepend(preloader);
}

function startSafeBrowsing(doc){
  //pulse_preloader_url = chrome.runtime.getURL('assets/images/pulse-preloader.svg');
  safeBrowsingAgreement = getSafeBrowsingAgreement();
  $(doc).find("body").prepend(safeBrowsingAgreement);
}

// Create iframe
function createIframe(){
  var iframe = document.createElement('iframe');
  iframe.id = "cr-iframe";
  iframe.style.height = "100%";
  iframe.style.width="100%";
  iframe.style.position = "fixed";
  iframe.style.top = "0px";
  iframe.style.right = "0px";
  iframe.style.zIndex = "9000000000000000000";
  iframe.frameBorder = "none";
  iframe.style.backgroundColor = "#fff";

  preloader = getPreloader();
  $(iframe).contents().find('body').html(preloader);

  return iframe;
}

/* Get HTML Of Selected Text */
function getHTMLOfSelection () {
  var range;
  if (document.selection && document.selection.createRange) {
    range = document.selection.createRange();
    return range.htmlText;
  }
  else if (window.getSelection) {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      var clonedSelection = range.cloneContents();
      var div = document.createElement('div');
      div.appendChild(clonedSelection);
      return div.innerHTML;
    }
    else {
      return '';
    }
  }
  else {
    return '';
  }
}

// Parse the article
function getParsedArticle(){
  var loc = document.location;
  var uri = {
    spec: loc.href,
    host: loc.host,
    prePath: loc.protocol + "//" + loc.host,
    scheme: loc.protocol.substr(0, loc.protocol.indexOf(":")),
    pathBase: loc.protocol + "//" + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf("/") + 1)
  };

  var doc_to_parse;

  selected_text = getHTMLOfSelection();
  if(selected_text != "") {
    doc_to_parse = new DOMParser().parseFromString(selected_text, "text/html");
  } else {
    /*
    * Readability's parse() works by modifying the DOM. This removes some elements in the web page.
    * So to avoid this, we are passing the clone of the document object while creating a Readability object.
    */
    doc_to_parse = document.cloneNode(true);
  }

  var article = new Readability(uri, doc_to_parse).parse();

  return article;
}

// Remove unnecassary stuffs from content
function trimContent(doc){
  $(doc).find("#cr-content span:contains('Image copyright')").css("display","none");
  $(doc).find("#cr-content figcaption").css("display","none");
}

// Turn title/text into url friendly slug
function slugify(text){
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Set Outline list
function setOutline(doc, article) {
  if (article.title && article.title != "") {
    $(doc).find("#cr-outline-list").append("<li><a href='#cr-title'>"+article.title+"</a></li>");
  }
  $(article.content).find("h1, h2, h3, h4, h5, h6").each(function(){
    var heading = $(this).text();
    var slug = slugify(heading);
    $(doc).find("#cr-outline-list").append("<li><a href='#"+slug+"'>"+heading+"</a></li>");
  });
}

// Set slug to headings for outline list
function setHeadingsForOutline(doc){
  $(doc).find("h1, h2, h3, h4, h5, h6").each(function(){
    var heading = $(this).text();
    var slug = slugify(heading);

    if ( $(this).attr("id") != "cr-title" ) {
      $(this).attr("id", slug)
    }
  });
}

// Add styletag to iframe
function addStyleTags(doc){
  style_url = chrome.runtime.getURL("styles/app.css");
  $(doc).find('head').append("<link rel='stylesheet' type='text/css' href='"+style_url+"'>");

  style_url = chrome.runtime.getURL("styles/base.css");
  $(doc).find('head').append("<link rel='stylesheet' type='text/css' href='"+style_url+"'>");

  style_url = chrome.runtime.getURL("styles/options-panel.css");
  $(doc).find('head').append("<link rel='stylesheet' type='text/css' href='"+style_url+"'>");

  style_url = chrome.runtime.getURL("styles/fontawesome-all.css");
  $(doc).find('head').append("<link rel='stylesheet' type='text/css' href='"+style_url+"'>");

  style_url = chrome.runtime.getURL("styles/semantic.css");
  $(doc).find('head').append("<link rel='stylesheet' type='text/css' href='"+style_url+"'>");
}

// Removes the .active CSS class from all spans.
function clearHighlight(doc) {
  $(doc).find("span[data-count]").removeClass("active");
}

/*
* This allows us to highlight the currently spoken word, by refering to the respective span via the onboundary events charIndex property.
* This function should be called once on the initial pageload and whenever the text changes.
*/
function articulateTextChanged(doc) {
  var counter = 0;
  var elements = $(doc).find("#cr-content-container").find("p, h1, h2, h3, h4, h5, h6");
  $(elements).each(function(index, elem){
    $(this).attr("id", "elem-"+index);

    elem = $(elem).html();
    var text = elem.replace(/<[^>]*>/g, "");
    text = text.split(" ");
    var wrappedText = [];
    for (i = 0; i < text.length; i++) {
      var word = text[i].trim();
      var inc = word.length + 1;

      var element_name = $(this).prop("tagName");
      if (i == text.length - 1) {
        if (element_name == "H1" || element_name == "H2" || element_name == "H3" || element_name == "H4" || element_name == "H5" || element_name == "H6") {
          if (word.includes(".") == false ) {
            word = word+".";
          }
        }
      }

      word = "<span data-count='" + counter + "'>" + word + "</span>";
      counter += inc;
      wrappedText.push(word);
    }
    wrappedText = wrappedText.join(" ");
    $(doc).find("#elem-"+index).html(wrappedText);
  });
}

//Remove artificial/helper dots
function articulateReset(doc) {
  var counter = 0;
  var elements = $(doc).find("#cr-content-container").find("p, h1, h2, h3, h4, h5, h6");
  $(elements).each(function(index, elem){
    $(this).attr("id", "elem-"+index);

    elem = $(elem).html();
    var text = elem.replace(/<[^>]*>/g, "");
    text = text.split(" ");
    var wrappedText = [];
    for (i = 0; i < text.length; i++) {
      var word = text[i].trim();
      var inc = word.length + 1;

      var element_name = $(this).prop("tagName");
      if (i == text.length - 1) {
        if (element_name == "H1" || element_name == "H2" || element_name == "H3" || element_name == "H4" || element_name == "H5" || element_name == "H6") {
          if (word.includes(".") == true ) {
            word = word.replace(".","");
          }
        }
      }

      word = "<span data-count='" + counter + "'>" + word + "</span>";
      counter += inc;
      wrappedText.push(word);
    }
    wrappedText = wrappedText.join(" ");
    $(doc).find("#elem-"+index).html(wrappedText);
  });
}

//Get status from checkbox
function getCheckboxStatus(checkbox){
  var status;
  if ($(checkbox).is(':checked')) { status = "on"; } else { status = "off"; }
  return status;
}

/*** Delete & Undo Deleted Element ***/
var deleted_elements = [];
var last_element;
function startDeleteElement(doc) {
  var content_container = $(doc).find("#cr-content-container");
  var mouseFunc = function (e) {
    var selected = e.target;

    if (last_element != selected)  {
      if (last_element != null) {
        $(last_element).removeClass("deletion-mode-hovered");
      }

      $(selected).addClass("deletion-mode-hovered");
      last_element = selected;
    }
  }, clickFunc = function(e) {
    e.preventDefault();

    selected = e.target;
    $(selected).removeClass("deletion-mode-hovered");

    let actionObj;
    let parent = selected.parentNode;
    actionObj = {
      "type": "delete",
      "index": Array.from(parent.children).indexOf(selected),
      "parent": parent,
      "elem": parent.removeChild(selected)
    };
    deleted_elements.push(actionObj);
    $(doc).find("#options-delete-element-undo").show();
  }, escFunc = function(e) {
    // Listen for the "Esc" key and exit if so
    if(e.keyCode === 27) {
      exitFunc();
    }
  }, exitFunc = function() {
    $(content_container).off('mouseover', mouseFunc);
    $(content_container).off('click', clickFunc);
    $(doc).off('keydown', escFunc);

    $(doc).find(".deletion-mode-hovered").removeClass("deletion-mode-hovered");
    $(doc).find("#options-delete-element").show();
    $(doc).find("#options-delete-element-stop").hide();
  }

  $(content_container).on('mouseover', mouseFunc);
  $(content_container).on('click', clickFunc);
  $(doc).on('keydown', escFunc);

  $(doc).find("#options-delete-element-stop").click(function(){
    exitFunc();
  });
}
function undoDeletedElement(doc) {
  let actionObj = deleted_elements.pop();

  if(actionObj) {
    actionObj.parent.insertBefore(actionObj.elem, actionObj.parent.children[actionObj.index]);
  }

  if(deleted_elements.length === 0) {
    $(doc).find("#options-delete-element-undo").hide();
  }
}

/*** Toolbar ***/
var selection;
var selectedContent;
var range;
var rect;
function toolbarDisplayToggle(doc) {
  $(doc).find("#cr-content-container").mouseup(function(event) {
    selection = doc.getSelection();

    if ( (selection.type === 'Range') && !$(event.target).hasClass("tlite") && !$(event.target).hasClass("no-close") ) {
      selectedContent = selection.toString();
      range = selection.getRangeAt(0).cloneRange();
      rect = range.getBoundingClientRect();

      showToolbar(rect, doc);
    } else {
      var toolbar_id = "cr-toolbar";
      var parent = $(event.target).parent();
      if ( ($(event.target).attr("id") != toolbar_id) &&
        ($(parent).attr("id") != toolbar_id) &&
        ($(parent).parent().attr("id") != toolbar_id)
      ) {
        $(doc).find("#cr-toolbar").hide();
      }
    }
  });
}

function showToolbar(rect, doc) {
  // toolbar element only create once
  var toolbar = doc.getElementById("cr-toolbar");

  // caculate the position of toolbar
  var toolbarWidth = toolbar.offsetWidth;
  var toolbarHeight = toolbar.offsetHeight;
  //toolbar.style.left = `${(rect.right - rect.left) / 2 + rect.left - toolbarWidth / 2}px`;
  //toolbar.style.top = `${rect.top - toolbarHeight - 4 + doc.body.scrollTop}px`;

  //toolbar.style.top = `${rect.top - toolbarHeight - 50 + doc.body.scrollTop}px`;
  //toolbar.style.left = `calc(${rect.left}px - 30%)`;

  toolbar.style.left = (window.pageXOffset + rect.x + (rect.width - $(toolbar).width()) / 2)/2;
  toolbar.style.top = `${rect.top - toolbarHeight - 50 + doc.body.scrollTop}px`;

  $(toolbar).show();
}

function toolbarActionsHandler(doc){
  // Share to Twitter
  $(doc).find("#cr-toolbar-share-twitter").click(function(){
    if (selectedContent != ""){
      shareTwitter(selectedContent);
    } else {
      alert("Text cannot be empty!");
    }
  });
}

// Toggle accordian content
function optionsAccordian(doc){
  $(doc).find("#options-main-panel .options-panel-header").click(function(){
    if ( $(this).next().is(":visible") ) {
      original_state = "visible";
    } else {
      original_state = "hidden";
    }

    $(doc).find("#options-main-panel .options-panel-header").removeClass("active");
    $(doc).find("#options-main-panel .options-panel-content").removeClass("active");
    $(doc).find("#options-main-panel .options-panel-content").hide();

    if ( original_state == "visible" ) {
      $(this).removeClass("active");
      $(this).next().removeClass("active");
      $(this).next().slideUp(500);
    } else {
      $(this).addClass("active");
      $(this).next().addClass("active");
      $(this).next().slideDown(500);
    }
  });
}

// Colorpicker input field handler
function optionsColorPicker(doc){
  $(doc).on('change', 'input[type=color]', function() {
    $(this.parentNode).next().val($(this).val());
    this.parentNode.style.backgroundColor = this.value;
  });
}

function readingTime(text) {
  var wordsPerMinute = 200;
  var noOfWords = text.split(/\s/g).length;
  var minutes = noOfWords / wordsPerMinute;
  var readTime = Math.ceil(minutes);
  //var `${readTime} minute read`;
  //if (readTime == 0) || (readTime == 1) {
  //  return readTime + " minute read";
  //} else{
  //  return readTime + " minutes read";
  //}

  return readTime;
}

function shareTwitter(text) {
  var twitter_url = "https://twitter.com/intent/tweet?text=";
  var current_url = window.location.href;
  selectedText = text;
  selectedText = encodeURIComponent(text);
  var share_text = '"'+selectedText+'" - ' + current_url + ' via @readermode';
  popupwindow(twitter_url + share_text, 'Share', 550, 295);
}

function popupwindow(url, title, w, h) {
  let left = screen.width / 2 - w / 2;
  let top = screen.height / 2 - h / 2;
  return window.open(
    url,
    title,
    'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' +
      w +
      ', height=' +
      h +
      ', top=' +
      top +
      ', left=' +
      left
  );
}

// Get encoded current url
function getEncodedCurrentURL(){
  var current_url = window.location.href;
  var encodedURL = btoa(current_url);

  return encodedURL;
}

// Save current page
function savePage(doc) {
  $(doc).find("#cr-saved-notice").html("<span class='loading-dots'>Saving</span>...").show();
  $(doc).find("#options-saved-panel .loading-status").html("<span class='loading-dots'>Saving</span>...").fadeIn("Show");
  $(doc).find("#options-saved-panel").show();

  // Get encoded current url
  encodedURL = getEncodedCurrentURL();

  //Compress current_html & save as backup in storage
  current_html = $(doc).find("#cr-content-wrapper").html();
  var compressed_html = compressHTML(current_html);
  chrome.storage.local.set({
    //Use encodedURL as the key
    [encodedURL]: compressed_html
  });

  // Saved encodedURL to saved_pages list
  var current_page_url = window.location.href;
  var current_page = {
    "url": current_page_url,
    "encodedURL": encodedURL
  };
  pages = [];
  chrome.storage.local.get(['cr_saved_pages'], function(result) {
    let default_val = result.cr_saved_pages;
    if (default_val) {
      pages = JSON.parse(default_val);

      // Loop through json here and only save new page if it's not already in storage
      var page_existed_in_storage = false;
      Object.keys(pages).forEach(function(key){
        if (pages[key]) {
          if(pages[key]["url"]==current_page_url) {
            page_existed_in_storage = true;
          }
        }
      });
      if (page_existed_in_storage == false) {
        pages.push(current_page);
        pages_as_string = JSON.stringify(pages);
        chrome.storage.local.set({cr_saved_pages: pages_as_string});
      }
    } else{
      pages.push(current_page);
      pages_as_string = JSON.stringify(pages);
      chrome.storage.local.set({cr_saved_pages: pages_as_string});
    }

    // Put data-encoded-url to the remove-page link
    $(doc).find(".remove-saved-article").attr("data-encoded-url", encodedURL);

    // Show saved info & status
    $(doc).find("#cr-saved-notice").html("<i class='fas fa-check-circle m-r-3'></i> Saved");
    $(doc).find('#cr-container .saved-version-notice').fadeIn();
    $(doc).find("#options-saved-panel .loading-status").html("<i class='fas fa-check-circle m-r-3'></i> Saved");

    // Hide options-saved-panel
    setTimeout(function(){
      $(doc).find("#options-saved-panel").hide();
      $(doc).find("#options-menu li a").attr("class","tooltip");
    }, 7000);
  });
}

// Save setting's value to storage
function saveStorageValue(storage, val) {
  chrome.storage.sync.set({[storage]: val});
}

/*** Set Settings ***/
function removeInlineElemStyles(doc){
  $(doc).find('#cr-content-container, #cr-body, #cr-content-wrapper').find("p,li,a,h1,h2,h3,h4,h5.h6").css("font-family","");
  $(doc).find('#cr-content-container, #cr-body, #cr-content-wrapper').find("p,li,a,h1,h2,h3,h4,h5.h6").css("font-size","");
  $(doc).find('#cr-content-container, #cr-body, #cr-content-wrapper').find("p,li,a,h1,h2,h3,h4,h5.h6").css("line-height","");
  $(doc).find('#cr-content-container, #cr-body, #cr-content-wrapper').find("p,li,a,h1,h2,h3,h4,h5.h6").css("letter-spacing","");
  $(doc).find('#cr-content-container, #cr-body, #cr-content-wrapper').find("p,li,a,h1,h2,h3,h4,h5.h6").css("color","");
}
function setFontFamily(doc, val, save) {
  free_fonts = ["Arial","Arial Black","Serif","sans-serif","Times New Roman","Courier New","Courier","OpenDyslexic","Lora","LexendDeca"]
  if(jQuery.inArray(val, free_fonts) == -1) {
    val = "Arial";
  }

  if (save) {
    chrome.storage.sync.set({cr_font_family: val});
  }
  $(doc).find('#cr-content-container').css( "font-family", val );
  $(doc).find(`#options-font-family select option[value='${val}']`).prop('selected', true);
}
function setFontSize(doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_font_size: val});
  }
  $(doc).find("#cr-content-container").css( "font-size", val );
  $(doc).find("#options-font-size input").val(  val );
  $(doc).find("#options-font-size .val").text(  val );
}
function setLineHeight(doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_line_height: val});
  }
  $(doc).find("#cr-content-container").css( "line-height", val );
  $(doc).find("#options-line-height input").val(  val );
  $(doc).find("#options-line-height .val").text(  val );
}
function setLetterSpace(doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_letter_space: val});
  }
  $(doc).find("#cr-content-container").css( "letter-spacing", val );
  $(doc).find("#options-letter-space input").val(  val );
  $(doc).find("#options-letter-space .val").text(  val );
}
function setMaxWidth(doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_max_width: val});
  }
  $(doc).find("#cr-container").css( "max-width", val );
  $(doc).find("#options-max-width input").val(  val );
  $(doc).find("#options-max-width .val").text(  val );
}
function setBackgroundColor(doc, val, theme, save) {
  if (save) {
    if (theme == "cr-theme-light") {
      cr_background_color_light = val;
      chrome.storage.sync.set({cr_background_color_light: val});
    } else if (theme == "cr-theme-dark"){
      cr_background_color_dark = val;
      chrome.storage.sync.set({cr_background_color_dark: val});
    } else {
    }
  }
  $(doc).find("#cr-body").css( "background-color", val );

  $(doc).find("#options-background-color input[name='background_color']").val(  val );
  $(doc).find("#options-background-color input[type='color']").val(  val );
  $(doc).find("#options-background-color label.color").css('background-color', val);
}
function setTextColor(doc, val, theme, save) {
  if (save) {
    if (theme == "cr-theme-light") {
      cr_text_color_light = val;
      chrome.storage.sync.set({cr_text_color_light: val});
    } else if (theme == "cr-theme-dark"){
      cr_text_color_dark = val;
      chrome.storage.sync.set({cr_text_color_dark: val});
    } else {
    }
  }
  $(doc).find("#cr-body").css( "color", val );

  $(doc).find("#options-text-color input[name='text_color']").val(  val );
  $(doc).find("#options-text-color input[type='color']").val(  val );
  $(doc).find("#options-text-color label.color").css('background-color', val);
}
function setLinkColor(doc, val, theme, save) {
  if (save) {
    if (theme == "cr-theme-light") {
      cr_link_color_light = val;
      chrome.storage.sync.set({cr_link_color_light: val});
    } else if (theme == "cr-theme-dark"){
      cr_link_color_dark = val;
      chrome.storage.sync.set({cr_link_color_dark: val});
    } else {
    }
  }
  $(doc).find("#cr-body").find("a").css( "color", val );

  $(doc).find("#options-link-color input[name='link_color']").val(  val );
  $(doc).find("#options-link-color input[type='color']").val(  val );
  $(doc).find("#options-link-color label.color").css('background-color', val);
}
function setTheme(doc, val, save){
  if (save) {
    chrome.storage.sync.set({cr_theme: val});
  }

  $(doc).find("#options-theme ul li a").each(function(){
    if ( $(this).attr("data-theme") == val ) {
      $(this).addClass("active");
    } else {
      $(this).removeClass("active");
    }
  });
  $(doc).find("#cr-body").attr("class", val);

  if (val == "cr-theme-light") {
    setBackgroundColor(doc, cr_background_color_light, "cr-theme-light");
    setTextColor(doc, cr_text_color_light, "cr-theme-light");
    setLinkColor(doc, cr_link_color_light, "cr-theme-light");
  } else if (val == "cr-theme-dark"){
    setBackgroundColor(doc, cr_background_color_dark, "cr-theme-dark");
    setTextColor(doc, cr_text_color_dark, "cr-theme-dark");
    setLinkColor(doc, cr_link_color_dark, "cr-theme-dark");
  } else {
  }
}
function setDisplayOutline(doc, status, save) {
  if (status == "on") {
    $(doc).find('#cr-outline').show();
    $(doc).find('#options-display-outline input').prop("checked", true);
  } else {
    $(doc).find('#cr-outline').hide();
    $(doc).find('#options-display-outline input').prop("checked", false);
  }

  if (save) {
    chrome.storage.sync.set({cr_display_outline: status});
  }
}
function setDisplayImages(doc, status, save) {
  if (status == "on") {
    $(doc).find('#cr-content-container img').show();
    $(doc).find('#options-display-images input').prop("checked", true);
  } else {
    $(doc).find('#cr-content-container img').hide();
    $(doc).find('#options-display-images input').prop("checked", false);
  }
  if (save) {
    chrome.storage.sync.set({cr_display_images: status});
  }
}
function setDisplayMeta(doc, status, save) {
  if (status == "on") {
    $(doc).find('#cr-container #cr-meta').show();
    $(doc).find('#options-display-meta input').prop("checked", true);
  } else {
    $(doc).find('#cr-container #cr-meta').hide();
    $(doc).find('#options-display-meta input').prop("checked", false);
  }
  if (save) {
    chrome.storage.sync.set({cr_display_meta: status});
  }
}
function setDisplayAuthor(doc, status, save) {
  if (status == "on") {
    $(doc).find('#cr-container #cr-meta-author').show();
    $(doc).find('#options-display-author input').prop("checked", true);
  } else {
    $(doc).find('#cr-container #cr-meta-author').hide();
    $(doc).find('#options-display-author input').prop("checked", false);
  }
  if (save) {
    chrome.storage.sync.set({cr_display_author: status});
  }
}
function setDisplayReadingTime(doc, status, save) {
  if (status == "on") {
    $(doc).find('#cr-container #cr-meta-reading-time').show();
    $(doc).find('#options-display-reading-time input').prop("checked", true);
  } else {
    $(doc).find('#cr-container #cr-meta-reading-time').hide();
    $(doc).find('#options-display-reading-time input').prop("checked", false);
  }
  if (save) {
    chrome.storage.sync.set({cr_display_reading_time: status});
  }
}
function setDisplaySavedInfo(doc, status, save) {
  if (status == "on") {
    $(doc).find('#cr-container #cr-saved-info').show();
    $(doc).find('#options-display-saved-info input').prop("checked", true);
  } else {
    $(doc).find('#cr-container #cr-saved-info').hide();
    $(doc).find('#options-display-saved-info input').prop("checked", false);
  }

  if (save) {
    chrome.storage.sync.set({cr_display_saved_info: status});
  }

  encodedURL = getEncodedCurrentURL();
  chrome.storage.local.get(encodedURL, function(result) {
    let default_val = result[encodedURL]
    if (default_val) {
      $(doc).find(".remove-saved-article").attr("data-encoded-url", encodedURL);
      $(doc).find('#cr-container #cr-saved-info .saved-version-notice').show();
    } else {
      $(doc).find('#cr-container #cr-saved-info .saved-version-notice').hide();
    }
  });
}
function setDisplayRuler(doc, status, save) {
  if (status == "on") {
    $(doc).find('#cr-content-container #cr-ruler').show();
    $(doc).find('#options-display-ruler input').prop("checked", true);
  } else {
    $(doc).find('#cr-content-container #cr-ruler').hide();
    $(doc).find('#options-display-ruler input').prop("checked", false);
  }

  if (save) {
    chrome.storage.sync.set({cr_display_ruler: status});
  }
}
function setForPlanet(doc, status, save) {
  if (status == "on") {
    cr_for_planet = "on";
    $(doc).find('#options-for-planet input').prop("checked", true);
  } else {
    cr_for_planet = "off";
    $(doc).find('#options-for-planet input').prop("checked", false);
  }

  console.log("----------------////////////////------------------");
  console.log(cr_for_planet);
  console.log("----------------////////////////------------------");

  if (save) {
    chrome.storage.local.set({cr_for_planet: cr_for_planet});
  }
}
function setRulerColor(doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_ruler_color: val});
  }
  $(doc).find("#cr-content-container #cr-ruler").css( "background-color", val );
  $(doc).find("#options-ruler-color input[name='ruler_color']").val(  val );
  $(doc).find("#options-ruler-color input[type='color']").val(  val );
  $(doc).find("#options-ruler-color label.color").css('background-color', val);
}
function setRulerHeight(doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_ruler_height: val});
  }
  $(doc).find("#cr-content-container #cr-ruler").css( "height", val );
  $(doc).find("#options-ruler-height input").val(  val );
  $(doc).find("#options-ruler-height .val").text(  val );
}
function setRulerPosition(doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_ruler_position: val});
  }
  $(doc).find("#cr-content-container #cr-ruler").css( "top", val+"%" );
  $(doc).find("#options-ruler-position input").val(  val );
  $(doc).find("#options-ruler-position .val").text(  val );
}
function setArticulateVoice(doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_articulate_voice: val});
  }
  $(doc).find("#options-articulate-voice select option[value='"+val+"']").prop("selected", true);
}
function setArticulateRate(doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_articulate_rate: val});
  }
  $(doc).find("#options-articulate-rate input").val(  val );
  $(doc).find("#options-articulate-rate .val").text(  val );
}
function setArticulatePitch(doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_articulate_pitch: val});
  }
  $(doc).find("#options-articulate-pitch input").val(  val );
  $(doc).find("#options-articulate-pitch .val").text(  val );
}
function setArticulateVolume(doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_articulate_volume: val});
  }
  $(doc).find("#options-articulate-volume input").val(  val );
  $(doc).find("#options-articulate-volume .val").text(  val );
}
function setAutoRunRules(doc, val, save) {
  rules_as_string = val;
  if (save) {
    chrome.storage.sync.set({'cr_auto_run_rules': rules_as_string});
  }

  $(doc).find("#options-auto-run-list").html("");

  if (val == "[]") {
    rules = val;
  } else {
    rules = JSON.parse(val);
    for (var key in rules) {
      var id = rules[key]["id"];
      var domain_is = rules[key]["domain_is"];
      var url_is = rules[key]["url_is"];
      var url_is_not = rules[key]["url_is_not"];
      var url_contains = rules[key]["url_contains"];
      var url_does_not_contain = rules[key]["url_does_not_contain"];
      var url_starts_with = rules[key]["url_starts_with"];
      var url_ends_with = rules[key]["url_ends_with"];
      var url_rule_in_sentence = rules[key]["url_rule_in_sentence"];

      if (isEmpty(url_rule_in_sentence) == false) {
        $(doc).find("#options-auto-run-list").append("<li data-id='"+id+"'>"+url_rule_in_sentence+" <button name='delete_rule'>Delete</button></li>");
      }
    }
  }

  var default_text =   $(doc).find("#options-auto-run .options-panel-default-text");
  if (rules != "[]" && rules.length > 0) {
    if (default_text.is(":visible")) {
      $(default_text).hide();
    }
  } else {
    $(default_text).show();
  }

  $(doc).find("#options-auto-run input").val("");

  deleteAutoRunRule(doc);
}
function deleteAutoRunRule(doc, save) {
  $(doc).find("#options-auto-run-list li button[name='delete_rule']").click(function(){
    id = $(this).parent().attr("data-id");

    chrome.storage.sync.get(['cr_auto_run_rules'], function(result) {
      let default_val = result.cr_auto_run_rules
      if (default_val) {
        rules = JSON.parse(default_val);

        // Remove rule if matched id found
        Object.keys(rules).forEach(function(key){
          if (rules[key]) {
            if(rules[key]["id"]==id) {
              delete rules[key];
              new_rules = rules.filter(function(item){ return item != undefined; });

              // Update storage with new rules
              rules_as_string = JSON.stringify(new_rules);
              setAutoRunRules(doc, rules_as_string, true);
            }
          }
        });

      }
    });

    $(this).parent().remove();
  });
}
function setTranslateTo (doc, val, save) {
  if (save) {
    chrome.storage.sync.set({cr_translate_to: val});
  }
  $(doc).find(`#options-translate-to select option[value='${val}']`).prop('selected', true);
}
function setDefaultCss(doc, val, save){
  if (save) {
    chrome.storage.sync.set({'cr_default_css': val});
  }
  $(doc).find("#options-default-css textarea").html(val);
  if ($(doc).find("#cr_default_css").length == false) {
    $("<style id='cr_default_css'>").text(val).appendTo(doc.head);
  }
  $(doc).find("#cr_default_css").html(val);
}

/*** Options Listeners & Save ***/
function optionsDefaultSettings(doc) {
  // Options Style
  chrome.storage.sync.get(['cr_font_family'],function(result){setFontFamily(doc, (result.cr_font_family) ? result.cr_font_family : 'Arial', true) });
  chrome.storage.sync.get(['cr_font_size'],function(result){setFontSize(doc, (result.cr_font_size) ? result.cr_font_size : 16, true) });
  chrome.storage.sync.get(['cr_line_height'],function(result){setLineHeight(doc, (result.cr_line_height) ? result.cr_line_height : 1.84, true) });
  chrome.storage.sync.get(['cr_letter_space'],function(result){setLetterSpace(doc, (result.cr_letter_space) ? result.cr_letter_space : 0, true) });
  chrome.storage.sync.get(['cr_max_width'],function(result){setMaxWidth(doc, (result.cr_max_width) ? result.cr_max_width : 680, true) });

  // Themes
  // Theme & DefaultCSS
  fetch(chrome.runtime.getURL('styles/default.css')).then(response => response.text()).then(data => { setDefaultCss(doc, data, true); });
  // Light Theme
  chrome.storage.sync.get(['cr_background_color_light'],function(result){ setBackgroundColor(doc, (result.cr_background_color_light ? result.cr_background_color_light : "#FFFFFF"), "cr-theme-light", true) });
  chrome.storage.sync.get(['cr_text_color_light'],function(result){ setTextColor(doc, (result.cr_text_color_light ? result.cr_text_color_light : "#333333"), "cr-theme-light", true) });
  chrome.storage.sync.get(['cr_link_color_light'],function(result){ setLinkColor(doc, (result.cr_link_color_light ? result.cr_link_color_light : "#5F6368"), "cr-theme-light", true) });
  // Dark Theme
  chrome.storage.sync.get(['cr_background_color_dark'],function(result){ setBackgroundColor(doc, (result.cr_background_color_dark ? result.cr_background_color_dark : "#1A1A1A"), "cr-theme-dark", true) });
  chrome.storage.sync.get(['cr_text_color_dark'],function(result){ setTextColor(doc, (result.cr_text_color_dark ? result.cr_text_color_dark : "#E0E0E0"), "cr-theme-dark", true) });
  chrome.storage.sync.get(['cr_link_color_dark'],function(result){ setLinkColor(doc, (result.cr_link_color_dark ? result.cr_link_color_dark : "#FFFFFF"), "cr-theme-dark", true) });
  // Theme (need to be down here bcoz setTheme requires themes' values)
  chrome.storage.sync.get(['cr_theme'],function(result){ setTheme(doc, (result.cr_theme) ? result.cr_theme : "cr-theme-light", true) });

  // Reader Components
  chrome.storage.sync.get(['cr_display_outline'],function(result){setDisplayOutline(doc, (result.cr_display_outline) ? result.cr_display_outline : "off", true) });
  chrome.storage.sync.get(['cr_display_images'],function(result){setDisplayImages(doc, (result.cr_display_images) ? result.cr_display_images : "on", true) });
  chrome.storage.sync.get(['cr_display_meta'],function(result){setDisplayMeta(doc, (result.cr_display_meta) ? result.cr_display_meta : "on", true) });
  chrome.storage.sync.get(['cr_display_author'],function(result){setDisplayAuthor(doc, (result.cr_display_author) ? result.cr_display_author : "on", true) });
  chrome.storage.sync.get(['cr_display_reading_time'],function(result){setDisplayReadingTime(doc, (result.cr_display_reading_time) ? result.cr_display_reading_time : "on", true) });
  chrome.storage.sync.get(['cr_display_saved_info'],function(result){setDisplaySavedInfo(doc, (result.cr_display_saved_info) ? result.cr_display_saved_info : "on", true) });

  // Ruler
  chrome.storage.sync.get(['cr_display_ruler'],function(result){setDisplayRuler(doc, (result.cr_display_ruler) ? result.cr_display_ruler : "off", true) });
  chrome.storage.sync.get(['cr_ruler_color'],function(result){setRulerColor(doc, (result.cr_ruler_color) ? result.cr_ruler_color : "#795CFF", true) });
  chrome.storage.sync.get(['cr_ruler_height'],function(result){setRulerHeight(doc, (result.cr_ruler_height) ? result.cr_ruler_height : 30, true) });
  chrome.storage.sync.get(['cr_ruler_position'],function(result){setRulerPosition(doc, (result.cr_ruler_position) ? result.cr_ruler_position : 15, true) });

  // For Planet
  chrome.storage.local.get(['cr_for_planet'],function(result){setForPlanet(doc, (result.cr_for_planet) ? result.cr_for_planet : "off", true) });

  // AutoRun
  chrome.storage.sync.get(['cr_auto_run_rules'], function(result) {
    let default_val = result.cr_auto_run_rules;
    if (default_val) {
      default_rules = JSON.parse(default_val);
      if (default_rules.length > 0) {
        setAutoRunRules(doc, default_val, true);
      } else {
        $(doc).find("#options-auto-run .options-panel-default-text").show();
      }
    } else {
      $(doc).find("#options-auto-run .options-panel-default-text").show();
    }
  });

  // Articulate
  chrome.storage.sync.get(['cr_articulate_voice'],function(result){setArticulateVoice(doc, (result.cr_articulate_voice) ? result.cr_articulate_voice : "Alex", true) });
  chrome.storage.sync.get(['cr_articulate_rate'],function(result){setArticulateRate(doc, (result.cr_articulate_rate) ? result.cr_articulate_rate : 1, true) });
  chrome.storage.sync.get(['cr_articulate_pitch'],function(result){setArticulatePitch(doc, (result.cr_articulate_pitch) ? result.cr_articulate_pitch : 1, true) });
  chrome.storage.sync.get(['cr_articulate_volume'],function(result){setArticulateVolume(doc, (result.cr_articulate_volume) ? result.cr_articulate_volume : 1, true) });
}
function optionsMenu(iframe) {
  var doc = iframe.contentWindow.document;

  // Handle Active Menu/Panel
  $(doc).find("#options-menu li a").click(function(){
    $(doc).find("#options-menu li a").attr("class","tooltip");

    this_menu = $(this);
    $(doc).find(".options-panel").each(function(index, panel){
      if ( $(this_menu).attr("data-panel") == $(panel).attr("id") ) {
        if ( $(panel).is(":visible") ) {
          $(panel).hide();
        } else {
          $(this_menu).addClass("active");
          $(panel).show();
        }
      } else {
        $(panel).hide();
      }
    });
  });

  // Delete Element
  $(doc).find("#options-delete-element").click(function(){
    $(this).hide();
    $(doc).find("#options-delete-element-stop").show();
    startDeleteElement(doc);
  });

  // Undo Delete Element
  $(doc).find("#options-delete-element-undo").click(function(){
    undoDeletedElement(doc);
  });

  // Fullscreen
  $(doc).find('#options-fullscreen').click(function () {
    screenfull.toggle($('#container')[0]).then(function () {
      if (screenfull.isFullscreen) {
        $(doc).find('#options-fullscreen i.enter').hide();
        $(doc).find('#options-fullscreen i.exit').show();
      } else {
        $(doc).find('#options-fullscreen i.enter').show();
        $(doc).find('#options-fullscreen i.exit').hide();
      }
    });
  });

  // Print
  $(doc).find("#options-print").click(function(){
    iframe.contentWindow.print();
  });

  // Save Page
  $(doc).find("#options-save-page").click(function(){
    savePage(doc);
  });
  $(doc).find("#options-saved-panel a.close").click(function(){
    $(doc).find("#options-menu li a").attr("class","tooltip");
    $(doc).find("#options-saved-panel").hide();
  });

  // Close
  $(doc).find("#options-close").click(function(){
    $(iframe).hide();
  });
}
function optionsPanelCloseHandler(doc){
  $(doc).click(function(e){
    target = $(e.target);
    setTimeout(function(){
      $(doc).find(".options-panel").each(function(){
        id = "#"+$(this).attr('id');
        if ( $(doc).find(id).is(":visible") ) {
          if ( !target.parents( id ).length && !target.parents("#options-menu").length ) {
            $(doc).find( id ).hide();
            $(doc).find( id ).hide();
            $(doc).find("#options-menu li a").removeClass("active");
          }
        }
      });
    }, 100);
  });
}
function optionsStyle(doc) {
  // Listeners
  $(doc).find("#options-font-family select").change(function() { setFontFamily(doc, $(this).val()); });
  $(doc).find("#options-font-size input").on("input change", function() { setFontSize(doc, $(this).val()) });
  $(doc).find("#options-line-height input").on("input change", function() { setLineHeight(doc, $(this).val()) });
  $(doc).find("#options-letter-space input").on("input change", function() { setLetterSpace(doc, $(this).val()) });
  $(doc).find("#options-max-width input").on("input change", function() { setMaxWidth(doc, $(this).val()) });

  // Save
  $(doc).find(".options-panel-content button[name='save-options-style']").click(function(e){
    cr_font_family = $(doc).find("#options-font-family select").find(":selected").val();
    cr_font_size = $(doc).find("#options-font-size input").val().trim();
    cr_line_height = $(doc).find("#options-line-height input").val().trim();
    cr_letter_space = $(doc).find("#options-letter-space input").val().trim();
    cr_max_width = $(doc).find("#options-max-width input").val().trim();
    saveStorageValue("cr_font_family", cr_font_family);
    saveStorageValue("cr_font_size", cr_font_size);
    saveStorageValue("cr_line_height", cr_line_height);
    saveStorageValue("cr_letter_space", cr_letter_space);
    saveStorageValue("cr_max_width", cr_max_width);

    $("<span class='text-info'>Saved!</span>").insertAfter( $(e.target) ).fadeOut(1500, function() { $(this).remove() });
  });
}
function optionsTheme(doc) {
  cr_theme_active = $(doc).find("#options-theme ul li a.active").attr("data-theme");
  $(doc).find("#options-theme ul li a").click(function() {
    if ( ($(this).attr("data-theme") == "cr-theme-light") || ($(this).attr("data-theme") == "cr-theme-dark") ) {
      cr_theme_active = $(this).attr("data-theme");
      setTheme(doc, cr_theme_active);
    }
  });
  $(doc).find("#options-background-color input").on("input change", function() { setBackgroundColor(doc, $(this).val(), cr_theme_active) });
  $(doc).find("#options-text-color input").on("input change", function() { setTextColor(doc, $(this).val(), cr_theme_active) });
  $(doc).find("#options-link-color input").on("input change", function() { setLinkColor(doc, $(this).val(), cr_theme_active) });

  // Save
  $(doc).find(".options-panel-content button[name='save-options-themes']").click(function(e){
    cr_theme_active = $(doc).find("#options-theme ul li a.active").attr("data-theme");
    cr_background_color = $(doc).find("#options-background-color input[name='background_color']").val().trim();
    cr_text_color = $(doc).find("#options-text-color input[name='text_color']").val().trim();
    cr_link_color = $(doc).find("#options-link-color input[name='link_color']").val().trim();
    saveStorageValue("cr_theme", cr_theme_active);
    if (cr_theme_active == "cr-theme-light") {
      saveStorageValue("cr_background_color_light", cr_background_color);
      saveStorageValue("cr_text_color_light", cr_text_color);
      saveStorageValue("cr_link_color_light", cr_link_color);
    } else if (cr_theme_active == "cr-theme-dark") {
      saveStorageValue("cr_background_color_dark", cr_background_color);
      saveStorageValue("cr_text_color_dark", cr_text_color);
      saveStorageValue("cr_link_color_dark", cr_link_color);
    } else {
      saveStorageValue("cr_background_color", cr_background_color);
      saveStorageValue("cr_text_color", cr_text_color);
      saveStorageValue("cr_link_color", cr_link_color);
    }
    setTheme(doc, cr_theme_active);

    $("<span class='text-info'>Saved!</span>").insertAfter( $(e.target) ).fadeOut(1500, function() { $(this).remove() });
  });
}
function optionsReaderComponents(doc) {
  // Listeners
  $(doc).find( "#options-display-outline input").change(function(){ setDisplayOutline(doc, getCheckboxStatus($(this))); });
  $(doc).find( "#options-display-images input").change(function(){ setDisplayImages(doc, getCheckboxStatus($(this))); });
  $(doc).find( "#options-display-meta input").change(function(){ setDisplayMeta(doc, getCheckboxStatus($(this))); });
  $(doc).find( "#options-display-author input").change(function(){ setDisplayAuthor(doc, getCheckboxStatus($(this))); });
  $(doc).find( "#options-display-reading-time input").change(function(){ setDisplayReadingTime(doc, getCheckboxStatus($(this))); });
  $(doc).find( "#options-display-saved-info input").change(function(){ setDisplaySavedInfo(doc, getCheckboxStatus($(this))); });

  // Save
  $(doc).find(".options-panel-content button[name='save-options-reader-components']").click(function(e){
    cr_display_outline = getCheckboxStatus( $(doc).find("#options-display-outline input") );
    cr_display_images = getCheckboxStatus( $(doc).find("#options-display-images input") );
    cr_display_meta = getCheckboxStatus( $(doc).find("#options-display-meta input") );
    cr_display_author = getCheckboxStatus( $(doc).find("#options-display-author input") );
    cr_display_reading_time = getCheckboxStatus( $(doc).find("#options-display-reading-time input") );
    cr_display_saved_info = getCheckboxStatus( $(doc).find("#options-display-saved-info input") );

    saveStorageValue("cr_display_outline", cr_display_outline);
    saveStorageValue("cr_display_images", cr_display_images);
    saveStorageValue("cr_display_meta", cr_display_meta);
    saveStorageValue("cr_display_author", cr_display_author);
    saveStorageValue("cr_display_reading_time", cr_display_reading_time);
    saveStorageValue("cr_display_saved_info", cr_display_saved_info);

    $("<span class='text-info'>Saved!</span>").insertAfter( $(e.target) ).fadeOut(1500, function() { $(this).remove() });
  });
}
function optionsRuler(doc) {
  // Listeners
  $(doc).find("#options-display-ruler input").change(function(){ setDisplayRuler(doc, getCheckboxStatus($(this))); });
  $(doc).find("#options-ruler-color input").on("input change", function() { setRulerColor(doc, $(this).val()); });
  $(doc).find("#options-ruler-height input").on("input change", function() { setRulerHeight(doc, $(this).val()); });
  $(doc).find("#options-ruler-position input").on("input change", function() { setRulerPosition(doc, $(this).val()); });

  // Save
  $(doc).find(".options-panel-content button[name='save-options-ruler']").click(function(e){
    cr_display_ruler = getCheckboxStatus( $(doc).find("#options-display-ruler input") );
    cr_ruler_color = $(doc).find("#options-ruler-color input[name='ruler_color']").val();
    cr_ruler_height = $(doc).find("#options-ruler-height .val").val();
    cr_ruler_position = $(doc).find("#options-ruler-position .val").val();

    saveStorageValue("cr_display_ruler", cr_display_ruler);
    saveStorageValue("cr_ruler_color", cr_ruler_color);
    saveStorageValue("cr_ruler_height", cr_ruler_height);
    saveStorageValue("cr_ruler_position", cr_ruler_position);

    $("<span class='text-info'>Saved!</span>").insertAfter( $(e.target) ).fadeOut(1500, function() { $(this).remove() });
  });
}
function optionsForPlanet(doc) {
  // Listeners
  $(doc).find("#options-for-planet input").change(function(){ setForPlanet(doc, getCheckboxStatus($(this)), true); });
}
function optionsAutoRunRules(doc) {
  add_new_rule_toggle_btn = $(doc).find("#options-auto-run button[name='add_new_rule_toggle']");
  add_new_rule_panel = $(doc).find("#options-auto-run-add-new-rule-panel");
  add_new_rule_btn = $(doc).find("#options-auto-run button[name='add_new_rule']");
  cancel_new_rule_btn = $(doc).find("#options-auto-run button[name='cancel_new_rule']");

  $(add_new_rule_toggle_btn).click(function(){
    add_new_rule_panel = $(doc).find("#options-auto-run-add-new-rule-panel");
    $(add_new_rule_panel).show();
    $(this).hide();
  });
  $(add_new_rule_btn).click(function(){
    // Set and insert new rule to storage
    var auto_run_option = $(doc).find("#options-auto-run");
    var domain_name_is = $(auto_run_option).find("input[name='domain_name_is']").val();
    var url_is = $(auto_run_option).find("input[name='url_is']").val();
    var url_is_not = $(auto_run_option).find("input[name='url_is_not']").val();
    var url_contains = $(auto_run_option).find("input[name='url_contains']").val();
    var url_does_not_contain = $(auto_run_option).find("input[name='url_does_not_contain']").val();
    var url_starts_with = $(auto_run_option).find("input[name='url_starts_with']").val();
    var url_ends_with = $(auto_run_option).find("input[name='url_ends_with']").val();

    var rule_in_words = [];
    if (isEmpty(domain_name_is) == false) { rule_in_words.push("domain name is "+domain_name_is) }
    if (isEmpty(url_is) == false) { rule_in_words.push("url is "+url_is) }
    if (isEmpty(url_is_not) == false) { rule_in_words.push("url is  not "+url_is_not) }
    if (isEmpty(url_contains) == false) { rule_in_words.push("url contains "+url_contains) }
    if (isEmpty(url_does_not_contain) == false) { rule_in_words.push("url does not contain "+url_does_not_contain) }
    if (isEmpty(url_starts_with) == false) { rule_in_words.push("url starts with "+url_starts_with) }
    if (isEmpty(url_ends_with) == false) { rule_in_words.push("url ends with "+url_ends_with) }
    if (rule_in_words.length > 0) {
      var rules = [];
      var new_rule = {
        "id": 0,
        "domain_name_is": domain_name_is,
        "url_is": url_is,
        "url_is_not": url_is_not,
        "url_contains": url_contains,
        "url_does_not_contain": url_does_not_contain,
        "url_starts_with": url_starts_with,
        "url_ends_with": url_starts_with,
        "url_rule_in_sentence": ""
      };
      url_rule_in_sentence = "the page "+rule_in_words.join(" <b>and</b> ");
      new_rule["url_rule_in_sentence"] = url_rule_in_sentence;

      // Get default auto_run rules
      chrome.storage.sync.get(['cr_auto_run_rules'], function(result) {
        let default_val = result.cr_auto_run_rules;
        var default_rules;
        if (default_val) {
          default_rules = JSON.parse(default_val);
          if (default_rules.length > 0) {
            last_id = default_rules[ default_rules.length - 1 ]["id"];
            new_rule["id"] = last_id + 1;
            default_rules.push(new_rule);
          } else {
            new_rule["id"] = 1;
            default_rules.push(new_rule);
          }
        } else {
          new_rule["id"] = 1;
          default_rules = [];
          default_rules.push(new_rule);
        }

        rules_as_string = JSON.stringify(default_rules);
        setAutoRunRules(doc, rules_as_string, true);
      });
    } else {
      alert("Rules cannot be empty!");
    }
  });

  $(cancel_new_rule_btn).click(function(){
    $(add_new_rule_toggle_btn).show();
    $(add_new_rule_panel).hide();
  });
}
function optionsArticulate(doc) {
  // Listeners
  $(doc).find("#options-articulate-voice select").on("change", function() { setArticulateVoice(doc, $(this).val()); });
  $(doc).find("#options-articulate-rate input").on("input change", function() { setArticulateRate(doc, $(this).val()); });
  $(doc).find("#options-articulate-pitch input").on("input change", function() { setArticulatePitch(doc, $(this).val()); });
  $(doc).find("#options-articulate-volume input").on("input change", function() { setArticulateVolume(doc, $(this).val()); });

  // Save
  $(doc).find(".options-panel-content button[name='save-options-articulate']").click(function(e){
    cr_articulate_voice = $(doc).find("#options-articulate-voice select").find(":selected").val();
    cr_articulate_rate = $(doc).find("#options-articulate-rate input").val().trim();
    cr_articulate_pitch = $(doc).find("#options-articulate-pitch input").val().trim();
    cr_articulate_volume = $(doc).find("#options-articulate-volume input").val().trim();

    saveStorageValue("cr_articulate_voice", cr_articulate_voice);
    saveStorageValue("cr_articulate_rate", cr_articulate_rate);
    saveStorageValue("cr_articulate_pitch", cr_articulate_pitch);
    saveStorageValue("cr_articulate_volume", cr_articulate_volume);

    $("<span class='text-info'>Saved!</span>").insertBefore( $(e.target) ).fadeOut(1500, function() { $(this).remove() });
    $(doc).find(".options-panel-content #articulate-stop").trigger("click");
  });
}
function optionsArticulateProcess(doc){
  var voices = $().articulate('getVoices');
  var select = $(doc).find("#options-articulate-voice select");
  for (i = 0; i < voices.length; i++) {
    voiceName = voices[i].name;
    voiceLang = voices[i].language;

    $(select).append("<option value='"+voiceName+"' data-articulate-language='"+voiceLang+"'>"+voiceName+" ("+voiceLang+")</option>");
  }

  var btn_play = $(doc).find("#options-articulate-panel .options-panel-content button[name='play']");
  var btn_pause = $(doc).find("#options-articulate-panel .options-panel-content button[name='pause']");

  $(doc).find("#articulate-speak, #articulate-pause").click(function(){
    articulateTextChanged(doc);

    // Get the parameter values from the input sliders
    var vn = $(doc).find("#options-articulate-voice select option:selected").val();
    var vl = $(doc).find("#options-articulate-voice select option:selected").attr("data-articulate-language");
    var r = parseFloat($(doc).find('#options-articulate-rate input').val());
    var p = parseFloat($(doc).find('#options-articulate-pitch input').val());
    var v = parseFloat($(doc).find('#options-articulate-volume input').val());

    var speaking = $().articulate('isSpeaking');
    var paused = $().articulate('isPaused');

    if (speaking) {
      if (paused) {
        $().articulate('resume');

        $(btn_play).hide();
        $(btn_pause).show();
      } else {
        $().articulate('pause');

        $(btn_play).show();
        $(btn_pause).hide();
      }
    } else {
      var synth = window.speechSynthesis;

      articulateTextChanged(doc);

      utterance = new SpeechSynthesisUtterance();
      utterance.lang = vl;
      utterance.rate = r;
      utterance.pitch = p;
      utterance.volume = v;

      var wrappedText = [];
      var elems = $(doc).find("#cr-content-container").find("p, h1, h2, h3, h4, h5, h6");
      $(elems).each(function(){
        var element_name = $(this).prop("tagName");
        var rawText = $(this).html();
        var rawText = rawText.replace(/<[^>]*>/g, "");
        text = rawText.split(" ");

        for (i = 0; i < text.length; i++) {
          var word = text[i].trim();

          if (i == text.length - 1) {
            if (element_name == "H1" || element_name == "H2" || element_name == "H3" || element_name == "H4" || element_name == "H5" || element_name == "H6") {
              if (word.includes(".") == false ) {
                word = word+".";
              }
            }
          }

          wrappedText.push(word);
        }
      });
      wrappedText = wrappedText.join(" ");
      utterance.text = wrappedText;

      utterance.onboundary = function(event) {
        clearHighlight(doc);
        var current = $(doc).find("span[data-count='" + event.charIndex + "']")[0];

        if (current) {
          $(current).addClass("active");
        }
      }

      synth.speak(utterance);

      $(btn_play).hide();
      $(btn_pause).show();
    };
  });

  $(doc).find("#articulate-stop").click(function(){
    $().articulate('stop');
    articulateReset(doc);

    $(btn_play).show();
    $(btn_pause).hide();
  });
}
function optionsOspActions(doc){
  $(doc).find("#osp-actions-save").click(function(){
    $(doc).find("a#options-save-page").click();
  });
}

// Open Saved Articles link
function savedArticlesOpenLink(doc){
  $(doc).find(".open-saved-articles").click(function(e){
    e.preventDefault();
    window.open(chrome.runtime.getURL("options.html"));
  });
}

// Handle Removing Article action
function removeSavedArticle(doc){
  // Remove article from local storage
  $(doc).find(".remove-saved-article").click(function(){
    var result = confirm("Are you sure you want to delete this article?");
    if (result) {
      $(doc).find('#cr-container #options-saved-panel-header .loading-status').html("<span class='loading-dots'>Deleting</span>...");
      $(doc).find('#cr-container #options-saved-panel').show();

      encoded_url_to_delete = $(this).attr("data-encoded-url");

      // Remove article from saved_pages
      chrome.storage.local.get(['cr_saved_pages'], function(new_result) {
        let default_saved_pages = new_result.cr_saved_pages;
        var pages = JSON.parse(default_saved_pages);
        Object.keys(pages).forEach(function(key){
          if (pages[key]) {
            url = pages[key]['url'];
            encoded_url = pages[key]['encodedURL'];

            if(encoded_url == encoded_url_to_delete){
              pages.splice(key, 1);
              new_pages_as_string = JSON.stringify(pages);

              // Update saved_pages
              chrome.storage.local.set({cr_saved_pages: new_pages_as_string});

              // Hide saved info
              $(doc).find("#cr-saved-notice").fadeOut();
              $(doc).find('#cr-container #options-saved-panel-header .loading-status').html("<i class='fas fa-info-circle m-r-3'></i> Deleted.");
              $(doc).find('#cr-container .saved-version-notice').fadeOut();

              return false; // Stop the loop
            }
          }
        });

        // Remove url from local storage
        chrome.storage.local.remove(encoded_url_to_delete);
      });

      // Hide options-saved-panel
      setTimeout(function(){
        $(doc).find("#cr-container #options-saved-panel").hide();
      }, 7000);
    }
  });
}

function overrideStyles(doc) {
  // Make sure no injected margin around the body
  $(doc).find("body").css("margin", 0);

  // Add style to options-panel
  $(doc).find(".options-panel").attr("style", "background: #ffffff !important; color: #47525D !important;");
  $(doc).find("#cr-footer").attr("style", "display: block !important;");
}

// Upsell Tooltip
/*
function upsellTooltip(doc){
  var cr_opened_counter = 0;
  chrome.storage.sync.get(['cr_not_interested_in_pro_tooltip'],function(result){
    setTimeout(function(){
      if (result.cr_not_interested_in_pro_tooltip){
        // Check number of times Reader Mode has been opened
        chrome.storage.sync.get(['cr_opened_counter'],function(res) {
          if (res.cr_opened_counter || res.cr_opened_counter >= 0){
            cr_opened_counter = res.cr_opened_counter + 1;
            chrome.storage.sync.set({cr_opened_counter: cr_opened_counter});
          } else {
            cr_opened_counter = 1;
            chrome.storage.sync.set({cr_opened_counter: cr_opened_counter });
          }

          if ( (cr_opened_counter === 5 || cr_opened_counter % 15 === 0) && cr_opened_counter < 251 ) {
            $(doc).find("#cr-pro-features-tooltip").fadeIn();
            chrome.storage.sync.remove(['cr_not_interested_in_pro_tooltip']);
          } else {
            $(doc).find("#cr-pro-features-tooltip").hide();
          }
        });
      } else {
        $(doc).find("#cr-pro-features-tooltip").fadeIn();
      }
    }, 3000);
  });

  $(doc).find("#cr-pro-features-tooltip .not-interested").click(function(){
    $(doc).find("#cr-pro-features-tooltip").fadeOut();
    chrome.storage.sync.set({cr_not_interested_in_pro_tooltip: "true"});
  });
}
*/
function upsellTooltip(doc){
  var cr_opened_counter_2 = 0;
  chrome.storage.local.get(['cr_opened_counter','cr_opened_counter_2','cr_for_planet','cr_not_interested_in_pro_tooltip'],function(result){
    setTimeout(function(){
      if (result.cr_not_interested_in_pro_tooltip){
        // Check number of times Reader Mode has been opened
        //chrome.storage.sync.get(['cr_opened_counter_2'],function(res) {
          if (result.cr_opened_counter_2 || result.cr_opened_counter_2 >= 0){
            cr_opened_counter_2 = result.cr_opened_counter_2 + 1;
            chrome.storage.local.set({cr_opened_counter_2: cr_opened_counter_2});
          } else {
            cr_opened_counter_2 = 1;
            chrome.storage.local.set({cr_opened_counter_2: cr_opened_counter_2 });
          }

          if (!result.cr_opened_counter) {
            if ( (cr_opened_counter_2 === 5 || cr_opened_counter_2 % 15 === 0) && cr_opened_counter_2 < 251 && result.cr_for_planet == "off") {
              $(doc).find("#cr-pro-features-tooltip").fadeIn();

              //chrome.storage.local.remove(['cr_not_interested_in_pro_tooltip']);
            } else {
              $(doc).find("#cr-pro-features-tooltip").hide();
            }
          }
        //});
      } else {
        chrome.storage.sync.get(['cr_opened_counter'],function(res) {
          if (!res.cr_opened_counter) {
            $(doc).find("#cr-pro-features-tooltip").fadeIn();

            if (res.cr_for_planet == "on"){
              $(doc).find(".opt-in-verb").html("keep")
            } 
          }
        }); 
      }
    }, 3000);
  });

  $(doc).find("#cr-pro-features-tooltip .opt-in").click(function(){
    $(doc).find("#cr-pro-features-tooltip").fadeOut();
    chrome.storage.local.set({cr_not_interested_in_pro_tooltip: "true"});
    $(doc).find("#cr_for_planet").prop("checked",true);
    chrome.storage.local.set({cr_for_planet: "on"});
  });

  $(doc).find("#cr-pro-features-tooltip .opt-out").click(function(){
    $(doc).find("#cr-pro-features-tooltip").fadeOut();
    chrome.storage.local.set({cr_not_interested_in_pro_tooltip: "true"});
    chrome.storage.local.set({cr_for_planet: "off"});
    $(doc).find("#cr_for_planet").prop("checked",false);
  });
}

function proFeaturesModal(doc){
  $(doc).find(".open-pro-features-modal").click(function(e){
    e.preventDefault();
    $(doc).find("#cr-pro-features-modal").show();
  });
  $(doc).find("#cr-pro-features-modal-close").click(function(){
    $(doc).find("#cr-pro-features-modal").hide();
  });
}

async function getOrCreateClientId() {
  const result = await chrome.storage.local.get('clientId');
  let clientId = result.clientId;
  if (!clientId) {
    // Generate a unique client ID, the actual value is not relevant
    clientId = self.crypto.randomUUID();
    await chrome.storage.local.set({clientId});
  }
  return clientId;
}

/*
async function sendSBtoGA(btn_id){
  const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
  const MEASUREMENT_ID = `G-D6BREHV2YF`;
  const API_SECRET = `gxl8qn3uTmCOXBCrkbiHLw`;

  fetch(
    `${GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
    {
      method: 'POST',
      body: JSON.stringify({
        client_id: await getOrCreateClientId(),
        events: [
          {
            name: 'safe_browsing_btn_clicked',
            params: {
              id: btn_id,
            },
          },
        ],
      }),
    }
  );
}
*/

// Check & set if user accepted safe-browsing.js (click stream) agreement or not
function safeBrowsing(doc){
  $(doc).find("#crsb-agree").click(async function(e){
    // set the consent to true & enable/start safe-browsing if the user accepted the click stream agreement
    chrome.runtime.sendMessage({action:"safe-browsing-agreement", agreement:true});
    chrome.runtime.sendMessage({action:"safe-browsing-start"});
    $(doc).find("#cr-safe-browsing").hide();
    $(doc).find("#cr-body").fadeIn();

    //await sendSBtoGA("#crsb-agree");
  });
  $(doc).find("#crsb-decline").click(async function(e){
    // set the consent to false if the user declined the click stream agreement
    chrome.runtime.sendMessage({action:"safe-browsing-agreement", agreement:false});
    $(doc).find("#cr-safe-browsing").hide();
    $(doc).find("#cr-body").fadeIn();

    //await sendSBtoGA("#crsb-decline");
  });
}

function init(){
  // Initialize iframe & doc
  var iframe = document.getElementById('cr-iframe');
  var doc = iframe.contentWindow.document;

  // Get parsed article
  var article = getParsedArticle();

  if (typeof article.title !== "undefined" && article.title !== null) {
    var title = article.title;
  } else {
    var title = "";
  }
  var content = article.content;

  var article_url = window.location.href;
  if ( (article.byline == "") || (article.byline == "About 0 Minutes") ) {
    var author = "Unknown author";
  } else {
    var author = article.byline;
  }
  var reading_time = readingTime(title+" "+content) + " min read";

  // Remove Media Playback from content
  content = content.replace("Media playback is unsupported on your device", "");

  // Fetch template for reader mode
  fetch(chrome.runtime.getURL('/app.html'))
  .then(response => response.text())
  .then(data => {

    // Add template to doc. Prevent injected links from refresh the iframe to original content
    doc.open();
    doc.write(data);
    doc.close();

    // Add preloader the second time after template was fetched
    startPreloader(doc);

    // Get the saved HTML of the current page from storage
    encodedURL = getEncodedCurrentURL();
    chrome.storage.local.get(encodedURL, function(result) {
      // Set content outline
      setOutline(doc, article);

      // Add main content
      let default_val = result[encodedURL]
      if (default_val) {
        var decompressed_html = decompressHTML(default_val);
        $(doc).find("#cr-content-wrapper").html(decompressed_html);
        removeInlineElemStyles(doc);

        $(doc).find("#cr-saved-notice").show();
      } else {
        $(doc).find("#cr-title").html(title);

        $(doc).find("#cr-content").html(content);

        setHeadingsForOutline(doc);

        $(doc).find("#cr-content a").attr("target", "_blank");
      }

      // Add meta, title, and reading-time
      if (article_url) {
        $(doc).find("#cr-meta").append("<li id='cr-meta-url'><i class='fas fa-link'></i><span class='truncated'><a href='"+article_url+"' target='_blank'>"+article_url+"</a></span><li>");
      }
      if (author) {
        $(doc).find("#cr-meta").append("<li id='cr-meta-author'><i class='fas fa-pen-fancy'></i><span class='truncated'>"+author+"</span><li>");
      }
      if (reading_time) {
        $(doc).find("#cr-meta").append("<li id='cr-meta-reading-time'><i class='far fa-clock'></i><span>"+reading_time+"</span><li>");
      }
    });

    // Trim content
    trimContent(doc);

    // Add style tag
    addStyleTags(doc);

    // Toggle display sidebar
    //outlineDisplayToggle(doc);

    // Toolbar
    toolbarDisplayToggle(doc);
    toolbarActionsHandler(doc);

    // Options
    optionsDefaultSettings(doc);
    optionsMenu(iframe);
    optionsPanelCloseHandler(doc);
    optionsAccordian(doc);
    optionsColorPicker(doc);

    // Main Options Panel;
    optionsStyle(doc);
    optionsTheme(doc);
    optionsReaderComponents(doc);
    optionsRuler(doc);
    optionsForPlanet(doc);
    optionsAutoRunRules(doc);

    // SavedPanel
    optionsOspActions(doc);

    // Articulate Panel
    optionsArticulate(doc);
    optionsArticulateProcess(doc);

    // Open Saved Articles link
    savedArticlesOpenLink(doc);

    // Handle Removing Article
    removeSavedArticle(doc);

    // Override styles
    overrideStyles(doc);

    // Display iframe
    $(iframe).show();
    setTimeout(function(){
      $(doc).find("#cr-pre-loader").remove();

      chrome.storage.local.get(function(storage){
        if (typeof storage.safe_browsing !== "undefined") {
          if (storage.safe_browsing == true) {
            // Only start safe-browsing.js if the user accepted the agreement
            // We have moved this logic to service worker instead
            //chrome.runtime.sendMessage({action:"safe-browsing-start"});
          }

          $(doc).find("#cr-body").fadeIn();
        } else {
          $(doc).find("#cr-safe-browsing").show();
        } 
      });
    }, 1000);

    safeBrowsing(doc);

    // Upsell Tooltip
    proFeaturesModal(doc);
    upsellTooltip(doc);

  }).catch(err => {
    alert("Ops..something wrong, please try again.")
  });
}

var latest_url;
function launch() {
  // If license modal exist, remove it first
  if( $("#cr-license-iframe").length ) {
    $("#cr-license-iframe").remove();
  }

  // Detect past iframe - don't create another
  if(document.getElementById("cr-iframe") == null) {
    // Create iframe and append to body
    var iframe = createIframe();
    document.body.appendChild(iframe);

    latest_url = window.location.href;
    init();
  } else {
    iframe = document.getElementById("cr-iframe");
    if($(iframe).is(':visible')){
      $(iframe).fadeOut();
    } else {
      // Only parse the article if the url was changed
      if (latest_url == window.location) {
        $(iframe).fadeIn();
      } else {
        latest_url = window.location.href;
        init();
      }
    }
  }

}
launch();
