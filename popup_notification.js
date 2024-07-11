const extension_name = "Reader Mode";

document.getElementById('learnMore').addEventListener('click',  function() {

  chrome.tabs.create({ url: "https://impacthero.co/ecomode/?extension_name="+extension_name, active: true }, (createdPermanentTab) => {
  
  chrome.storage.local.set(
    {
      openPermanentTab: true
    }
  );
  });

});


document.getElementById('closeButtonTop').addEventListener('click',  function() {

  window.parent.postMessage({
    action: 'hideIframe'
  }, '*'); 

});



//translation loading
async function loadTranslations() {
  try {
    const response = await fetch(chrome.runtime.getURL('sdk_translations.json'));
    return await response.json();
  } catch (error) {
    console.error('Error loading translation json:', error);
  }
}
window.addEventListener("load", () => {
  loadTranslations().then(translations => {
    const langCode = (navigator.language || navigator.userLanguage).substring(0, 2); // Ex: 'fr-BE' -> 'fr'
    popupNotificationTranslation = translations.popup_notification[langCode] || translations.popup_notification['en'];

    const objects = document.querySelectorAll("*[data-message]");
    for (let i = 0; i < objects.length; i += 1) {
      if (objects[i].dataset && objects[i].dataset.message) {
        const messageKey = objects[i].dataset.message;

        if (messageKey == "button_close"){

        
          chrome.storage.local.get(['notificationAlreadyShown'], function(result) {
            if (result.notificationAlreadyShown === true) {

              objects[i].innerHTML = popupNotificationTranslation["button_close_forever"]; 
              
              document.getElementById("closeButtonTop").style.visibility = "visible";
              document.getElementById('closeButton').addEventListener('click',  function() {
                window.parent.postMessage({
                  action: 'hideIframeForever'
                }, '*'); 
              });

            }else{
              objects[i].innerHTML = popupNotificationTranslation[messageKey];  
              chrome.storage.local.set({notificationAlreadyShown: true}, async function() {});
              document.getElementById('closeButton').addEventListener('click',  function() {
                window.parent.postMessage({
                  action: 'hideIframe'
                }, '*'); 
              });
            }
          });


        }else{
          objects[i].innerHTML = popupNotificationTranslation[messageKey];  
        }
      }
    }
  }).catch(error => {
    console.error('Error handling translations:', error);
  });
});