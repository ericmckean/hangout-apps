// some handy globals

// the main container div for the app
var gContainer = null;

// we store and update a list of the participants currently running this app
var gEnabledParticipants = null;

// used to store the participant we are currently trying to send a message to
var gRecipient = null;
var gHideMessageDisplayAfterSend = false;

// holds the jquery dialog that we pop up whenever the user wants to send a message
var gDialog = null;

// stores local participant ID, just so we don't have to make an API call all the time to get it
var gMyId = null;

// list of most recent messages recieved -- one per sender
// this exists so that when the state updates, we only display a message
// sent to the local user if it hasn't been recieved and displayed before.
var gLastMessages = new Array();

// array of gOverlays
var gOverlays = [];

var gUICurrentOverlay = "none";

function selectOverlayButton(name)
{
    $('#hat-button-img').hide();
    $('#monocle-button-img').hide();
    $('#stache-button-img').hide();
    if(gUICurrentOverlay !== name)
    {
        $('#' + name + '-prelight-img').hide();
        $('#' + name + '-button-img').show();
        gUICurrentOverlay = name;
        showOverlay(name);
    }
    else
    {
        $('#' + name + '-prelight-img').show();
    	gUICurrentOverlay = "none";
    	hideOverlay(name);
    }
}

function handlePrelight(name)
{
	$('#hat-prelight-img').hide();
	$('#monocle-prelight-img').hide();
	$('#stache-prelight-img').hide();
	if(name && gUICurrentOverlay !== name)
	    $('#' + name + '-prelight-img').show();
}

// array of sound resources that we may play upon message receipt
var gSoundEffects = new Array();
gSoundEffects['typing'] = gapi.hangout.av.effects.createAudioResource(
    'https://hangout-apps.googlecode.com/svn/trunk/fx/sounds/typing.wav').createSound();
gSoundEffects['goodday'] = gapi.hangout.av.effects.createAudioResource(
    'http://hangoutmediastarter.appspot.com/static/goodday.wav').createSound();
gSoundEffects['whistle'] = gapi.hangout.av.effects.createAudioResource(
    'https://hangout-apps.googlecode.com/svn/fx/sounds/whistle.wav').createSound();
gSoundEffects['applause'] = gapi.hangout.av.effects.createAudioResource(
    'https://hangout-apps.googlecode.com/svn/fx/sounds/applause.wav').createSound();

// simple function to play one of the labeled alert sounds
function playSound(whichAlert) 
{
   if(whichAlert in gSoundEffects)
   {
       gSoundEffects[whichAlert].play({loop: false});
   }
}

// For removing every overlay
function hideAllOverlays() 
{
    for (var index in gOverlays) 
    {
       gOverlays[index].setVisible(false);
    }
}

function hideOverlay(name) 
{
    gOverlays[name].setVisible(false);
}

function showOverlay(name) 
{
    hideAllOverlays();
    gOverlays[name].setVisible(true);
}

// Initialize our constants, build the overlays array
function createOverlays() 
{
    var topHat = gapi.hangout.av.effects.createImageResource(
        'https://hangout-apps.googlecode.com/svn/trunk/fx/images/topHat.png');
    gOverlays['hat'] = topHat.createFaceTrackingOverlay(
        {'trackingFeature':
         gapi.hangout.av.effects.FaceTrackingFeature.NOSE_ROOT,
         'scaleWithFace': true,
         'rotateWithFace': true,
         'scale': 1.0});

    var mono = gapi.hangout.av.effects.createImageResource(
        'https://hangout-apps.googlecode.com/svn/trunk/fx/images/monocle.png');
    gOverlays['monocle'] = mono.createFaceTrackingOverlay(
        {'trackingFeature':
         gapi.hangout.av.effects.FaceTrackingFeature.RIGHT_EYE,
         'scaleWithFace': true,
         'scale': 0.5});

    var stache = gapi.hangout.av.effects.createImageResource(
        'https://hangout-apps.googlecode.com/svn/trunk/fx/images/mustache.png');
    gOverlays['stache'] = stache.createFaceTrackingOverlay(
        {'trackingFeature':
         gapi.hangout.av.effects.FaceTrackingFeature.NOSE_TIP,
         'scaleWithFace': true,
         'rotateWithFace': true});

    var flowers = gapi.hangout.av.effects.createImageResource(
        'https://hangout-apps.googlecode.com/svn/trunk/fx/images/flowers.png');
    gOverlays['flowers'] = flowers.createFaceTrackingOverlay(
        {'trackingFeature':
         gapi.hangout.av.effects.FaceTrackingFeature.LEFT_EYE,
         'offset': {'x': 0.35, 'y': 0.25},
         'scaleWithFace': false,
         'rotateWithFace': false,
         'scale': 0.4});
    gOverlays['flowers'].readableName = "flowers";
}

