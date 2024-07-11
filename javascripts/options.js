$(function(){
  // Display estimated storage used
  function bytesToSize(bytes) {
     var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
     if (bytes == 0) return '0 Byte';
     var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
     return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(({usage, quota}) => {
      storage_info = `You are using ${bytesToSize(usage)} out of ${bytesToSize(quota)} of your local storage`
      //$("#cr-storage-info").html(storage_info);
    });
  }

  // Get the saved HTML of the current page from storage
  chrome.storage.local.get(['cr_saved_pages'], function(result) {
    let default_val = result.cr_saved_pages;
    var saved_pages_list = $("#cr-saved-pages-list");
    if (default_val) {
      var pages = JSON.parse(default_val);
      Object.keys(pages).forEach(function(key){
        if (pages[key]) {
          $(saved_pages_list).append(`
            <li>
              <a href="${pages[key]['url']}">
                ${pages[key]['url']}
              </a>
              <button name="delete" data-encoded-url="${pages[key]['encodedURL']}">Delete</button>
            </li>
          `);
        }
      });

      if ( $(saved_pages_list).children().length == 0  ) {
        $("#cr-saved-pages-default").show();
      } else {
        $("#cr-saved-pages-default").hide();
      }
    }

    // Delete saved page
    $("#cr-saved-pages-list li button[name='delete']").click(function(){
      var confirm = chrome.extension.getBackgroundPage().confirm("Are you sure you want to remove this page?");
      if (confirm) {
        list_item = $(this).parent();
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

                return false; // Stop the loop
              }
            }
          });

          // Remove url from local storage
          chrome.storage.local.remove(encoded_url_to_delete);
          $(list_item).remove();

          if ( $(saved_pages_list).children().length == 0  ) {
            $("#cr-saved-pages-default").show();
          }
        });
      }
    });

  });

  var saved_pages_list = $("#cr-saved-pages-list");
  if ( $(saved_pages_list).children().length == 0  ) {
    $("#cr-saved-pages-default").show();
  } else {
    $("#cr-saved-pages-default").hide();
  }

});
