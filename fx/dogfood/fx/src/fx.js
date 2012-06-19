// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview Implements the Google Hangouts Effects app.
 *   Requires that jquery and googui jquery plugin have been loaded.
 * @author jbaer@google.com (Jeremy Baer)
 */

// structures to handle overlays
var gOverlays = [];
var gPluginOverlays = [];
var gOverlayData = [];
var gExclusionMap = [];
var gOverlayState = [];
var gOverlayTimestamps = [];
var gOverlayRoot = gResourceRoot;
var gEnabledOnStartup = [];

var gCategoryUI = [];
var gCurrentCat = 0;
var gCategoryAnimationMutex = false;

var gApplicationName = "Effects";

var gParticipants = [];

var gStrings = [];

/**
 * Given a string tag, returns the string for that tag in the current 
 * language. 
 * @param {string} tag The tag name
 * @return {string} The localized string 
 */
function getLocalizedString(tag)
{
  if(gStrings && tag in gStrings)
    return gStrings[tag];
  else return tag;
}


/**
 * Setup the overlays themselves, as well as a map of overlay IDs to categories
 */
function setupOverlays()
{
  // create a flat list of tracking overlays by iterating over our overlay data 
  // structure
  for (var i = 0; i < gOverlayData.length; i++) {
    var overlays = gOverlayData[i].overlays;
    for (var j  = 0; j < overlays.length; j++) {
      var overlay = overlays[j];
      gOverlays[overlay.id] = overlay;
      for(var k = 0; k < overlay.exclusions.length; k++) {
        if(!(overlay.exclusions[k] in gExclusionMap))
          gExclusionMap[overlay.exclusions[k]] = new Array();
        gExclusionMap[overlay.exclusions[k]].push(overlay);
      }
      if(!(overlay.id in gPluginOverlays)) {
        var image = gapi.hangout.av.effects.createImageResource(overlay.resource);
        if(overlay.type === "FaceTrackingVideoOverlay")
          gPluginOverlays[overlay.id] = image.createFaceTrackingOverlay(overlay.options);
        else if(overlay.type === "StaticVideoOverlay")
          gPluginOverlays[overlay.id] = image.createOverlay(overlay.options);
      }
    }
  }
}


function createEffectFromConfig(object, effectNum)
{
  if(object.type === 'FaceTrackingVideoOverlay' && object.name && object.icon 
    && object.overlay) {
    var newEffect = {
      type: object.type,
      name: object.name,
      id: "ftoverlay-" + effectNum,
      icon: object.icon,
      resource: object.overlay,
      options: {trackingFeature:
                gapi.hangout.av.effects.FaceTrackingFeature.NOSE_ROOT, 
                offset: {x: 0.0, y: 0.0},
                scaleWithFace: true,
                rotateWithFace: true,
                scale: 1.0,
                rotation: 0.0}
    };
    if(object.exclusionTags) newEffect.exclusions = object.exclusionTags.split(",");
    if(object.faceTrackingFeature) newEffect.options.trackingFeature = object.faceTrackingFeature;
    if(object.xOffset) newEffect.options.offset.x = object.xOffset;
    if(object.yOffset) newEffect.options.offset.y = object.yOffset;
    if(object.scale) newEffect.options.scale = object.scale;
    if(object.rotation) newEffect.options.rotation = object.rotation;
    if(object.scaleWithFace) newEffect.options.scaleWithFace = object.scaleWithFace;
    if(object.rotateWithFace) newEffect.options.rotateWithFace = object.rotateWithFace;
    if(object.localizationID) newEffect['localizationID'] = object.localizationID;
    return newEffect;
  }
  else if(object.type === 'StaticVideoOverlay' && object.name && object.icon 
    && object.overlay) {
    var newEffect = {
      type: object.type,
      name: object.name,
      id: "overlay-" + effectNum,
      icon: object.icon,
      resource: object.overlay,
      options: {position: {x: 0.0, y: 0.0},
                scale: {magnitude: 1.0},
                rotation: 0.0}
    };
    if(object.exclusionTags) newEffect.exclusions = object.exclusionTags.split(",");
    if(object.xPosition) newEffect.options.position.x = object.xPosition;
    if(object.yPosition) newEffect.options.position.y = object.yPosition;
    if(object.scale) newEffect.options.scale.magnitude = object.scale;
    if(object.scaleReference) newEffect.options.scale.reference = object.scaleReference;
    if(object.rotation) newEffect.options.rotation = object.rotation;
    if(object.localizationID) newEffect['localizationID'] = object.localizationID;
    return newEffect;
  }
  else return null;
}

