var onClientReady;

(function() {
  /**
   * Relays messages to/from the iframe.
   * This function is called from the container to the hangout IFRAME
   * and from the child IFRAME to the hangout IFRAME.
   */
  function relayMessages() {
    var destination;
    if (this['f'] == '..') {
      // 'this' is bound to an object that contains the full request.
      // 'f' == '..' means that the message is coming from the top-level window,
      // eg the hangout itself.
      // This is the scenario where you want to pass the message to the child
      // IFRAME.
      destination = 'googleplus_target';
    } else {
      // The message is coming from the child IFRAME. Relay it to parent.
      destination = '..';
    }
    var rpcArgs = [
      destination,   // the place you want to send the message
      this['s'],     // the service name of the originating request
      null            // the callback method, not used here.
    ].concat(this['a']);  // the arguments originally passed to the service.
    // Send the message.
    gadgets.rpc.call.apply(gadgets.rpc, rpcArgs);
  }

  /** 
   * Creates the nested iframe.
   */
  function createIFrame() {
    // Get the Url of the xml file including the params.
    var fullApplicationUrl = gadgets.views.getParams()['applicationUrl'];
    var target = getUrlParams(fullApplicationUrl).appUrl;
    var targetRoot = getUrlRoot(target);
    var targetParams = getUrlParams(target);

    // The appData.
    targetParams.gd = gadgets.views.getParams()['appData'];
    targetParams.parent = window.location.href;

    // This builds the inner IFRAME that exists in the desired domain
    var ifrm = document.createElement('IFRAME');
    var ifrm_id = 'googleplus_target';
    // TOOD(peterhal): Oauth tokens.
    ifrm.setAttribute('src',
        targetRoot + encodeUrlParams(targetParams));
    ifrm.style.width = '100%';

    // TODO(peterhal): What is the correct height?
    ifrm.style.height = '100%';

    ifrm.setAttribute('id', ifrm_id);
    ifrm.setAttribute('name', ifrm_id);
    ifrm.setAttribute('scrolling','no');
    ifrm.setAttribute('marginwidth','0');
    ifrm.setAttribute('marginheight','0');
    ifrm.setAttribute('frameborder','0');
    ifrm.setAttribute('vspace','0');
    ifrm.setAttribute('hspace','0');
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

  onClientReady = onReady;
  loadScript('https://apis.google.com/js/client.js?onload=onClientReady');
})();
