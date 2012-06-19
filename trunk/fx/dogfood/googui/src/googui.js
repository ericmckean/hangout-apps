(function( $ ){

  var selectMethods = {
    init : function( options ) {

      return this.each(function(){

        var $this = $(this),
          data = $this.data('select');

        // establish defaults for optional parameters
        var settings = $.extend( {
          'scroll' : false,
        }, options);

        // If the plugin hasn't been initialized yet
        if(!data)
        {
          // setup classes and create the list for the menu items
          var label = $('<span />').addClass('label');
          var menuList = $('<ul />').addClass('kd-menulist');
          if(settings.scroll) menuList.addClass('scroll');
          $this.addClass('kd-button kd-menubutton kd-select')
            .append(label)
            .append($('<span />').addClass('kd-disclosureindicator'))
            .append(menuList);

          // setup the data store for this object
          $(this).data('select', {
            'target' : $this,
            'label' : label,
            'menuList' : menuList,
            'selected' : 0,
            'value' : '',
            'options' : []
          });

          data = $this.data('select');

          // add a click method so the menu is displayed when the select is
          // clicked on
          $this.bind('click.googSelect', function(event){

            // figure out the position to display the menu popup at and show it
            data.menuList.css('top', 
              -(data.menuList.find('.kd-menulistitem.selected').eq(0)
                .position().top));
            data.menuList.addClass('shown');

            // add a click handler to the document body to handle closing the 
            // popup if the use clicks outside it
            setTimeout(function(){
              $('body').bind('click.googSelect', function(){
                data.menuList.removeClass('shown');
                $('body').unbind('click.googSelect');
              });
            }, 200);

            return false;
          });
        }
      });
    },

    destroy : function( ) {

       return this.each(function(){

         var $this = $(this),
           data = $this.data('select');

         $this.removeData('select');

       })
    },

    // adds a new menu item to the select
    appendItem : function(options) {
      return this.each(function(){

        var $this = $(this),
          data = $this.data('select');

        // establish default values for the parameters
        var settings = $.extend( {
          'label' : '',
          'value' : '',
          'index' : data.options.length
        }, options);

        // setup the classes and add the new item to the menu list
        var item = $('<li />').addClass('kd-menulistitem').html(settings.label);
        $(item).data('settings', settings);
        data.menuList.append(item);

        // add a click handler to the new item which will update the 
        // selected item, close the menu, and fire a change event
        item.bind('click.googSelect', function(event){
          $target = $(event.target);
          optionData =  $target.data('settings');
          data.menuList.removeClass('shown');
          $('body').unbind('click.googSelect');
          data.label.html(optionData.label);
          data.options[data.selected].removeClass('selected');
          $target.addClass('selected');
          data.value = optionData.value;
          data.selected = optionData.index;
          data.target.change();
          return false;
        });

        // if this is the only item, make it the selected item
        if(data.options.push(item) == 1)
        {
          data.label.html(settings.label);
          data.value = settings.value;
          item.addClass('selected');
        }

        // adjust the width of the select to account for the new item
        // (this doesn't work when done synchronously, but seems to work
        // with even a tiny timeout)
        setTimeout(function(){
            data.target.width(data.menuList.width() - 44);
        }, 10);
      });
    },

    // appends a separator to the menu
    appendSeparator : function(options) {
      return this.each(function(){

        var $this = $(this),
          data = $this.data('select');

        // simply create the separator and add it
        var item = $('<li />').addClass('kd-menurule');
        data.menuList.append(item);
      });
    },

    // returns the value of the currently selected option
    getValue : function() {
      var retval = '';
      var $this = $(this),
        data = $this.data('select');
      if(data) retval = data.value;
      return retval;
    }

  };

  // adding googSelect method to the jquery object
  $.fn.googSelect = function( method ) {

    if ( selectMethods[method] ) {
      return selectMethods[method].apply( this, 
        Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return selectMethods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.googSelect' );
    }
  };



  var buttonMethods = {
    init : function( options ) {

      return this.each(function(){

        // setup defaults for the optional parameters
        var settings = $.extend( {
          'small' : false,
          'mini' : false,
          'disabled' : false,
          'action' : false,
          'submit' : false,
          'share' : false,
          'toggle' : false,
          'toolbar' : false,
          'darkbg' : false
        }, options);

        var $this = $(this),
          data = $this.data('button');

        // If the plugin hasn't been initialized yet
        if(!data)
        {
	  // add all the necessary classes to the object, based on which
          // options are set
          $this.addClass('kd-button');
          if(settings.small) $this.addClass('small');
          if(settings.mini) $this.addClass('mini');
          if(settings.disabled) $this.addClass('disabled');
          if(settings.action) 
            $this.addClass('kd-button-action');
          else if(settings.submit) 
            $this.addClass('kd-button-submit');
          else if(settings.share) 
            $this.addClass('kd-button-share');
          if(settings.toggle) $this.addClass('kd-toggle-button');
          if(settings.toolbar) $this.addClass('kd-toolbarbutton');
          if(settings.darkbg) $this.addClass('dark-bg');

          // store some data to help maintain toggle buttons
          $(this).data('button', {
            'target' : $this,
            'toggle' : settings.toggle,
            'selected' : $this.hasClass('selected')
          });

          data = $this.data('button');

          // if this is a toggle button, install a click handler to 
          // support changing state
          if(settings.toggle)
          {
	    $this.bind('click.googButton', function(event){
              if(!data.toggle) return;
              if(data.selected)
              {
                data.target.removeClass('selected');
                data.selected = false;
              }
              else
              {
                data.target.addClass('selected');
                data.selected = true;
              }

              return false;
            });
          }
        }
      });
    },


    destroy : function( ) {

       return this.each(function(){

         var $this = $(this),
           data = $this.data('button');

         $this.removeData('button');

       })
    },

    // enables the button
    enable : function() {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('button');
        if(data) data.target.removeClass('disabled');
      });
    },

    // disables the button
    disable : function() {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('button');
        if(data) data.target.addClass('disabled');
      });
    },

    // changes the label of the button to whatever html is
    // passed in
    setLabel : function(options) {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('button');
        if(data) data.target.html(options.html);
      });
    },

    // turns on a toggle button
    toggleOn : function() {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('button');
        if(data)
        {
          if(data.toggle)
          {
            data.target.addClass('selected');
            data.selected = true;
          }
        }
      });
    },

    // turns off a toggle button
    toggleOff : function() {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('button');
        if(data)
        {
          if(data.toggle)
          {
            data.target.removeClass('selected');
            data.selected = false;
          }
        }
      });
    },

    // toggles a toggle button off or on
    toggle : function() {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('button');
        if(data)
        {
          if(!data.toggle) return;
          if(data.selected)
          {
            data.target.removeClass('selected');
            data.selected = false;
          }
          else
          {
            data.target.addClass('selected');
            data.selected = true;
          }
        }
      });
    },

    // returns whether a toggle button is currently on or off
    isSelected : function() {
      var retval = false;
      var $this = $(this),
        data = $this.data('button');
      if(data) retval = data.selected;
      return retval;
    }
  };

  // add the googButton method to the jquery object
  $.fn.googButton = function( method ) {

    if ( buttonMethods[method] ) {
      return buttonMethods[method].apply( this, 
        Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return buttonMethods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.googButton' );
    }
  };


  var segmentedControlMethods = {
    init : function( options ) {

      return this.each(function(){

        // set defaults for the optional parameters
        var settings = $.extend( {
          'radio' : false,
          'viewToggle' : false,
          'selected' : 0,
        }, options);

        var $this = $(this),
          data = $this.data('segmentedControl');

        // If the plugin hasn't been initialized yet
        if(!data)
        {
	  // set this element's class 
          $this.addClass('kd-segmentedcontrol');

          // find any button elements that already belong to this element
          var elements = $this.find('.kd-button');
          var selWidth = elements.eq(settings.selected).outerWidth();
          var totalWidth = 0;

          // handle setup if viewToggle is set (not really working well yet)
          if(settings.viewToggle) { 
            $this.addClass('kd-viewtoggle');
            $this.width(selWidth);
            elements.css({right:0});
            $this.append($('<span class="tab" />').css({right : selWidth + "px"}));
            for(i = 0; i < elements.length; i++) {
              totalWidth += elements.eq(i).outerWidth();
            }
	  }

          // setup some data to help with radio behavior, etc.
          $(this).data('segmentedControl', {
            'target' : $this,
            'radio' : settings.radio || settings.viewToggle,
            'viewToggle' : settings.viewToggle,
            'selected' : settings.selected,
            'selWidth' : selWidth,
            'totalWidth' : totalWidth, 
            'elements' : elements
          });

          data = $this.data('segmentedControl');

          // bind mouse enter/leave handlers for viewToggle option
          if(data.viewToggle) {
            $this.bind('mouseenter.googSegmentedControl', function() {
              $this.width(data.totalWidth);
              var right = data.totalWidth;
              for(i = 0; i < data.elements.length; i++) {
                right -= data.elements.eq(i).outerWidth();
                data.elements.eq(i).css({'right':right});
              }
            });
            $this.bind('mouseleave.googSegmentedControl', function() {
              $this.width(data.selWidth);
              data.elements.css({right:0});
            });
          }

          // setup the left, mid, and right classes, and see if
          // some button is already set to selected
          for(i = 0; i < data.elements.length; i++) {
            el = data.elements.eq(i);
            if(i == 0) el.addClass('left');
	    else if(i == data.elements.length - 1) 
              el.addClass('right');
            else el.addClass('mid');
            if(el.hasClass('selected'))
              data.selected = i;
          }

	  // if this is a radio type control, setup the selected
          // button correctly and add click handlers
	  if(data.radio) {
            for(i = 0; i < data.elements.length; i++) {
              el = data.elements.eq(i);
  
              // make sure the selection is setup correctly
              if(i == data.selected) el.addClass('selected');
              else el.removeClass('selected');

              // add a click handler to support the radio behavior
              data.elements.eq(i).bind('click.googSegmentedControl', function(num) {
                return function(event) {
                  for(j = 0; j < data.elements.length; j++) {
                    data.elements.eq(j).removeClass('selected');
                  }
	          data.elements.eq(num).addClass('selected');
                  data.selected = num;
                  data.selWidth = data.elements.eq(num).outerWidth();
                  return false;
                }
	      }(i));
	    }
          }
        }
      });
    },

    destroy : function( ) {

       return this.each(function(){

         var $this = $(this),
           data = $this.data('segmentedControl');

         $this.removeData('segmentedControl');

       })
    },

    // allows the addition of a googButton object to the end
    // of the segmented control
    addButton : function(options) {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('segmentedControl');
        if(data) {
          data.target.append(options.button);
          data.elements = data.target.find('.kd-button');
          var oldRight = data.elements.eq(data.elements.length - 2);
          var newRight = data.elements.eq(data.elements.length - 1);
          oldRight.removeClass('right').addClass('mid');
          newRight.addClass('right');
          if(data.radio) {
            newRight.bind('click.googSegmentedControl', function(num) {
              return function(event) {
                for(j = 0; j < data.elements.length; j++) {
		  data.elements.eq(j).removeClass('selected');
                }
	        data.elements.eq(num).addClass('selected');
                data.selected = num;
                return false;
              }
            }(data.elements.length - 1));
          }
        }
      });
    },

    // returns the currently selected button for a radio control
    getSelected : function() {
      var retval = null;
      var $this = $(this),
        data = $this.data('segmentedControl');
      if(data) retval = data.elements.eq(data.selected);
      return retval;
    },

    // returns the index of the currently selected button for a 
    // radio control
    getSelectedIndex : function() {
      var retval = -1;
      var $this = $(this),
        data = $this.data('segmentedControl');
      if(data) retval = data.selected;
      return retval;
    }
  };

  // adds the googSegmentedControl method to teh jquery object
  $.fn.googSegmentedControl = function( method ) {

    if ( segmentedControlMethods[method] ) {
      return segmentedControlMethods[method].apply( this, 
        Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return segmentedControlMethods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.googSegmentedControl' );
    }
  };



  var slideToggleMethods = {
    init : function( options ) {

      return this.each(function(){

        // setup defaults for the optional parameters
        var settings = $.extend( {
          'onLabel' : 'ON',
          'offLabel' : 'OFF',
          'on' : false
        }, options);

        var $this = $(this),
          data = $this.data('slideToggle');

        // If the plugin hasn't been initialized yet
        if(!data)
        {
          $this.addClass('kd-slidetoggle');

          // add the on, off, and thumb states
          if(settings.on) $this.addClass('on');
          var onSpan = $('<span />').addClass('on')
            .html(settings.onLabel);
          var offSpan = $('<span />').addClass('off')
            .html(settings.offLabel);
          var thumbSpan = $('<span />').addClass('thumb');
          $this.append(onSpan, offSpan, thumbSpan);

          $(this).data('slideToggle', {
            'target' : $this,
            'on' : settings.on || $this.hasClass('on')
          });

          data = $this.data('slideToggle');

          // setup an event handler to support toggling the switch
          $this.bind('click.googSlideToggle', function(event){
            if(data.on) {
              data.target.removeClass('on');
              data.on = false;
            }
            else {
              data.target.addClass('on');
              data.on = true;
            }

            return false;
          });
        }
      });
    },

    destroy : function( ) {

       return this.each(function(){

         var $this = $(this),
           data = $this.data('slideToggle');

         $this.removeData('slideToggle');

       })
    },

    // turns the control on
    toggleOn : function() {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('slideToggle');
        if(data)
        {
          data.target.addClass('on');
          data.on = true;
        }
      });
    },

    // turns the control off
    toggleOff : function() {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('slideToggle');
        if(data)
        {
          data.target.removeClass('on');
          data.on = false;
        }
      });
    },

    // toggles the control off or on
    toggle : function() {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('slideToggle');
        if(data)
        {
          if(data.on)
          {
            data.target.removeClass('on');
            data.on = false;
          }
          else
          {
            data.target.addClass('on');
            data.on = true;
          }
        }
      });
    },

    // returns whether or not the control is currently on
    isOn : function() {
      var retval = false;
      var $this = $(this),
        data = $this.data('slideToggle');
      if(data) retval = data.on;
      return retval;
    }
  };

  // adds the googSlideToggle method to the jquery object
  $.fn.googSlideToggle = function( method ) {

    if ( slideToggleMethods[method] ) {
      return slideToggleMethods[method].apply( this, 
        Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return slideToggleMethods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.googSlideToggle' );
    }
  };

  // individual method definitions for googRating
  var ratingMethods = {
    init : function( options ) {

      return this.each(function(){

        // defaults for optional parameters 
        var settings = $.extend( {
          'rating' : 0,
          'numStars' : 5
        }, options);

        var $this = $(this),
          data = $this.data('rating');

        // If the plugin hasn't been initialized yet
        if(!data)
        {
          $this.addClass('kd-ratingstargroup');

          // create the individual star objects, up to the number specified
          var stars = new Array(settings.numStars);
          for(i = 0; i < settings.numStars; i++) {       
            stars[i] = $('<span />').addClass('kd-ratingstar');
            if(settings.rating > i && settings.rating < i + 1)
              stars[i].addClass('half');
            else if(settings.rating >= i + 1)
              stars[i].addClass('full');
            $this.append(stars[i]);
          }

          $(this).data('rating', {
            'target' : $this,
            'rating' : settings.rating,
            'numStars' : settings.numStars,
            'stars' : stars
          });

          data = $this.data('rating');

          // setup a click handler for each star
          for(i = 0; i < settings.numStars; i++) {       
            stars[i].bind('click.googRating', function(starNum) {
              return function(event) {
                if(data.stars[starNum].hasClass('full')) {
                  data.rating = starNum + 0.5;
                }
                else if(data.stars[starNum].hasClass('half')) {
                  data.rating = starNum;
                }
                else {
                  data.rating = starNum + 1;
                }

                for(j = 0; j < data.numStars; j++) {
		    data.stars[j].removeClass('half');
		    data.stars[j].removeClass('full');
                  if(data.rating > j && data.rating < j + 1)
                    data.stars[j].addClass('half');
                  else if(data.rating >= j + 1)
                    data.stars[j].addClass('full');
                }
              }
	    }(i));
          }
        }
      });
    },

    destroy : function( ) {

       return this.each(function(){

         var $this = $(this),
           data = $this.data('rating');

         $this.removeData('rating');

       })
    },

    // sets the rating and updates the stars
    setRating : function(options) {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('rating');
        if(data)
        {
          if(options.rating) data.rating = options.rating;
          for(j = 0; j < data.numStars; j++) {
            data.stars[j].removeClass('half');
            data.stars[j].removeClass('full');
            if(data.rating > j && data.rating < j + 1)
              data.stars[j].addClass('half');
            else if(data.rating >= j + 1)
              data.stars[j].addClass('full');
          }
        }
      });
    },

    // returns the current rating
    getRating : function() {
	  var retval = 0;
	  var $this = $(this),
	  data = $this.data('rating');
	  if(data) retval = data.rating;
	  return retval;
      }

  };

  // adds the googRating method to the jquery object
  $.fn.googRating = function( method ) {

    if ( ratingMethods[method] ) {
      return ratingMethods[method].apply( this, 
        Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return ratingMethods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.googRating' );
    }
  };


  // individual method definitions for googFocusContainer
  var focusContainerMethods = {
    init : function( options ) {

      return this.each(function(){

        var settings = $.extend( {
          'selector' : '.kd-button',
        }, options);

        var $this = $(this),
          data = $this.data('container');

        // If the plugin hasn't been initialized yet
        if(!data)
        {
          var elements = $this.find(settings.selector);

          // default values for optional parameters
          $(this).data('container', {
            'target' : $this,
            'elements' : elements,
            'focusIndex' : -1,
            'selector' : settings.selector
          });

          data = $this.data('container');

          // add keydown event handlers to support tab, shift-tab,
          //  and enter functionality
          $(window).unbind('keydown');
          $(window).bind('keydown', function(e) {
            if(e.shiftKey && e.which === 9) {
              if(data.focusIndex < 0) data.focusIndex = data.elements.length;
              data.focusIndex--;
              while(data.focusIndex >= 0 && data.elements.eq(data.focusIndex).is(':hidden'))
                data.focusIndex--;
              if(data.focusIndex >= 0) {
                e.preventDefault();
                e.stopPropagation();
              }
              data.elements.removeClass('focus').mouseleave();
              data.elements.eq(data.focusIndex).addClass('focus').focus()
                .mouseenter();
            } else if(e.which === 9) {
              data.focusIndex++;
              while(data.focusIndex < data.elements.length && data.elements.eq(data.focusIndex).is(':hidden'))
                data.focusIndex++;
              if(data.focusIndex >= data.elements.length) data.focusIndex = -1;
              else {
                e.preventDefault();
                e.stopPropagation();
              }
              data.elements.removeClass('focus').mouseleave();
              data.elements.eq(data.focusIndex).addClass('focus').focus()
                .mouseenter();
            } else if(e.which == 13) {
              e.preventDefault();
              e.stopPropagation();
              data.elements.eq(data.focusIndex).click();
            }	
          });  

          $(window).bind('blur', function(e){
            elements.removeClass('focus').mouseleave();
            data.focusIndex = -1;
          });

          $(window).click(function(e){
          	elements.removeClass('focus').mouseleave();
            data.focusIndex = -1;
          });
        }
      });
    },

    destroy : function( ) {

       return this.each(function(){

         var $this = $(this),
           data = $this.data('container');

         $this.removeData('container');

       })
    },

    // call this if elements are added or removed
    updateElements : function() {
      return this.each(function() {
        var $this = $(this),
          data = $this.data('container');
        if(data) {
          var elements = $this.find(data.selector);
          data.elements = elements;
        }
      });
    },

  };

  // adds googFocusContainer method to the jquery object
  $.fn.googFocusContainer = function( method ) {

    if ( focusContainerMethods[method] ) {
      return focusContainerMethods[method].apply( this, 
        Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return focusContainerMethods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.googFocusContainer' );
    }
  };


  // individual method definitions for googToolbar
  var toolbarMethods = {
    init : function( options ) {

      return this.each(function(){
        var $this = $(this);
        $this.addClass("kd-toolbar kd-buttonbar clearfix");  
      });
    }
  };	 

  $.fn.googToolbar = function( method ) {

    if ( toolbarMethods[method] ) {
      return toolbarMethods[method].apply( this, 
        Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return toolbarMethods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.googToolbar' );
    }
  };

  // individual method definitions for googToolbar
  var buttonBarMethods = {
    init : function( options ) {

      return this.each(function(){
        var $this = $(this);
        $this.addClass("kd-buttonbar");  
      });
    }
  };	 

  $.fn.googButtonBar = function( method ) {

    if ( toolbarMethods[method] ) {
      return buttonBarMethods[method].apply( this, 
        Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return buttonBarMethods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.googButtonBar' );
    }
  };

})( jQuery );


// this method can be called in $(document).ready method to properly
// setup html elements on the page that have been annotated with 
// googUI class names.
function initGoogUI()
{
  // find anything with the class googToolbar and turn it into a toolbar
  var toolbars = $('.googToolbar');
  toolbars.googToolbar();

  // find anything with the class googToolbar and turn it into a toolbar
  var buttonBars = $('.googButtonBar');
  buttonBars.googButtonBar();

  // find anything with the class 'googButton' and turn it into a googButton 
  var buttons = $('.googButton');
  for(var i = 0; i < buttons.length; i++) {
    var button = buttons.eq(i);
    var options = {};
    if(button.hasClass('toggle')) {
      options.toggle = true;
      button.removeClass('toggle');
    }
    if(button.hasClass('toolbar')) {
      options.toolbar = true;
      button.removeClass('toolbar');
    }
    if(button.hasClass('action')) {
      options.action = true;
      button.removeClass('action');
    }
    if(button.hasClass('submit')) {
      options.submit = true;
      button.removeClass('submit');
    }
    if(button.hasClass('share')) {
      options.share = true;
      button.removeClass('share');
    }
    button.googButton(options);
  }

  // find anything with the class 'googSegmentedControl' and turn it into a 
  // googSegmentedControl
  var segs = $('.googSegmentedControl');
  for(var i = 0; i < segs.length; i++) {
    var seg = segs.eq(i);
    var options = {};
    if(seg.hasClass('radio')) {
      options.radio = true;
      seg.removeClass('radio');
    }
    seg.googSegmentedControl(options);
  }

  // find anything with the class 'googSelect' and turn it into a 
  // googSelect
  var sels = $('.googSelect');
  for(var i = 0; i < sels.length; i++) {
    var sel = sels.eq(i);
    var options = {};
    if(sel.hasClass('scroll')) {
      options.scroll = true;
      sel.removeClass('scroll');
    }
    sel.googSelect(options);

    // see if it has options
    var items = sel.find('.googSelectOption');     
    if(items.length > 0) {
      items.detach();
      for(var j = 0; j < items.length; j++) {
        var itemOptions = {};
        label = items.eq(j).attr('label');
        if(typeof(label) !== 'undefined') {
          itemOptions.label = label;
        }
        value = items.eq(j).attr('value');
        if(typeof(value) !== 'undefined') {
          itemOptions.value = value;
        }
        sel.googSelect('appendItem', itemOptions);
      }
    }

  }

  // find anything with the class 'googRating' and turn it into a 
  // googRating
  var ratings = $('.googRating');
  for(var i = 0; i < ratings.length; i++) {
    var rating = ratings.eq(i);
    var options = {};
    var r = rating.attr('rating');
    if(typeof(r) !== 'undefined') {
      options.rating = parseFloat(r);
    }
    var n = rating.attr('numstars');
    if(typeof(n) !== 'undefined') {
      options.numStars = parseInt(n);
    }
    rating.googRating(options);
  }

  // find anything with the class 'googSlideToggle' and turn it
  // into a googSlideToggle
  var slideToggles = $('.googSlideToggle');
  for(var i = 0; i < slideToggles.length; i++) {
    var slideToggle = slideToggles.eq(i);
    var options = {};
    var on = slideToggle.attr('onlabel');
    if(typeof(on) !== 'undefined') {
      options.onLabel = on;
    }
    var off = slideToggle.attr('offlabel');
    if(typeof(off) !== 'undefined') {
      options.offLabel = off;
    }
    slideToggle.googSlideToggle(options);
  }

  // find anything with the class 'googFocusContainer' and turn it
  // into a googFocusContainer
  var focusContainers = $('.googFocusContainer');
  for(var i = 0; i < focusContainers.length; i++) {
    var focusContainer = focusContainers.eq(i);
    var options = {};
    selector = focusContainer.attr('selector');
    if(typeof(selector) !== 'undefined') {
      options.selector = selector;
    }
    focusContainer.googFocusContainer(options);
  }
}