function setEffectsAppConfig(data)
{
  if(data.type && data.type === "Application")
  {
    if(data.name) gApplicationName = data.name;
    gOverlayData = [];
    if(data.children) {
      var objNum = 0;
      var objects = data.children;
      for(var i = 0; i < objects.length; i++) {
        var object = objects[i];
        // now see what type of an object we got
        if(object.type) {
          // if category 
          if(object.type === 'Category' && object.name) {
            var newCat = {
              id: "category-" + objNum++,
              title: object.name,
              overlays: []
            };
            if(object.localizationID) 
              newCat['localizationID'] = object.localizationID;
            gOverlayData.push(newCat);
            if(object.children) {
              var children = object.children;
              for(var j = 0; j < children.length; j++) {
		  var newEffect = createEffectFromConfig(children[j], objNum++);
                if(newEffect != null) newCat.overlays.push(newEffect);
              }
            }
          }
          else {
	      var newEffect = createEffectFromConfig(object, objNum++);
            if(newEffect != null) {
              var unCategory;
              if(gOverlayData[0] && gOverlayData[0].id === 'uncategorized') {
                unCategory = gOverlayData[0];
              }
              else {
                unCategory = {
                  id: "uncategorized",
                  title: "",
                  overlays: []
                };
	        gOverlayData.unshift(unCategory);
              }
              unCategory.overlays.push(newEffect);
            }
          }
        }
      }
    }
  }

  $('#title-span').html(gApplicationName);
  createOverlayUI();
}



/**
 * Function that selects an overlay by id.  It displays the overlay,
 * hides any overlay in the same category that was previously 
 * shown, and updates the UI.
 * @param {string} name The name (id) of the overlay
 */
function selectOverlay(name)
{
  effectOn = gOverlayState[name];

  var exclusions = gOverlays[name].exclusions;
  for(var i = 0; i < exclusions.length; i++) {
    var overlays = gExclusionMap[exclusions[i]];  
    for(var j = 0; j < overlays.length; j++) {
      var overlay = overlays[j];
      if(gOverlayState[overlay.id]) {
        $('#' + overlay.id + '-button').googButton('toggleOff');
        hideOverlay(overlay.id);
	document.getElementById(overlay.id +'-spotlight').style.opacity = 0;
        $('#' + overlay.id + '-spotlight').hide();
      }
    }
  }
      
  if(!effectOn) {
    $('#' + name + '-button').googButton('toggleOn');
    var position = $('#' + name + '-button').position();
    $('#' + name + '-spotlight')
      .css({
        'top' : position.top - 35 + gOverlayData[gCurrentCat].ui.get(0).scrollTop,
        'left' : position.left - 35
    });
    $('#' + name + '-spotlight').show();
    document.getElementById(name + '-spotlight').style.opacity = 1;
    showOverlay(name);
  }
}



/**
 * Helper function that hides all overlays and updates UI.
 */
function hideAllOverlays()
{
  for (var index in gPluginOverlays) {
    gPluginOverlays[index].setVisible(false);
    $('#' + index + '-button').googButton('toggleOff');
    document.getElementById(index +'-spotlight').style.opacity = 0;
    $('#' + index + '-spotlight').hide();
    gOverlayState[index] = false;
  }
}

/**
 * Helper function that hides a particular overlay
 * @param {string} name The name (id) of the overlay
 */
function hideOverlay(name)
{
  if(gPluginOverlays[name].isVisible()) {
    gPluginOverlays[name].setVisible(false);
    gOverlayState[name] = false;
    var curTime = new Date();
    var timeShownMs = curTime - gOverlayTimestamps[name];
    fireGAEvent("Effects", "Overlay_Data", name, timeShownMs);
  }
}

/**
 * Helper function that shows a particular overlay
 * @param {string} name The name (id) of the overlay
 */
function showOverlay(name)
{
  if(!gPluginOverlays[name].isVisible()) {
    gPluginOverlays[name].setVisible(true);
    gOverlayState[name] = true;
    gOverlayTimestamps[name] = new Date();
    fireGAEvent("Effects", "Show_Overlay_Hist", "" + gParticipants.length, 1);
    fireGAEvent("Effects", "Show_Overlay", name, gParticipants.length);
  }
}


