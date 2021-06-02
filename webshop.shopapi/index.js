/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.net.jsonrpc');
require ('consilio.suggest');
require ('wh.net.url');
/*! LOAD: frameworks.mootools.core, wh.compat.base, wh.net.jsonrpc, consilio.suggest, wh.net.url
!*/

(function($) { //mootools wrapper

var WebShopProductSearchService = new Class(
{ Extends: $consilio.SuggestService
, options: { url: '/wh_services/webshop/shop'
           , rpccall: "SuggestProduct"
           , module: "webshop"
           , tag: null
           }
});
var WebShopProductSuggestSearch = new Class(
{ Extends: $consilio.Suggest
});

$wh.WebshopAPI = new Class(
{ Implements: [ Options,Events ]

, options: { debug: false
           , rpcurl: '/wh_services/webshop/shop'
           , tag: null
           }
, rpcservice:null
, cart:null
, basketupdateredirect:null

, initialize:function(options)
  {
    this.setOptions(options);
    this.shoptag = this.options.tag || ($wh.WebshopSettings ? $wh.WebshopSettings.tag : '') || '';
    if($wh.debug.sho)
      this.options.debug=true;

    this.rpcservice = new $wh.JSONRPC({ url: this.options.rpcurl });

    window.addEvent("domready", this.onDomReady.bind(this));
    window.addEvent("wh-after-domready", this.runDelayedEvents.bind(this));
  }
, onDomReady:function()
  {
    $$('form.wh-webshop-addtocart').addEvent("submit", this.onFormAddToCart.bind(this));
    $$('form.wh-webshop-productsearch').each(this.setupProductSearchForm.bind(this));


///OLD - OBSOLETE DOMREADYS


    $$('.wh-webshop-deletebutton').addEvent("click", this.onWebshopDeleteButton.bind(this));
    $$('.wh-webshop-addcouponbutton').addEvent("click", this.onWebshopAddCouponButton.bind(this));
    $$('.wh-webshop-addcoupon').addEvent("keypress", this.onWebshopAddCouponEnter.bind(this));
    $$('.wh-webshop-removecouponbutton').addEvent("click", this.onWebshopRemoveCouponButton.bind(this));
    $$('.wh-webshop-pointsspentbutton').addEvent("click", this.onWebshopPointsSpentButton.bind(this));
    $$('.wh-webshop-pointsspent').addEvent("keypress", this.onWebshopPointsSpentEnter.bind(this));

    /* Note: if we really need more robust checking for future webshops, simply
       create an option 'ignoreshipping' etc and deal with it that way. no reason
       yet to set up an infrastructure for something quite unlikely in a webshop */

    //is there a shipping address and a toggle?
    if ($('form_setshippingaddress'))
    {
      $('form_setshippingaddress').addEvent("change", this.onShippingAddressChange.bind(this))
      this.onShippingAddressChange();
    }

    var transinfo = $("wh-webshop-transactioninfo");
    if(transinfo)
    {
      if(!$wh.analyticsTransaction)
      {
        console.warn("#wh-webshop-transactioninfo defined but $wh.analyticsTransaction is missing");
      }
      else
      {
        var data = JSON.decode(transinfo.getAttribute("data-webshop-transactioninfo"));
        (function() { $wh.analyticsTransaction(data.orderid, data.total, data.items, data.options) }).delay(10); //give GTM setup a chance to run. FIXME properly integrate...
      }
    }

    //is there an issuer selection?
    var paymentmethods=$$('input[name="paymentmethod"]');
    if(paymentmethods.length)
    {
      paymentmethods.addEvent("change", this.onPaymentMethodChange.bind(this,paymentmethods));
      this.onPaymentMethodChange(paymentmethods);
    }

///END OLD - OBSOLETE DOMREADYS

    try
    {
      var state = JSON.decode(Cookie.read(this.getCookieName()));
    }
    catch(e)
    {
    }

    if(!state)
    {
      this.rpcservice.request('getBasket', [location.href], this.onUpdatedBasket.bind(this, 0));
    }
    else
    {
      this.cart = state.cart;
    }
//    this.runDelayedEvents.bind(this).delay(0); //give other domreadys a chance to run
  }
, runDelayedEvents:function()
  {
    var aftersubmit = Cookie.read(this.getCookieName() + "-aftersubmit");
    if(aftersubmit)
    {
      var action = JSON.decode(aftersubmit);
      if(action.type == "addedproduct")
      {
        this.fireEvent("addedproduct", {target:this, numadded:action.numadded});
      }
      Cookie.dispose(this.getCookieName() + "-aftersubmit");
    }
    this.fireCartEvent();
  }
/*, addEvent:function(eventname,handler)
  {
    this.parent(eventname,handler);
    if(eventname == 'cart')
  }
*/
 //simple public api
, getStoreFrontTag:function()
  {
    return this.shoptag;
  }

  /* submit&redirect on a basket update (to update any server generated content)
     if a storefront url is specified, we will submit to that shop */
, redirectOnBasketUpdate:function(storefronturl)
  {
    this.basketupdateredirect = storefronturl || '';
  }


 //form handlers
, onFormAddToCart:function(event)
  {
    event.stop();
    this.handleAddToCartForm(event.target);
  }
, handleAddToCartForm:function(form)
  {
    var productidnode = form.getElement('*[name="productid"]');
    if(!productidnode)
      throw new Error("Form has no member named 'productid'");
    if(!productidnode.value)
      throw new Error("Form productid has no value");

    var amountnode = form.getElement('*[name="amount"]');
    var amount = (amountnode && amountnode.value ? amountnode.value : '').toInt() || 1;
    var baskettag = productidnode.value;

    Array.each(form.getElements('*[name="productoption"]'), function(element)
    {
      if(element.value)
        baskettag += '_' + element.value;
    });
    this.submitOrder(baskettag, amount);
  }
, submitOrder: function(productid, amount)
  {
    if(this.options.debug)
      console.log('[webshop] add ' + amount + ' of product ' + productid);

    if(this.basketupdateredirect !== null)
    {
      var shopurl = this.basketupdateredirect || location.href;
      var submiturl = $wh.resolveToAbsoluteURL(shopurl, "/.webshop/act/addproduct.shtml");
      $wh.submitForm(submiturl, { type:'addproduct'
                                , baskettag: productid
                                , amount: amount
                                , shopurl: shopurl
                                });
    }
    else
    {
      this.rpcservice.request('addtobasket', [ location.href, productid, amount || 1 ], this.onUpdatedBasket.bind(this, amount));
    }
  }

, onUpdatedBasket:function(numadded, response)
  {
    this.cart = response.cart;
    this.storeShopState();

    if(numadded)
      this.fireEvent("addedproduct", {target:this, numadded:numadded});
  }


///OLD - OBSOLETE APIs
, isEnterPressed:function(event)
  {
    var keycode = event.keyCode ? event.keyCode : event.which;
    return keycode==13;
  }

, onPaymentMethodChange:function(paymentmethods,event) //disable/enable the associated issuer selection
  {
    paymentmethods.each(function(el)
      {
        //if this is <input name=paymentmethod value=105586, we control <select name=issuer_105586
        var fields = $$('select[name="issuer_' + el.value + '"]');
        fields.set("disabled",el.checked ? null : "disabled");
      });
  }

, onShippingAddressChange:function()
  {
    var checked = $('form_setshippingaddress').checked;
    //disable any fields detected to be part of the shipping address
    var fields = $$('input[name^="shippingaddress"], select[name^="shippingaddress"]');
    fields.set("disabled",checked ? null : "disabled");

    //apply-remove addressdisabled hwere needed
    $$('.wh-webshop-shippingaddress').toggleClass('disabled', !checked);
  }

, onWebshopOrderButton:function(event, button)
  {
    event.stop();

    var baskettag = button.getAttribute('data-baskettag');
    var amount = 1;
    if(!baskettag) //No explicit baskettag.
    {
      var form = button.getParent('form[data-webshop-productid]');
      if(form)
      {
        baskettag = form.getAttribute("data-webshop-productid");
        var amounttext = form.getAttribute("data-webshop-productid")

        Array.each(form.getElements(".wh-webshop-productoption"), function(element)
          {
            if(element.get('tag') != 'select')
            {
              console.error("Unsure how to interpret productoption", element);
              throw new Error("Unsure how to interpret productoption");
            }
            if(element.value)
              baskettag += '_' + element.value;
          });
      }
    }
    if(!baskettag)
    {
      console.error("Webshop order button has no data-baskettag attribute and no webshop-productid container", button);
      return;
    }

    this.submitOrder(baskettag, 1);
  }

, onWebshopAddCouponEnter:function(event)
  {
    if(!this.isEnterPressed(event))
      return true;

    event.stop();
    this.addCouponCode(event.target.value);
  }
, onWebshopAddCouponButton:function(event)
  {
    var couponelement = $$('input.wh-webshop-addcoupon').pick();
    if(!couponelement)
      return console.error("Unable to locate coupon code element input.wh-webshop-addcoupon");
    this.addCouponCode(couponelement.value);
  }

, onWebshopRemoveCouponButton:function(event)
  {
    var couponelement = event.target.getSelfOrParent('.wh-webshop-removecouponbutton');
    var couponcode = couponelement.getAttribute('data-couponcode');

    if(!couponcode)
      return console.error("wh-webshop-removecoupon has no couponcode");
    this.removeCouponCode(couponcode);
  }

, onWebshopPointsSpentEnter:function(event)
  {
    if(!this.isEnterPressed(event))
      return true;

    event.stop();
    this.setPointsSpent(event.target.value);
  }
, onWebshopPointsSpentButton:function(event)
  {
    var couponelement = $$('input.wh-webshop-pointsspent').pick();
    if(!couponelement)
      return console.error("Unable to locate coupon code element input.wh-webshop-pointsspent");
    this.setPointsSpent(couponelement.value);
  }

, onWebshopDeleteButton:function(event)
  {
    var button = event.target.getSelfOrParent('.wh-webshop-deletebutton');
    var baskettag = button.getAttribute('data-baskettag');
    if(!baskettag)
    {
      console.error("Webshop delete button has no data-baskettag attribute", button);
      return;
    }

    var vars = {ws_action:'updatebasket', ws_posttoget:1 };
    vars['ws_setamount_' + baskettag]=0;
    this.executeShopPost(vars);
  }

, addCouponCode:function(couponcode)
  {
    var vars = {ws_action:'updateorder' };
    vars['ws_addcoupon']=couponcode;
    this.executeShopPost(vars);
  }

, removeCouponCode:function(couponcode)
  {
    var vars = {ws_action:'updateorder' };
    vars['ws_removecoupon']=couponcode;
    this.executeShopPost(vars);
  }

, setPointsSpent:function(points)
  {
    var vars = {ws_action:'updateorder' };
    vars['ws_setpointsspent']=points;
    this.executeShopPost(vars);
  }

, getCookieName:function()
  {
    return 'ws_' + this.shoptag.toLowerCase();
  }
, storeShopState:function(cart)
  {
    Cookie.write(this.getCookieName(), JSON.encode({ cart: this.cart }));
  }
, centsToMoney:function(cents)
  {
    return Math.floor(cents/100) + ',' + ('0' + cents%100).slice(-2);
  }
, fireCartEvent:function()
  {
    var e = { target: this
            , cart: { numarticles: this.cart ? this.cart.n : 0
                    , basicproducttotal_formatted: this.cart ? this.centsToMoney(this.cart.bpt) : ''
                    }
            };

    this.fireEvent("cart", e);
  }

, executeShopPost: function(vars)
  {
    var form = new Element("form", { method: "post"
                                   , action: location.href
                                   , styles: { position:"absolute" }
                                   });
    Object.each(vars,function(value,name)
      { form.adopt(new Element("input", { type:"hidden", name: name, value: value })) });

    $(document.body).adopt(form);
    form.submit();
  }

, gotSubmitOrderResult:function(responseTree, responseElements, responseHTML, responseJavaScript)
  {
    this.fireEvent("addedproduct", {responseTree:responseTree
                                   ,responseElements:responseElements
                                   ,responseHTML:responseHTML
                                   ,responseJavaScript:responseJavaScript
                                   });
  }

, setupProductSearchForm:function(form)
  {
    var searchfield = form.getElement('input[name="search"]');
    if(!searchfield)
      return console.error("setupProductSearchForm could not find a search field in the form",form);

    form.addEvent('submit', this.onProductSearchSubmit.bind(this, searchfield));

    var searchservice = new WebShopProductSearchService({ module: 'webshop', tag: location.href.split('?')[0] });
    var searcher = new WebShopProductSuggestSearch(searchfield, searchservice, { onValueselected: this.onProductSearchValue.bind(this,form,searchfield) } );
    if(this.options.debug)
      console.log("[webshop] attached searchform to input ", searchfield);
  }
, onProductSearchValue:function(form, searchfield)
  {
    location.href = $wh.config.webshop.catalogroot + "!/search/" + encodeURIComponent(searchfield.value);
  }
, onProductSearchSubmit:function(searchfield,event)
  {
    event.stop();
    location.href = $wh.config.webshop.catalogroot + "!/search/" + encodeURIComponent(searchfield.value);
  }
});

if($wh.config.webshop)
  $wh.webshop = new $wh.WebshopAPI($wh.config.webshop);

})(document.id); //end mootools wrapper
