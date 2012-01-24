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

// Scale limits -- tiny hats look silly, but tiny monocles are fun.
var gMinScale = [];
var gMaxScale = [];

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

// array of sound resources that we may play
var gSentSounds = new Array();
gSentSounds['typing'] = gapi.hangout.av.effects.createAudioResource(
    'http://hangout-apps.googlecode.com/svn/trunk/fx/sounds/typing.wav').createSound();
gSentSounds['whistle'] = gapi.hangout.av.effects.createAudioResource(
    'http://hangout-apps.googlecode.com/svn/fx/sounds/whistle.wav').createSound();


// array of sound resources that we may play upon message receipt
var gAlertSounds = new Array();
gAlertSounds['typing'] = gapi.hangout.av.effects.createAudioResource(
    'http://hangout-apps.googlecode.com/svn/trunk/fx/sounds/typing.wav').createSound();
gAlertSounds['whistle'] = gapi.hangout.av.effects.createAudioResource(
    'http://hangout-apps.googlecode.com/svn/fx/sounds/whistle.wav').createSound();

// simple function to play one of the labeled alert sounds
function playgAlertSounds(whichAlert) 
{
   if(whichAlert in gAlertSounds) gAlertSounds[whichAlert].play({loop: false});
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
    gMinScale['hat'] = 0.25;
    gMaxScale['hat'] = 1.5;

    var mono = gapi.hangout.av.effects.createImageResource(
        'https://hangout-apps.googlecode.com/svn/trunk/fx/images/monocle.png');
    gOverlays['monocle'] = mono.createFaceTrackingOverlay(
        {'trackingFeature':
         gapi.hangout.av.effects.FaceTrackingFeature.RIGHT_EYE,
         'scaleWithFace': true,
         'scale': 0.5});
    gMinScale['monocle'] = 0.5;
    gMaxScale['monocle'] = 1.5;

    var stache = gapi.hangout.av.effects.createImageResource(
        'https://hangout-apps.googlecode.com/svn/trunk/fx/images/mustache.png');
    gOverlays['stache'] = stache.createFaceTrackingOverlay(
        {'trackingFeature':
         gapi.hangout.av.effects.FaceTrackingFeature.NOSE_TIP,
         'scaleWithFace': true,
         'rotateWithFace': true});
    gMinScale['stache'] = 0.65;
    gMaxScale['stache'] = 2.5;
}

// called when the state changes, which may indicate that there may be a new
// message for the local user which we should display
function onStateChanged(event) 
{
    try 
    {
        state = event.state;
        metadata = event.metadata;

        // loop through the keys in the state, whih currently are just message entries
        // the message keys all have the following format:
        // recipient-id:sender-id:alert-sound-tag
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
                    var senderId = splitKey[1];
                    var sender = gapi.hangout.getParticipantById(senderId);
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
                    $('#messageDisplay').append(replyButton);
                    $('#messageDisplay').show(100);                    
                    gapi.hangout.data.clearValue(key);
                    playgAlertSounds(splitKey[2]);
                    gapi.hangout.layout.displayNotice(message, true);
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
// recipient-id:sender-id:alert-sound-tag
// the value this key maps to is the actual message to send.
function sendMessage(message, gAlertSounds) 
{
    gDialog.dialog('close');
    var key = gRecipient + ":" + gMyId + ":" + gAlertSounds;
    state = {};
    state[key] = message;
    gapi.hangout.data.submitDelta(state);
    if(gHideMessageDisplayAfterSend)
    {
        gHideMessageDisplayAfterSend = false;
        $('#messageDisplay').hide();
    }
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
                'id': 'msg-button-' + i,
                'width': '20',
                'alt': 'Send Message',
                'style': 'float:right;cursor:pointer;',
                'src': 'https://hangout-apps.googlecode.com/svn/trunk/fx/css/private-msg-icon.png'
            });	  
            
            msgButton.click(function() {
                gRecipient = p.id;
                gDialog.dialog('open');
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
            	'style': "vertical-align:middle;width:28px",
            	})
                .append(msgButton);
                
            partyRow.append(avatarCell, nameCell, msgButtonCell);
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
                'Alert sound: <select id="gAlertSoundsMenu"><option value="none">None</option>' + 
                '<option value="typing">Typing</option><option value="whistle">Whistle</option></select>' + 
                '<br><br><center><input type="button" onclick="sendMessage(document.getElementById(\'msgbox\').value, ' + 
                'document.getElementById(\'gAlertSoundsMenu\').value)" value="Send" /></center>')
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

    gapi.hangout.onApiReady.add(function(eventObj) {
        if(eventObj.isApiReady) 
        {
            // get the main div container for the app
            gContainer = $('#participant-list');
			
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