function randomizeOverlays(maxOverlays)
{
  var overlayMap = {};
  var overlaysToShow = [];

  var tempKey;
  var divisor = 0;
  for(tempKey in gOverlays) {
    overlayMap[tempKey] = false;
    divisor++;
  }
  
  for(var c = 0; c < maxOverlays; c++) {
    var nextOverlay;
    // find the next overlay to show
    for(tempKey in overlayMap) {
      if(Math.random() <= (1 / divisor--)) {
        nextOverlay = tempKey;
        break;
      }
    }
    overlaysToShow.push(nextOverlay);

    // remove any overlays that are mutually exclusive
    var exclusions = gOverlays[nextOverlay].exclusions;
    for(var i = 0; i < exclusions.length; i++) {
      var overlays = gExclusionMap[exclusions[i]];  
      for(var j = 0; j < overlays.length; j++) {
        var overlay = overlays[j];
        delete overlayMap[overlay.id];
      }
    }

    divisor = 0;
    for(tempKey in overlayMap) {
      divisor++;
    }
  }

/*
  var slotWheel1 = [];
  var slotWheel2 = [];
  var slotWheel3 = [];
  for(tempKey in gOverlays) {
    slotWheel1.push(tempKey);
    slotWheel2.push(tempKey);
    slotWheel3.push(tempKey);
  }
  for(var i = 0; i < slotWheel1.length; i++) {
    var swapIndex = Math.floor(Math.random() * slotWheel1.length);
    var temp = slotWheel1[i];
    slotWheel1[i] = slotWheel1[swapIndex];
    slotWheel1[swapIndex] = temp;

    swapIndex = Math.floor(Math.random() * slotWheel1.length);
    temp = slotWheel2[i];
    slotWheel2[i] = slotWheel2[swapIndex];
    slotWheel2[swapIndex] = temp;

    swapIndex = Math.floor(Math.random() * slotWheel1.length);
    temp = slotWheel3[i];
    slotWheel3[i] = slotWheel3[swapIndex];
    slotWheel3[swapIndex] = temp;
  }
  $('#slot-wheel-0').empty();
  $('#slot-wheel-1').empty();
  $('#slot-wheel-2').empty();
  for(var i = 0; i < slotWheel1.length; i++) {
    var slotIcon1 = $('<img src="' + gOverlays[slotWheel1[i]].icon + '"/>').addClass('slot-icon');
    var slotIcon2 = $('<img src="' + gOverlays[slotWheel2[i]].icon + '"/>').addClass('slot-icon');
    var slotIcon3 = $('<img src="' + gOverlays[slotWheel3[i]].icon + '"/>').addClass('slot-icon');
    $('#slot-wheel-0').append(slotIcon1);
    $('#slot-wheel-1').append(slotIcon2);
    $('#slot-wheel-2').append(slotIcon3);
  }  
  //    $('#slot-icon-' + i).get(0).src = gOverlays[overlaysToShow[i]].icon;

  $('#slot-wheel-0').animate({"margin-top": "-=" + (slotWheel1.length * 24) + "px"});
*/

  hideAllOverlays();

  for(var i = 0; i < overlaysToShow.length; i++) {
    $('#' + overlaysToShow[i] + '-button').googButton('toggleOn');
    selectOverlay(overlaysToShow[i]);
  }

}

function positionSpotlights(category)
{
  for(var i = 0; i < category.overlays.length; i++) {
    var name = category.overlays[i].id;
    var position = $('#' + name + '-button').position();
    $('#' + name + '-spotlight')
      .css({
        'top' : position.top - 35 + gOverlayData[gCurrentCat].ui.get(0).scrollTop,
        'left' : position.left - 35
    });
  }
}

/**
 * Deletes and rebuilds the actual overlay list UI.  Can be called after new effects
 * have been dynamically added to gOverlayData.
 */
