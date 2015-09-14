/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.net.jsonrpc');
require ('wh.util.template');
require ('wh.google.recaptcha');
/*! LOAD: frameworks.mootools.core, wh.compat.base, wh.net.jsonrpc, wh.util.template, wh.google.recaptcha !*/

(function($) { //mootools wrapper

$wh.WebpackCommentsPlugin = new Class(
{ Implements: [ Options, Events ]
, el: null
, options: { }
, fsobjectid: null
, service:null
, addcommentform: null
, state: null

, recaptcha:null

, initialize:function(el, options)
  {
    this.setOptions(options);
    this.el = $(el);
    this.fsobjectid = this.el.getAttribute("data-fsobjectid").toInt();
    if(!this.fsobjectid)
      throw new Error("CommentPlugin did not receive an objectid");

    var addcommentform = this.el.getAttribute("data-addcommentform");
    if(addcommentform)
    {
      this.addcommentform = $$(addcommentform).pick();
      if(!this.addcommentform)
      {
        console.error("Invalid post form reference:", addcommentform, this.addcommentform);
        throw new Error("Invalid post form");
      }

      this.addcommentform.addEvent("submit", this.onAddComment.bind(this));
      if(this.addcommentform.getAttribute("data-recaptchanode"))
      {
        var recaptchanode = this.addcommentform.getElement(this.addcommentform.getAttribute("data-recaptchanode"));
        if(!recaptchanode)
          throw new Error("Invalid recaptcha node");

        this.recaptcha = new $wh.GoogleRecaptcha(recaptchanode);
      }
    }

    this.service = new $wh.JSONRPC({url:'/wh_services/blexdev_forum/rpc'});
    var req = this.service.request('GetState', [ this.fsobjectid, true ], this.onGotState.bind(this));

    new $wh.Preloader( [ req, this.recaptcha].clean(), { onComplete:this.processState.bind(this) });
  }
, onGotState:function(response)
  {
    this.state=response;
  }
, processState:function()
  {
    if(!this.state || !this.state.success)
      return;

    if(this.state.closed)
    {
      this.addcommentform.addClass("wh-forum-closed");
    }
    else
    {
      this.addcommentform.addClass("wh-forum-open");
    }

    var commenttemplate = this.el.getAttribute("data-commenttemplate");
    if(commenttemplate)
    {
      var commentel = $$(commenttemplate).pick();
      if(!commentel)
      {
        console.error("Invalid comment template:", commenttemplate, commentel);
        throw new Error("Invalid comment template");
      }

      Array.each(this.state.entries, function(entry)
      {
        if(entry.creationdate && Date.parse)
        {
          entry.creationdate = Date.parse(entry.creationdate).format();
        }
      });

      $wh.expandTemplate(commentel, this.state.entries);
    }

    this.fireEvent("init", { numentries: this.state.numentries });
  }
, onAddComment:function(event)
  {
    event.stop();
    if(this.recaptcha && !this.recaptcha.isValid())
    {
      console.log("recaptcha missing");
      return;
    }

    var data = { name: this.addcommentform.getElement('*[name="name"]').value
               , email: this.addcommentform.getElement('*[name="email"]').value
               , message: this.addcommentform.getElement('*[name="message"]').value
               , recaptcha: this.recaptcha.getResponse()
               };

    this.service.request("PostComment", [ this.fsobjectid, data ], this.onAddedComment.bind(this));
  }
, onAddedComment:function(response)
  {
    if(response.success)
      window.location.reload();
  }
});

})(document.id); //end mootools wrapper
