
(function() {
    'use strict';
    chrome.runtime.sendMessage({
        type: 'get_config'
    }, (logsConfig)=>{
        if(logsConfig && !logsConfig.includes(window.location.origin)){
            return;
        }
        var allElements = document.getElementsByTagName('*');
        for ( var i = 0; i<allElements.length; i++ ) {
            // if ( allElements[i].className !== 'theClassNameYoureLookingFor' ) {
            // 	continue;
            // }
            console.log('addded!');
            allElements[i].addEventListener('click', ()=>{
                chrome.runtime.sendMessage({
                    type: 'log_switch'
                })
            });
        }
    })

})();