function createOverlayUI()
{
  setupOverlays();

  gCurrentCat = 0;

  // setup the category div if we should
  if(gOverlayData.length > 1 || (gOverlayData[0] && gOverlayData[0].id !== 'uncategorized')) {
    var categoryDiv = $('#category-bar');
    categoryDiv.empty();
    var innerDiv = $('<div style="border-bottom:2px ridge #404040;padding-bottom:8px" />');
    var catName = $('<span id="category-name" />').text(gOverlayData[0].title);
    if(gOverlayData.length > 1) {
	var leftImg = $('<div class="simple-icon-button" alt="' + getLocalizedString('Previous') + '" '
          + 'title="' + getLocalizedString('Previous') + '" />')
        .append($('<img src="' + gResourceRoot + '/fx/css/cat-left-arrow.png" />'))
        .css({'float': 'left', 'width': '30px'})
        .click(function() {
          var animateFn = function() {
	    if(gCategoryAnimationMutex) {
              setTimeout(animateFn, 100);
	      return;
	    }
            gCategoryAnimationMutex = true;
            var oldCat = gCurrentCat;
            gCurrentCat = gCurrentCat - 1;
            if(gCurrentCat < 0) gCurrentCat = gOverlayData.length - 1;
            gOverlayData[gCurrentCat].ui.css({"overflow-y":"hidden"});
            gOverlayData[oldCat].ui.css({"overflow-y":"hidden"});
            gOverlayData[gCurrentCat].ui.animate({"left": "-=300px"}, 0).show();
            positionSpotlights(gOverlayData[gCurrentCat]);
            gOverlayData[gCurrentCat].ui.animate({"left": "+=300px"}, 400, function() {
                gOverlayData[gCurrentCat].ui.css({"overflow-y":"auto"});
                $('#category-name').text(gOverlayData[gCurrentCat].title);
                gCategoryAnimationMutex = false;
            });
            gOverlayData[oldCat].ui.animate({"left": "+=300px"}, 400, function() {
              gOverlayData[oldCat].ui.hide();
              gOverlayData[oldCat].ui.animate({"left": "-=300px"}, 0);
              gOverlayData[oldCat].ui.css({"overflow-y":"auto"});
            });
          };
          animateFn();
        });
	var rightImg = $('<div class="simple-icon-button"  alt="' + getLocalizedString('Next') + '" '
          + 'title="' + getLocalizedString('Next') + '"/>')
        .append($('<img src="' + gResourceRoot + '/fx/css/cat-right-arrow.png" />'))
        .css({'float': 'right', 'width': '30px'})
        .click(function() {
          var animateFn = function() {
	    if(gCategoryAnimationMutex) {
              setTimeout(animateFn, 100);
	      return;
	    }
            gCategoryAnimationMutex = true;
            var oldCat = gCurrentCat;
            gCurrentCat = gCurrentCat + 1;
            if(gCurrentCat >= gOverlayData.length) gCurrentCat = 0;
            gOverlayData[gCurrentCat].ui.css({"overflow-y":"hidden"});
            gOverlayData[oldCat].ui.css({"overflow-y":"hidden"});
            gOverlayData[gCurrentCat].ui.animate({"left": "+=300px"}, 0).show();
            positionSpotlights(gOverlayData[gCurrentCat]);
            gOverlayData[gCurrentCat].ui.animate({"left": "-=300px"}, 400, function() {
                gOverlayData[gCurrentCat].ui.css({"overflow-y":"auto"});
                $('#category-name').text(gOverlayData[gCurrentCat].title);
                gCategoryAnimationMutex = false;
            });
            gOverlayData[oldCat].ui.animate({"left": "-=300px"}, 400, function() {
              gOverlayData[oldCat].ui.hide();
              gOverlayData[oldCat].ui.animate({"left": "+=300px"}, 0);
              gOverlayData[oldCat].ui.css({"overflow-y":"auto"});
            });
          };
          animateFn();
        });      
      innerDiv.append(leftImg, catName, rightImg);
      categoryDiv.append(innerDiv);
    }
    else {
      innerDiv.append(catName);
      categoryDiv.append(innerDiv);
    }
  }


  var appContainer = $('#app-container'); 
  var overlayDiv = $('#effects-list');

  overlayDiv.empty();
  $(window).unbind('resize.effectsPanel');

  // build the overlay list from our global overlay data structure
  for (var i in gOverlayData) {
        
    var categoryDiv = $('<div />');

    // loop through the overlays in this category, create buttons and add them
    // to the button bar we just created
    var overlays = gOverlayData[i].overlays;
    var count = 0;
    var rowDiv;
    for (var j in overlays) {
      if(count % 3 == 0) {
        if(count != 0) categoryDiv.append(rowDiv);
        rowDiv = $('<div />');
      }
      count++;

      var overlay = overlays[j];
      var button = $('<a />')
        .css({'position':'relative', 'z-index':2})
        .attr({id:overlay.id + '-button'})
        .googButton({small:true, toggle:true})
        .addClass('icononly')
        .html('<img src="' + overlay.icon + '" alt="'
          + overlay.name
          + '" title="' + overlay.name + '">');
      button.click(function(id) {
          return function () {
          selectOverlay(id);
          return false;
        }
      }(overlay.id));

      var spotlightImg = $('<img src="' + gResourceRoot + '/fx/css/spotlight.png" />')
        .attr({id:overlay.id + '-spotlight'})
        .addClass('spotlight');

      rowDiv.append(spotlightImg);
      rowDiv.append(button);
    }

    // add the label and the button bar to the list
    categoryDiv.append(rowDiv);

    var spacerDiv = $('<div />')
      .css({'height': '20px'});

    categoryDiv.append(spacerDiv);
    categoryDiv.addClass("scrollBarInner effects-panel");
    categoryDiv.css({"padding-top": "5px"});
    categoryDiv.height(appContainer.height() - 142);
    $(window).bind("resize.effectsPanel", function(div) {
      return function() {
        div.height(appContainer.height() - 142);
      }
    }(categoryDiv));


    gOverlayData[i]['ui'] = categoryDiv;
    overlayDiv.append(categoryDiv);
  }

  gOverlayData[0].ui.show();

  appContainer.googFocusContainer({'selector':'.kd-button,.simple-icon-button'}); 
  appContainer.googFocusContainer('updateElements');
}