// called when the state changes, which may indicate that there may be a new
// message for the local user which we should display
function onStateChanged(event) 
{
    try 
    {
        state = event.state;
        metadata = event.metadata;

        // loop through the keys in the state, which currently are just message entries
        // the message keys all have the following format:
        // recipient-id:message-type:sender-id:alert-sound-tag
        for(key in state)
        {
            // see if this entry is a message for the local user
            if(key.indexOf(gMyId) == 0)
            {
                // next make sure we haven't seen this message already
                if(!(key in gLastMessages) || metadata[key].timestamp > gLastMessages[key].timestamp) 
                {
                    gLastMessages[key] = metadata[key];	
                    splitKey = key.split(':');

                    // get the name of the sender of this message
                    var senderId = splitKey[2];
                    var sender = gapi.hangout.getParticipantById(senderId);

                    // get the message type
                    var messageType = splitKey[1];

                    // handle PMs
                    if(messageType === "pm")
		    {
                        var message = sender.person.displayName + ' says: ' + state[key];
 
                        var replyButton = $('<button />')
			    .html('<span style="font-size:12px">Reply</span>')
			    .button()
                            .click(function() {
                                gRecipient = senderId;
                                gHideMessageDisplayAfterSend = true;
                                gDialog.dialog('open');
                                return false;
                            });

                        // display the message and remove it from the state object -- also play any alert sound requested
                        $('#messageDisplay').text(message);
                        $('#messageDisplay').append($('<br />'), replyButton);
                        $('#messageDisplay').show();                    
                        gapi.hangout.data.clearValue(key);
                        playSound(splitKey[3]);
                        gapi.hangout.layout.displayNotice(message, true);
                    }
                    // handle gifts
                    else if(messageType === "gift")
		    {
                        var overlay = state[key];

                        var message = sender.person.displayName + ' has sent you  ' + gOverlays[overlay].readableName + '.';
 
                        var acceptButton = $('<button />')
			    .html('<span style="font-size:12px">Accept</span>')
			    .button()
                            .click(function() {
                                gRecipient = senderId;
				sendGiftResponse(overlay, "none", "accepted"); 
                                showOverlay(overlay);
                                $('#hat-button-img').hide();     //temp
                                $('#monocle-button-img').hide(); //temp
                                $('#stache-button-img').hide();  //temp
                                $('#giftDisplay').hide();
                                return false;
                            });

                        var rejectButton = $('<button />')
			    .html('<span style="font-size:12px">Refuse</span>')
			    .button()
                            .click(function() {
                                gRecipient = senderId;
				sendGiftResponse(overlay, "none", "rejected"); 
                                $('#giftDisplay').hide();
                                return false;
                            });

                        // display the message and remove it from the state object -- also play any alert sound requested
                        $('#giftDisplay').text(message);
                        $('#giftDisplay').append($('<br />'), acceptButton, rejectButton);
                        $('#giftDisplay').show();                    
                        gapi.hangout.data.clearValue(key);
                        playSound(splitKey[3]);
                    }
                    else if(messageType === "gift-accepted")
		    {
                        var overlay = state[key];

                        var message = sender.person.displayName + ' accepted your gift of ' + gOverlays[overlay].readableName + '.';
 
                        // display the message and remove it from the state object -- also play any alert sound requested
                        gapi.hangout.data.clearValue(key);
                        playSound(splitKey[3]);
                        gapi.hangout.layout.displayNotice(message, true);
                    }
                    else if(messageType === "gift-rejected")
		    {
                        var overlay = state[key];

                        var message = sender.person.displayName + ' refused your gift of ' + gOverlays[overlay].readableName + '.';
 
                        // display the message and remove it from the state object -- also play any alert sound requested
                        gapi.hangout.data.clearValue(key);
                        playSound(splitKey[3]);
                        gapi.hangout.layout.displayNotice(message, true);
                    }
                    else if(messageType === "broadcast-sound")
		    {
                        var sound = state[key];

			// remove the message from the state and play the sound
                        gapi.hangout.data.clearValue(key);
                        playSound(sound);
                    }
                }
            }
        }
    } 
    catch (e) 
    {
        console.log('Fail state changed');
        console.log(e);
    }
}

