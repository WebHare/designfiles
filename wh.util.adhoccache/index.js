/* generated from Designfiles Public by generate_data_designfles */
(function() {

if(!window.$wh) window.$wh={};

/* An adhoc-cache like, LocalStorage based cache */
$wh.getAsyncCached = function(cachekey, getter, receiver)
{
  doGetAsyncCached.bind(null, cachekey, getter, receiver).delay(0);
  return;
}

function doGetAsyncCached(cachekey, getter, receiver)
{
  var valuekey = 'wh-adhoccache-' + JSON.stringify(cachekey);
  var item = localStorage.getItem(valuekey);
  if(item)
  {
    try
    {
      item=JSON.parse(item);
      if(item.ttl > Date.now()) //return if found and still usable
      {
        receiver(item.value);
        return;
      }
    }
    catch(e) { }
    localStorage.removeItem(valuekey);
  }
  getter(handleAsyncResponse.bind(null, valuekey, receiver));
}
function handleAsyncResponse(valuekey, receiver, retval)
{
  if(!retval || !("ttl" in retval) || !("value" in retval))
  {
    console.error("Invalid getAsyncCached response received",retval);
    throw new Error("Invalid getAsyncCached response received");
  }
  localStorage.setItem(valuekey, JSON.stringify({ ttl: Date.now() + retval.ttl, value: retval.value }));
  receiver(retval.value);
}

//ADDME trim expired wh-adhoccache values
//ADDME blocking/merging calls (when requesting the same value multiple times, return it only once)

})();