/**
 * Checks to see if there is are add-on effects specified in the hangout
 * URL, or if add-on effects data exists in the app's shared state.  If so,
 * The additional effects and categories are added to the gOverlayData 
 * structure.
 */
function addExtensionPack()
{
  // see if there is an add-on parameter
  var extensionData = gadgets.views.getParams()['appData'];

  // if so, write it to the app's shared state  
  if(extensionData && extensionData.length != 0) {
    gapi.hangout.data.setValue('extensionData', extensionData);
  }
  // if not, see if there is add-on data in the app's shared state
  else {
    var appState = gapi.hangout.data.getState();
    if('extensionData' in appState)
      extensionData = appState.extensionData;
  }

  // if we got some extension data from somewhere, build the effects
  if(extensionData && extensionData.length != 0) {
    var jsonObj = jQuery.parseJSON(extensionData);
    var objects = [];
    if(jsonObj && 'objs' in jsonObj)
      objects = jsonObj.objs;
    for(var i = 0; i < objects.length; i++) {
      var object = objects[i];
      // now see what type of an object we got
      if(object.t) {
        // if category 
        if(object.t === 'cat' && object.id && object.name) {
          // make sure it doesn't exist already
	  var exists = false;	  
          for(k = 0; k < gOverlayData.length; k++) {
            if(gOverlayData[k].id === object.id)
              exists = true;
          }
          if(!exists) {
            var newCat = {
              id: object.id,
              title: object.name,
              overlays: []
            };
	    gOverlayData.unshift(newCat);
          }
        }
        else if(object.t === 'eff' && object.name && object.icon 
          && object.res && object.cat) {
          var newEffect = {
            name: object.name,
            id: "addon-" + Math.floor((Math.random()*1000)+1),
            icon: object.icon,
            resource: object.res,
            options: {trackingFeature:
		      gapi.hangout.av.effects.FaceTrackingFeature.NOSE_ROOT,
		      offset: {x: 0.0, y: 0.0},
		      scaleWithFace: true,
		      rotateWithFace: true,
		      scale: 1.0,
                      rotation: 0.0}
          };
          if(object.excl) newEffect.exclusions = object.excl.split(",");
          if(object.tf) newEffect.options.trackingFeature = object.tf;
          if(object.offx) newEffect.options.offset.x = object.offx;
          if(object.offy) newEffect.options.offset.y = object.offy;
          if(object.scale) newEffect.options.scale = object.scale;
          if(object.rot) newEffect.options.rotation = object.rot;
          if(object.swf) newEffect.options.scaleWithFace = object.swf;
          if(object.rwf) newEffect.options.rotateWithFace = object.rwf;
          if(object.on) gEnabledOnStartup.push(newEffect.id);
          for(var k = 0; k < gOverlayData.length; k++) {
	    if(gOverlayData[k].id === object.cat) {
              gOverlayData[k].overlays.push(newEffect);
            }
          }          
        } 
      }
    
      setupOverlays();
    }
  }

  // enable any effects that are supposed to be on at startup
  for(var i = 0; i < gEnabledOnStartup.length; i++) {
    selectOverlay(gEnabledOnStartup[i]);
    $('#' + gEnabledOnStartup[i] + '-button').googButton("toggleOn");
  }
}



