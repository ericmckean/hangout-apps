// some handy globals

// the main container div for the app
var gContainer = null;

// we store and update a list of the participants currently running this app
var gEnabledParticipants = null;

// used to store the participant we are currently trying to send a message to
var gRecipient = null;

// holds the jquery dialog that we pop up whenever the user wants to send a message
var gDialog = null;

// stores local participant ID, just so we don't have to make an API call all the time to get it
var gMyId = null;

// list of most recent messages recieved -- one per sender
// this exists so that when the state updates, we only display a message
// sent to the local user if it hasn't been recieved and displayed before.
var gLastMessages = new Array();

// array of sound resources that we may play upon message receipt
var alertSound = new Array();
alertSound['typing'] = gapi.hangout.av.effects.createAudioResource(
    'http://hangout-apps.googlecode.com/svn/trunk/fx/sounds/typing.wav').createSound();
alertSound['whistle'] = gapi.hangout.av.effects.createAudioResource(
    'http://hangout-apps.googlecode.com/svn/fx/sounds/whistle.wav').createSound();

// simple function to play one of the labeled alert sounds
function playAlertSound(whichAlert) 
{
   if(whichAlert in alertSound) alertSound[whichAlert].play({loop: false});
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

                    // display the message and remove it from the state object -- also play any alert sound requested
                    $('#messageDisplay').text(message);
                    gapi.hangout.data.clearValue(key);
                    playAlertSound(splitKey[2]);
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
function sendMessage(message, alertSound) 
{
    gDialog.dialog('close');
    var key = gRecipient + ":" + gMyId + ":" + alertSound;
    state = {};
    state[key] = message;
    gapi.hangout.data.submitDelta(state);
}

// just renders the app in the main container div
function render() 
{
      gContainer.empty().append(createUserList());
}

// creates a series of divs showing the avatar thumbnail and name of each enabled
// participant.  Each div has an onclick handler to open the send message dialog
// for that participant when the div is clicked on.  Obviously this UI will change,
// but is just a simple way to test the functionality at the moment.
function createUserList() 
{
    temp = $('<div />');
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
            temp.append($('<div />').append(avatar, $('<span />').text(p.person.displayName)).click(function() {
                gRecipient = p.id;
                gDialog.dialog('open');
                return false;
            }));
        }
    }	

    return temp;
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
                'Alert sound: <select id="alertSoundMenu"><option value="none">None</option>' + 
                '<option value="typing">Typing</option><option value="whistle">Whistle</option></select>' + 
                '<br><br><center><input type="button" onclick="sendMessage(document.getElementById(\'msgbox\').value, ' + 
                'document.getElementById(\'alertSoundMenu\').value)" value="Send" /></center>')
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
            // create the main div container for the app
            gContainer = $('<div />');
            var body = $('body');
            body.append(gContainer);
			
            // grab my participant ID and register some event handlers
            gMyId = gapi.hangout.getParticipantId();
            gapi.hangout.data.onStateChanged.add(onStateChanged);
            gapi.hangout.onEnabledParticipantsChanged.add(onParticipantsChanged);
            updateParticipants();
        }
    });
}

gadgets.util.registerOnLoadHandler(init);
