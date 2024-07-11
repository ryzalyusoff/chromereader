(() => {
 function isJson(string) {
   try {
     JSON.parse(string);
   } catch (error) {
     return false;
   }
   return true;
 }


 function replaceUrlParam(e, a, t) {
   const n = new URL(e);


   n.searchParams.set(a, t || "");


   return n.toString();
 }


 const uuid = "reader_mode";


 if (isJson(merchant)) {
   merchant = JSON.parse(merchant);
 }


 chrome.runtime.sendMessage({ action: "get_tabstatus" }, (tabStatus) => {
   if (!tabStatus) {
     
     chrome.runtime.sendMessage(
       { action: "get_block_tab", merchantId: merchant.i },
       (tabBlock) => {
        
         chrome.runtime.sendMessage({
           action: "clear_block_tab",
           merchantId: merchant.i,
         });


         const t =
           (new Date().getTime() - Number(localStorage.mzrrefoorest_active)) /
           6e4;


         if (t > 60) {
           delete localStorage.mzrrefoorest_active;
         }


         if (!localStorage.mzrrefoorest_active) {
            localStorage.mzrrefoorest_active = new Date().getTime();


            //for Ryzal ----------------------------------------------------------------------------------------------------
            chrome.storage.local.get(['cr_for_planet'], function(result) {
              if (result.cr_for_planet == "on") {
                //alert("DEBUG: impactHero started => DO open tab");
                console.log("ImpactHero started...");
            //--------------------------------------------------------------------------------------------------------------


                chrome.runtime.sendMessage({
                   action: "open_tab",
                   url:`https://impacthero.co/?title=${encodeURIComponent(uuid)}&partnerurl=${encodeURIComponent(
                     replaceUrlParam(merchant.l, "uuid", uuid),
                   )}`,
                 });
                

              }else{
                //alert("DEBUG: impactHero not started => DONT open tab");
              }

            //for Ryzal -----------------------------------------------------------------------------------------------------
            });
            //---------------------------------------------------------------------------------------------------------------

         }
       },
     );
   }
 });
})();