/**
 * Creates the overlays and UI. Called as soon as the current
 * string localization file has been loaded.  
 */
function setupUI()
{
  gApplicationName = getLocalizedString("Effects");

  var appContainer = $('#app-container'); 

  var titlebarDiv = $('#title-bar');

  var titleSpan = $('<span />')
    .attr({'id': 'title-span'})
    .html(gApplicationName);

  var closeButton = $('<div />')
    .html('<a class="simple-icon-button"><img src="' 
      + gResourceRoot + 'fx/css/close-icon.png" '
      + 'alt="' + getLocalizedString('Close') + '" '
      + 'title="' + getLocalizedString('Close') + '"></a>')
    .css({'float': 'right'})
    .click(function() {
      gapi.hangout.hideApp();
      fireGAEvent("Effects", "Hide_App");
      return false;
    });

  titlebarDiv.append(titleSpan, closeButton);

  var bottomButtonBarDiv = $('#bottom-button-bar');

  var buttonDiv = $('<div />')
    .addClass('kd-buttonbar');

  var removeButton =  $('<a />')
    .googButton({darkbg:true, mini:true})
    .html(getLocalizedString('Remove_all'));
  removeButton.click(function() {
    hideAllOverlays();
    fireGAEvent("Effects", "Remove_All");
    return false;
  });

  var randomizeButton =  $('<a />')
    .googButton({darkbg:true, mini:true})
    .html(getLocalizedString('Randomize'));
  randomizeButton.click(function() {
    randomizeOverlays(3);
    fireGAEvent("Effects", "Randomize");
    return false;
  });

  var slotWheel1 = $('<div id="slot-wheel-0" />').addClass('slot-wheel');
  var slotWheel2 = $('<div id="slot-wheel-1" />').addClass('slot-wheel');
  var slotWheel3 = $('<div id="slot-wheel-2" />').addClass('slot-wheel');
  var slot1 = $('<div id="slot-0" />').addClass('slot-container').append(slotWheel1);
  var slot2 = $('<div id="slot-1" />').addClass('slot-container').append(slotWheel2);
  var slot3 = $('<div id="slot-2" />').addClass('slot-container').append(slotWheel3);

  buttonDiv.append(removeButton, randomizeButton);
  //  buttonDiv.append(slot1, slot2, slot3);
  bottomButtonBarDiv.append(buttonDiv);

  var overlayDiv = $('#effects-list');

  overlayDiv.css({"padding-top": "0px"});

  overlayDiv.height(appContainer.height() - 147);

  $(window).resize(function() {
    overlayDiv.height(appContainer.height() - 147);
  });


  // see if there is a parameter to tell us where to get our effects def
  var params = {};
  ps = gadgets.views.getParams()['applicationUrl'];
  if(ps) {
    ps = ps.split(/\?|&/);
    for (var i = 0; i < ps.length; i++) {
      if (ps[i]) {
        var p = ps[i].split(/=/);
        params[p[0]] = decodeURIComponent(p[1]);
      }
    }
  }
  if(params.config) {
    $.getScript(params.config, addExtensionPack);
  }
}


/**
 * Called on page load.  Gets the current locale, loads
 * the appropriate string file (and causes the UI to get
 * setup when that successfully loads).
 */
function init()
{
  gapi.hangout.onApiReady.add(function(eventObj) {
    if(eventObj.isApiReady) {

      // keep track of the participants in the hangout
      // so we can report on the number of participants
      // when an effect is turned on
      gParticipants = gapi.hangout.getParticipants();
      gapi.hangout.onParticipantsChanged.add(function(event) {
        gParticipants = event.participants;
      });

      // fire an event to say the app is starting up
      fireGAEvent("Effects", "App_Starting");

      // get the locale
      var locale = gapi.hangout.getLocale();

      // load the localized strings and then build the UI
      $.getScript(gResourceRoot + 'fx/src/locale/' + locale + '/strings.js', 
        setupUI);
    }
  });
}

gadgets.util.registerOnLoadHandler(init);