// sends a targeted message by adding a message entry to the state
// the format of the key is:
// recipient-id:pm:sender-id:alert-sound-tag
// the value this key maps to is the actual message to send.
function sendMessage(message, alertSound) 
{
    gDialog.dialog('close');
    var key = gRecipient + ":pm:" + gMyId + ":" + alertSound;
    state = {};
    state[key] = message;
    gapi.hangout.data.submitDelta(state);
    if(gHideMessageDisplayAfterSend)
    {
        gHideMessageDisplayAfterSend = false;
        $('#messageDisplay').hide();
    }
}


// sends a targeted overlay by adding a message entry to the state
// the format of the key is:
// recipient-id:gift:sender-id:alert-sound-tag
// the value this key maps to is the overlay to use.
function sendGift(overlay, alertSound)
{
    var key = gRecipient + ":gift:" + gMyId + ":" + alertSound;
    state = {};
    state[key] = overlay;
    gapi.hangout.data.submitDelta(state);

    var message = "You just sent " + gOverlays[overlay].readableName + " to " 
        + gapi.hangout.getParticipantById(gRecipient).person.displayName;
     gapi.hangout.layout.displayNotice(message, false);
}


// sends a targeted overlay by adding a message entry to the state
// the format of the key is:
// recipient-id:gift-accepted:sender-id:alert-sound-tag
// or
// recipient-id:gift-rejected:sender-id:alert-sound-tag
// the value this key maps to is the overlay to use.
function sendGiftResponse(overlay, alertSound, status)
{
    var key = gRecipient + ":gift-" + status + ":" + gMyId + ":" + alertSound;
    state = {};
    state[key] = overlay;
    gapi.hangout.data.submitDelta(state);
}

function sendSound(sound, recipient)
{
    if(!recipient) recipient = gRecipient;
    var key = recipient + ":sound:" + gMyId;
    state = {};
    state[key] = sound;
    gapi.hangout.data.submitDelta(state);
}

function broadcastSound(sound)
{
    var state = {};
    for (var i = 0, iLen = gEnabledParticipants.length; i < iLen; ++i) 
    {
        var p = gEnabledParticipants[i];
        var key = p.id + ":broadcast-sound:" + gMyId;
        state[key] = sound;
    }
    gapi.hangout.data.submitDelta(state);
}

// just renders the app in the main container div
function render() 
{
      gContainer.empty().append(createUserList());
}

