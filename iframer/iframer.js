var onClientReady;

(function() {
  function relayMessages() {
    // this function is called for all cross-domain calls:
    // from the container to the hangout IFRAME
    // and from the child IFRAME to the hangout IFRAME
    var sendToId;
    if (this['f'] == "..") {
      // "this" is bound to an object that contains the full request.
      // "f" == ".." means that the message is coming from the top-level window,
      // eg the hangout itself.
      // This is the scenario where you want to pass the message to the child
      // IFRAME.
      sendToId = "googleplus_target";
    } else {
      // The message is coming from the child IFRAME. Relay it to parent.
      sendToId = "..";
    }
    var rpcArgs = [
      sendToId,   // the place you want to send the message
      this["s"],     // the service name of the originating request
      null            // the callback method, not used here.
    ].concat(this["a"]);  // the arguments originally passed to the service.
    // Send the message.
    gadgets.rpc.call.apply(gadgets.rpc, rpcArgs);
  }

  // Extracts url parameters of the containing window/iframe into an object.
  function getUrlParams(url) {
    var result = {};
    var paramRegex = /([^&=]+)=?([^&]*)/g;
    var decode = function(value) {
      var addRegex = /\+/g;
      return decodeURIComponent(value.replace(addRegex, " "));
    };
    var allParams = url.substring(url.indexOf('?') + 1);
    while (match = paramRegex.exec(allParams)) {
      result[decode(match[1])] = decode(match[2]);
    }
    return result;
  }
  function encodeUrlParams(params) {
    var result = '';
    for (var key in params) {
      result += (result.length === 0) ? '?' : '&';
      result += key + '=' + encodeURIComponent(params[key]);
    }
    return result;
  }
  function createIFrame() {
    var urlParams = getUrlParams(window.location.href);
    var hangoutUrl = urlParams.parent;

    // target is the hash without the '#'
    var fullApplicationUrl = gadgets.views.getParams()['applicationUrl'];
    // TODO: # in hangotu app url prevents retrieving app metadata.
    // var hashIndex = fullApplicationUrl.indexOf('#');
    // if (hashIndex === -1) { throw 'Missing redirect URL'; }
    // var target = fullApplicationUrl.substr(hashIndex + 1);
    var target = getUrlParams(fullApplicationUrl).appUrl;

    // The appData.
    var gd = gadgets.views.getParams()['appData'];

    // This builds the inner IFRAME that exists in the desired domain
    var ifrm = document.createElement("IFRAME");
    var ifrm_id = "googleplus_target";
    // TOOD(peterhal): Oauth tokens.
    ifrm.setAttribute("src",
        target + encodeUrlParams({
          parent: window.location.href,
          gd: gd,
          hangoutServer: hangoutUrl
        }));
    ifrm.style.width = 100+"%";

    // TODO(peterhal): What is the correct height?
    ifrm.style.height = 1000+"px"

    ifrm.setAttribute("id", ifrm_id);
    ifrm.setAttribute("name", ifrm_id);
    ifrm.setAttribute("scrolling","yes");
    ifrm.setAttribute("frameborder","0");
    ifrm.setAttribute("border","0");
    document.body.appendChild(ifrm);

    // This allows us to receive RPCs from the new IFRAME
    gadgets.rpc.setupReceiver(ifrm_id);
  }
  function setupRpcRelay() {
    // Intercept all rpc messages.
    gadgets.rpc.registerDefault(relayMessages);
  }
  function onReady() {
    setupRpcRelay();
    window.setTimeout(createIFrame, 1);
  }
  function writeTag(tag) {
    document.write(tag);
  }

  function loadScript(url) {
    writeTag('<script type="text/javascript" src="' + url +
        '"><' + '/script>'); // Split script tag so it isn’t used as end of tag.
  }

  onClientReady = onReady;
  loadScript('https://apis.google.com/js/client.js?onload=onClientReady');
})();