// creates a table showing the avatar thumbnail and name of each enabled
// participant, along with action icons (right now just the message icon).  
// The message icon has a click handler to open the send message dialog.
function createUserList() 
{
    var table = $('<table />').attr({
        'cellspacing': '4',
        'cellpadding': '0',
        'summary': '',
        'width': '100%'
    });
    
    for (var i = 0, iLen = gEnabledParticipants.length; i < iLen; ++i) 
    {
        var p = gEnabledParticipants[i];
        if(p.id !== gMyId)
        {
            var avatar = $('<img />').attr({
                'width': '30',
                'alt': 'Avatar',
                'src': p.person.image && p.person.image.url ? p.person.image.url : ""
            });	  
            var msgButton = $('<img />').attr({
                'id': 'msg-button-' + p.id,
                'name': p.id,
                'width': '20',
                'alt': 'Send Message',
                'style': 'float:right;cursor:pointer;',
                'src': 'https://hangout-apps.googlecode.com/svn/trunk/fx/css/private-msg-icon.png'
            });	  
            msgButton.recipID = p.id;

            msgButton.click(function(event) {
                gRecipient = event.target.name;
                gDialog.dialog('open');
                return false;
            });

            var giftButton = $('<img />').attr({
                'id': 'gift-button-' + p.id,
                'name': p.id,
                'width': '22',
                'alt': 'Send Gift',
                'style': 'float:right;cursor:pointer;',
                'src': 'https://hangout-apps.googlecode.com/svn/trunk/fx/css/flowers-icon.png',
            });	  

            giftButton.click(function(event) {
                gRecipient = event.target.name;
                sendGift('flowers', 'none');
                return false;
            });

            var partyRow = $('<tr />').attr('id', 'party-row-' + i);
            var avatarCell = $('<td />')
                .attr('style', "vertical-align:middle")
                .append(avatar);
            var nameCell = $('<td />')
                .attr('style', "vertical-align:middle")
                .text(p.person.displayName);
            var msgButtonCell = $('<td />').attr({
            	'style': "vertical-align:middle;width:22px",
            	})
                .append(msgButton);
            var giftButtonCell = $('<td />').attr({
            	'style': "vertical-align:middle;width:22px",
            	})
                .append(giftButton);
                
            partyRow.append(avatarCell, nameCell, giftButtonCell, msgButtonCell);
            partyRow.mouseenter(function(event) {
                $('#msg-button-' + i).show();
            });
            table.append(partyRow);
        }
    }	

    return table;
}

// updates the local list of enabled participants
function updateParticipants() 
{
    gEnabledParticipants = gapi.hangout.getEnabledParticipants();
    render();
}

// called when the list of enabled participants changes
function onParticipantsChanged(event) 
{
    updateParticipants();
}

// called on page load
function init() 
{
    $(document).ready(function() {
        // setup the jquery dialog used to enter messages
        gDialog = $('<div></div>')
            .html('<textarea style="display:block;width:370px" id="msgbox"></textarea><br>' + 
                'Alert sound: <select id="alertSoundsMenu"><option value="none">None</option>' + 
                '<option value="typing">Typing</option><option value="whistle">Whistle</option></select>' + 
                '<br><br><center><input type="button" onclick="sendMessage(document.getElementById(\'msgbox\').value, ' + 
                'document.getElementById(\'alertSoundsMenu\').value)" value="Send" /></center>')
            .dialog({
                autoOpen: false,
                title: 'Send Message',
                resizable: false,
                draggable: true,
                modal: true,
                width: 400,
                height: 240,
                closeOnEscape: true
            });

    });

    // get the main div container for the app
    gContainer = $('#participant-list');

    var soundDiv = $('#sound-broadcast');
    var soundSelect = $('<select />').attr({'id': 'broadcast-sound-select'});
    soundSelect.append($('<option />').attr({'value' : 'goodday'}).text('Good Day'));
    soundSelect.append($('<option />').attr({'value' : 'typing'}).text('Typing'));
    var playButton = $('<button />')
	     	    .html('<img src="https://hangout-apps.googlecode.com/svn/trunk/fx/css/speaker-icon.png">')
	       	    .button()
                    .click(function() {
      		        broadcastSound($('#broadcast-sound-select :selected').val());
                        return false;
                    });
    soundDiv.append(soundSelect, playButton);

    gapi.hangout.onApiReady.add(function(eventObj) {
        if(eventObj.isApiReady) 
        {
            // grab my participant ID and register some event handlers
            gMyId = gapi.hangout.getParticipantId();
            gapi.hangout.data.onStateChanged.add(onStateChanged);
            gapi.hangout.onEnabledParticipantsChanged.add(onParticipantsChanged);
            createOverlays();
            updateParticipants();
        }
    });
}

gadgets.util.registerOnLoadHandler(init);
