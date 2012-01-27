gapi.hangout.onApiReady.add(function() {

  // debugging
  var debugging = true;
  var assert = function(value) {
    if (debugging && !value) {
      debugger;
    }
  }

  // javascript helpers
  var mixin = function(to, from) {
    for (var property in from) {
      to[property] = from[property];
    }
  };
  var mixinClass = function(toClass, fromClass) {
    mixin(toClass.prototype, fromClass.prototype);
    mixin(toClass, fromClass);
  };
  var stringify = function(value) {
    if (typeof(value) === 'undefined') {
      return '';
    } else {
      return JSON.stringify(value);
    }
  };
  var parse = function(value) {
    if (value === '') {
      return undefined;
    } else {
      return JSON.parse(value);
    }
  }

  var Disposable = function() {
    this.toDispose_ = [];
  };
  Disposable.prototype.dispose = function()  {
    var toDispose = this.toDispose_;
    assert(toDispose);
    this.toDispose_ = null;
    for (var i = 0; i < toDispose.length; i++) {
      toDispose[i].dispose();
    }
  };
  Disposable.prototype.registerDispose = function(disposable) {
    this.toDispose_.push(disposable);
  };

  // An class which can fire events.
  var EventSource = function() {
    Disposable.call(this);
    this.listeners_ = [];
  };
  mixinClass(EventSource, Disposable);
  EventSource.prototype.fireListeners_ = function(var_args) {
    // create copy so that we are immune from modification to listeners while firing
    var listeners = this.listeners_.slice(0);
    for (var i = 0; i < listeners.length; i++) {
      listeners[i].apply(null, arguments);
    }
  };
  EventSource.prototype.fireOnCondition = function(source, condition) {
    var listener = (function(var_args) {
      if (condition.apply(null, arguments)) {
        source.removeListener(listener);
        this.fireListeners_();
      }
    }).bind(this);
    this.addListener(listener);
  };
  EventSource.prototype.addListener = function(listener) {
    this.listeners_.push(listener);
    return {dispose: this.removeListener.bind(this, listener)};
  };
  EventSource.prototype.removeListener = function(listener) {
    this.listeners_.splice(this.listeners_.indexOf(listener), 1);
  };
  EventSource.prototype.dispose = function() {
    this.listeners_ = [];
    Disposable.prototype.dispose.call(this);
  };
  EventSource.prototype.addOneShotListener = function(listener) {
    var callback = (function(var_args) {
      disposer.dispose();
      listener.apply(null, arguments);
    }).bind(this);
    var disposer = this.addListener(callback);
  };

  // DOM helpers
  var addClass = function(element, className) {
    // TODO: use jquery
    element.className += ' ' + className;
  };
  var createElement = function(tag, attributes, children) {
    if (arguments.length == 2 && attributes instanceof Array) {
      children = attributes;
      attributes = null;
    }

    var result = document.createElement(tag);
    if (attributes) {
      for (var name in attributes)
        result.setAttribute(name, attributes[name]);
    }

    if (children) {
      for (var i = 0; i < children.length; i++) {
        result.appendChild(children[i]);
      }
    }

    return result;
  };
  var createInlineElement = function(child) {
    var result = createElement('div', [child]);
    result.style.display = 'inline';
    return result;
  };
  var createVerticalCenteredElement = function(child) {
    addClass(child, 'vertical-center');
    return createElement('div', {}, [
        createElement('div', {'class': 'vertical-center-marker'}),
        child])
  };
  var createTextNode = function(text, opt_attributes) {
    if (arguments.length > 1) {
      return createElement('span', opt_attributes, [document.createTextNode(text)]);
    } else {
      return createElement('span', [document.createTextNode(text)]);
    }
  }
  var createTextInput = function(value, attributes) {
    var result = createElement('input', attributes);
    result.type = 'text';
    result.value = value || '';
    addClass(result, 'text-input');
    return result;
  };
  var createButton = function(text, attributes) {
    attributes = attributes || {};
    var result = createElement('div', attributes, [document.createTextNode(text)]);
    addClass(result, 'button');
    return result;
  };
  var createTableCell = function(child) {
    return createElement('div', {'class': 'table-cell'}, [child]);
  };
  var createTableRow = function(elements) {
    var cells = [];
    for (var i = 0; i < elements.length; i++) {
      cells.push(createTableCell(elements[i]));
    }
    return createElement('div', {'class': 'table-row'}, cells);
  };
  var createTable = function(rows) {
    return createElement('div', {'class': 'table'}, rows);
  }
  var removeElement = function(element) {
    if (element && element.parentElement) {
      element.parentElement.removeChild(element);
    }
  };
  var setInterval = function(fn, interval) {
    var timerId = window.setInterval(fn, interval);
    return {dispose: window.clearInterval.bind(window, timerId)};
  };

  var TextInput = function(opt_initialValue) {
    this.dom_ = createTextInput(opt_initialValue);
    this.oldValue_ = this.value();
    this.onChange = new EventSource();

    // add event handlers
    var listener = this.onValueChanged_.bind(this);
    this.dom_.addEventListener('input', listener);
    // TODO: mouseup?
  };
  TextInput.prototype.dom = function() { return this.dom_; };
  TextInput.prototype.value = function() { return this.dom().value; };
  TextInput.prototype.onValueChanged_ = function() {
    if (this.value() !== this.oldValue_) {
      this.onChange.fireListeners_(this.value());
    }
  };

  // hangout helpers
  var isLocalParticipant = function(id) {
    return id === gapi.hangout.getParticipantId();
  }
  var debugListener = function(listener, message) {
    return function() {
      try {
        listener.apply(this, arguments);
      } catch (e) {
        console.log('Exception on event: ' + message);
        console.log(e);
        console.log(e.stack);
        debugger;
      }
    };
  };

  // a single data value shared across all clients
  var HangoutSharedData = function(id, opt_initialValue) {
    EventSource.call(this);
    // TODO: allow custom comparison functions
    this.valueCompare_ = function(newValue, oldValue) { return newValue === oldValue; };
    this.id_ = id;
    if (arguments.length >= 2) {
      this.initialValue_ = opt_initialValue;
    }
    this.callback_ = debugListener(this.onStateChanged_.bind(this), 'SharedData');
    gapi.hangout.data.onStateChanged.add(this.callback_);
    this.onStateChanged_();
  };
  mixinClass(HangoutSharedData, EventSource);
  HangoutSharedData.prototype.dispose = function() {
    gapi.hangout.data.onStateChanged.remove(this.callback_);
    EventSource.prototype.dispose.call(this);
  };
  HangoutSharedData.prototype.hasValue = function() {
    return 'value_' in this;
  };
  HangoutSharedData.prototype.onStateChanged_ = function() {
    var metadata = gapi.hangout.data.getStateMetadata()[this.id_];
    if (metadata) {
      var newValue = parse(metadata.value);
      this.time_ = metadata.timestamp;
      if (!this.valueCompare_(newValue, this.value_)) {
        this.value_ = newValue;
        this.fireListeners_(this.value_);
      }
    } else if ('initialValue_' in this) {
      // This only happens when the app state is reset.
      delete this.value_;
      delete this.time_;
      this.reset();
    }
  };
  HangoutSharedData.prototype.reset = function() {
    this.set(this.initialValue_);
  };
  HangoutSharedData.prototype.set = function(value) {
    gapi.hangout.data.setValue(this.id_, stringify(value));
  };
  HangoutSharedData.prototype.value = function() {
    return this.value_;
  };
  HangoutSharedData.prototype.time = function() {
    return this.time_;
  };
  HangoutSharedData.prototype.waitForValue = function(callback) {
    if (this.hasValue()) {
      callback(this.value());
    } else {
      this.addOneShotListener(callback);
    }
  };


  // per-participant data values, shared across all clients
  var HangoutUserData = function(id, opt_initialValue) {
    EventSource.call(this);
    // TODO: allow custom comparison functions
    this.valueCompare_ = function(newValue, oldValue) { return newValue === oldValue; };
    this.id_ = id;
    this.players_ = {};
    this.keyPrefix_ = id + '$';
    var callback = debugListener(this.onStateChanged_.bind(this), 'UserData');
    this.callback_ = callback;
    gapi.hangout.data.onStateChanged.add(callback);
    gapi.hangout.onEnabledParticipantsChanged.add(callback);

    this.onStateChanged_();
    if (arguments.length > 1 && !this.hasValue()) {
      this.set(opt_initialValue);
    }
  };
  mixinClass(HangoutUserData, EventSource);
  HangoutUserData.prototype.dispose = function() {
    gapi.hangout.data.onStateChanged.remove(this.callback_);
    gapi.hangout.onEnabledParticipantsChanged.remove(this.callback_);
    EventSource.prototype.dispose.call(this);
  };
  HangoutUserData.prototype.onStateChanged_ = function(event) {
    var changed = false;
    var participant;
    var id;

    // adds, changes
    var keys = gapi.hangout.data.getKeys();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key.indexOf(this.keyPrefix_) == 0) {
        id = key.substr(this.keyPrefix_.length);
        participant = gapi.hangout.getParticipantById(id);
        if (participant && participant.hasAppEnabled) {
          var value = parse(gapi.hangout.data.getValue(key));
          if (!(id in this.players_) || !this.valueCompare_(value, this.players[id])) {
            changed = true;
            this.players_[id] = {value: value,
                time: gapi.hangout.data.getStateMetadata()[key].timestamp};
          }
        }
      }
    }

    // removes
    for (id in this.players_) {
      participant = gapi.hangout.getParticipantById(id);
      if (!participant || !participant.hasAppEnabled ||
          !((this.keyPrefix_ + id) in gapi.hangout.data.getState())) {
        delete this.players_[id];
        changed = true;
      }
    }

    if (changed) {
      this.fireListeners_();
    }
  };
  HangoutUserData.prototype.set = function(value) {
    this.setForParticipant(gapi.hangout.getParticipantId(), value);
  };
  HangoutUserData.prototype.setForParticipant = function(participantId, value) {
    var delta = {};
    delta[this.keyPrefix_ + participantId] = stringify(value);
    gapi.hangout.data.submitDelta(delta);
  };
  HangoutUserData.prototype.playerCount = function() {
    return this.players().length;
  };
  HangoutUserData.prototype.value = function(player) {
    return this.players_[player] ? this.players_[player].value : undefined;
  };
  HangoutUserData.prototype.time = function(player) {
    return this.players_[player] ? this.players_[player].time : undefined;
  };
  HangoutUserData.prototype.players = function() {
    var result = [];
    for (var player in this.players_) {
      result.push(player);
    }
    result.sort((function(a, b) { return this.time(a) - this.time(b);}).bind(this));
    return result;
  };
  HangoutUserData.prototype.containsPlayer = function(player) {
    return player in this.players_;
  };
  HangoutUserData.prototype.hasValue = function() {
    return this.containsPlayer(gapi.hangout.getParticipantId());
  }

  var SharedTextNode = function(data) {
    Disposable.call(this);
    this.data_ = data;
    this.dom_ = createTextNode();
    this.registerDispose(data.addListener(this.onDataChanged_.bind(this)));
    this.onDataChanged_();
  };
  mixinClass(SharedTextNode, Disposable);
  SharedTextNode.prototype.dom = function() { return this.dom_; };
  SharedTextNode.prototype.onDataChanged_ = function() {
    this.dom_.textContent = this.data_.value();
  };

  var ReadyList = function(minimumPlayers) {
    EventSource.call(this);
    this.minimumPlayers_ = minimumPlayers;
    this.div_ = createElement('table', {'class': 'ready-list'});
    this.readyData_ = new HangoutUserData('PlayerReady');
    this.registerDispose(this.readyData_);
    this.registerDispose(this.readyData_.addListener(this.onDataChanged_.bind(this)));
    this.players_ = {};
    this.onDataChanged_();
    this.reset();
  };
  mixinClass(ReadyList, EventSource);
  ReadyList.prototype.dom = function() { return this.div_; };
  ReadyList.prototype.reset = function() {
    this.readyData_.set(false);
  };
  ReadyList.prototype.addPlayer_ = function(id) {
    // TODO: add player image
    var name = gapi.hangout.getParticipantById(id).person.displayName;
    if (debugging) {
      name = name + ' ' + id.substr(-4);
    }
    var nameNode = createTextNode(name, {'class': 'player-name'});
    var status = createElement('input',
        {
          'class': 'ready-checkbox',
          type: 'checkbox',
          disabled: true});
    var row = createTableRow([nameNode, status]);

    this.players_[id] = {row: row, status: status};
    this.setPlayerChecked_(id);
    if (isLocalParticipant(id)) {
      this.status_ = status;
      status.onclick = this.onClicked_.bind(this);
    }
    this.div_.appendChild(row);
  };
  ReadyList.prototype.hasMinimumPlayers_ = function() {
    return this.readyData_.playerCount() >= this.minimumPlayers_;
  };
  ReadyList.prototype.setStatusEnabled_ = function() {
    if (this.status_) {
      this.status_.disabled = !this.hasMinimumPlayers_() || this.status_.checked;
    }
  };
  ReadyList.prototype.onClicked_ = function(event) {
    var status = this.status_.checked;
    if (status) {
      this.readyData_.set(status);
      this.status_.disabled = true;
    }
  };
  ReadyList.prototype.setPlayerChecked_ = function(id) {
    this.players_[id].status.checked = this.readyData_.value(id);
  };
  ReadyList.prototype.ensurePlayer_ = function(id) {
    if (!(id in this.players_)) {
      this.addPlayer_(id);
    }
    this.setPlayerChecked_(id);
  };
  ReadyList.prototype.onDataChanged_ = function() {
    var i;

    // added/changed
    var added = false;
    var players = this.readyData_.players();
    for (i = 0; i < players.length; i++) {
      added = this.ensurePlayer_(players[i]) || added;
    }

    // removed
    var toRemove = [];
    for (var id in this.players_) {
      if (!this.readyData_.containsPlayer(id)) {
        toRemove.push(id);
      }
    }
    for (i = 0; i < toRemove.length; i++) {
      removeElement(this.players_[toRemove[i]].row);
      delete this.players_[toRemove[i]];
    }

    this.setStatusEnabled_();

    // when a player joins or leaves the game, everyone must re-ready with the new
    // player list
    if (added || toRemove.length > 0) {
      this.reset();
      return;
    }

    // Is everyone ready?
    var ready = false;
    if (this.hasMinimumPlayers_()) {
      ready = true;
      for (id in this.players_) {
        if (!this.readyData_.value(id)) {
          ready = false;
          break;
        }
      }
    }
    if (ready) {
      this.fireListeners_(this.readyData_.players());
    }
  };

  var Screen = function() {
    EventSource.call(this);
  };
  mixinClass(Screen, EventSource);
  Screen.prototype.show = function(parent) {
    parent.appendChild(this.dom());
  };
  Screen.prototype.dispose = function() {
    removeElement(this.dom());
    Disposable.prototype.dispose.call(this);
  };

  var StartScreen = function() {
    Screen.call(this);

    var minimumPlayers = 4;
    if (debugging) {
      minimumPlayers = 1;
    }
    var readyList = new ReadyList(minimumPlayers);
    this.registerDispose(this.readyList);
    readyList.reset();
    readyList.addListener(this.fireListeners_.bind(this));

    this.div_ = createVerticalCenteredElement(createElement(
        'div',
        {'id': 'start-screen'},
        [createTextNode('Let\'s Play Charades!', {'class': 'title'}), readyList.dom()]));
  };
  mixinClass(StartScreen, Screen);
  StartScreen.prototype.dom = function() { return this.div_; };

  var WaitForNewGameScreen = function() {
    Screen.call(this);
    // TODO: show game progress - teams, score, round, etc.
    this.dom_ = createTextNode('Game already in progress. Waiting for game to finish...');
  }
  mixinClass(WaitForNewGameScreen, Screen);
  WaitForNewGameScreen.prototype.dom = function() { return this.dom_; };

  var WaitForClueScreen = function(actor) {
    Screen.call(this);

    this.messageNode_ = createTextNode('');
    this.actor_ = actor;
    this.onActorChanged_ = this.setMessage_.bind(this);
    this.registerDispose(this.actor_.addListener(this.onActorChanged_));
    this.setMessage_();
  }
  mixinClass(WaitForClueScreen, Screen);
  WaitForClueScreen.prototype.dom = function() {
    return this.messageNode_;
  };
  WaitForClueScreen.prototype.message_ = function() {
    if (this.actor_.hasValue()) {
      var actor = this.actor_.value();
      if (isLocalParticipant(actor)) {
        return 'Waiting for clue. You are acting! Prepare yourself!';
      }
      return 'Waiting for clue. ' + this.actor_.value() + 'prepare to act!';
    } else {
      return 'Waiting for clue.';
    }
  };
  WaitForClueScreen.prototype.setMessage_ = function() {
    this.messageNode_.nodeValue = this.message_();
  };

  var EnterClueScreen = function(clue) {
    Screen.call(this);
    // TODO: add timer?
    // TODO: add list to pick from

    this.message_ = createTextNode('Enter Clue:', {'class': 'title'});
    this.input_ = new TextInput();
    this.done_ = createButton('Start', {'id': 'enter-clue-button'});
    var row = createTableRow([
            this.input_.dom(),
            this.done_]);
    for (var i = 0; i < row.childNodes.length; i++) {
      row.childNodes[i].style.verticalAlign = 'middle';
    }
    var table = createTable([row]);
    table.style.width = '100%';
    this.done_.parentElement.style.width = '1px';
    var contents = createElement('div', {'class': 'contents'}, [table]);
    this.dom_ = createVerticalCenteredElement(createElement('div',
        {'id': 'enter-clue-screen'},
        [this.message_, contents]));
    this.input_.onChange.addListener(this.onChanged_.bind(this));
    this.done_.addEventListener('click', this.fireListeners_.bind(this));
    this.clue_ = clue;
  };
  mixinClass(EnterClueScreen, Screen);
  EnterClueScreen.prototype.dom = function() { return this.dom_; };
  EnterClueScreen.prototype.onChanged_ = function() {
    this.clue_.set(this.input_.value());
  };

  var WatchEnterClueScreen = function(clue) {
    Screen.call(this);

    this.message_ = createTextNode('Current Clue:', {'class': 'title'});

    this.clue_ = new SharedTextNode(clue);
    addClass(this.clue_.dom(), 'text-input');
    this.clue_.dom().style.display = 'block';
    this.registerDispose(this.clue_);

    var row = createTableRow([this.clue_.dom()]);
    for (var i = 0; i < row.childNodes.length; i++) {
      row.childNodes[i].style.verticalAlign = 'middle';
    }
    var table = createTable([row]);
    table.style.width = '100%';
    var contents = createElement('div', {'class': 'contents'}, [table]);

    this.dom_ = createVerticalCenteredElement(createElement('div',
        {'id': 'watch-enter-clue-screen'}, [this.message_, contents]));
  };
  mixinClass(WatchEnterClueScreen, Screen);
  WatchEnterClueScreen.prototype.dom = function() { return this.dom_; };

  var ActingScreen = function(clue, timer) {
    Screen.call(this);

    gapi.hangout.av.setMicrophoneMute(true);

    this.message_ = createTextNode('Current Clue:');
    this.clue_ = createTextNode(clue.value());
    this.startTime_ = Date.now();
    this.timer_ = timer;
    this.timeRemaining_ = new SharedTextNode(timer);
    this.registerDispose(this.timeRemaining_);
    this.registerDispose(window.setInterval(this.onTimerTick_.bind(this), 100));
    this.onTimerTick_();
    this.dom_ = createElement('div', [this.message_, this.clue_, this.timeRemaining_.dom()]);
  };
  mixinClass(ActingScreen, Screen);
  ActingScreen.prototype.dom = function() { return this.dom_; };
  ActingScreen.prototype.dispose = function() {
    gapi.hangout.av.setMicrophoneMute(false);
    Screen.prototype.dispose.call(this);
  };
  ActingScreen.prototype.onTimerTick_ = function() {
    var elapsedTime = Date.now() - this.startTime_;
    var TWO_MINUTES = 120000;
    var remaining = elapsedTime - TWO_MINUTES;
    if (remaining <= 0) {
      this.fireListeners_();
    } else {
      this.timer_.set('Time Remaining: ' + (remaining * 1000).toFixed(1));
    }
  };

  var GuessingScreen = function(timer) {
    Screen.call(this);

    this.timeRemaining_ = new SharedTextNode(timer);
    this.registerDispose(this.timeRemaining_);
    this.dom_ = this.timeRemaining_.dom();
  }
  mixinClass(GuessingScreen, Screen);
  GuessingScreen.prototype.dom = function() { return this.dom_; };

  var JudgingScreen = function(timer, clue, guessed) {
    Screen.call(this);

    this.timeRemaining_ = new SharedTextNode(timer);
    this.registerDispose(this.timeRemaining_);
    this.message_ = createTextNode('Current clue is: ' + clue.value());
    this.correctButton_ = createButton('Opponents Guessed Correct!');
    this.correctButton_.addEventListener('click', this.onGuessed_.bind(this));
    this.dom_ = createElement('div', [this.message_, this.correctButton_, this.timeRemaining_.dom()]);
    this.guessed_ = guessed;
  }
  mixinClass(JudgingScreen, Screen);
  JudgingScreen.prototype.dom = function() { return this.dom_; };
  JudgingScreen.prototype.onGuessed_ = function() {
    this.guessed_.set(true);
    this.fireListeners_();
  }

  var ScoresList = function(scores) {
    // table, rows & score
    var rows = [];
    var participants = scores.players();
    // TODO: Show only score for this game?
    // TODO: Sort by team?
    for (var i = 0; i < participants.length; i++) {
      rows.push(createTableRow([
          createTextNode(participants[i]),
          createTextNode(scores.value(participants[i]))
        ]));
    }
    this.dom_ = createTable(rows);
  };
  ScoresList.prototype.dom = function() { return this.dom_; };

  var RoundEndScreen = function(scores, isMaster) {
    Screen.call(this);

    var scores = new ScoresList(scores);
    var elements = [scores.dom()];
    if (isMaster) {
      // TODO: master gets next game button? or Timer?
      var button = createButton('Start Next Game!');
      button.addEventListener('click', this.fireListeners_.bind(this));
      elements.push(button);
    }
    var div_ = createElement('div', elements);
  };
  mixinClass(RoundEndScreen, Screen);
  RoundEndScreen.prototype.dom = function() { return this.dom_; };


  var CharadesAppState = {
    START: 'start',
    PICK_CLUE: 'pick_clue',
    ACTING: 'acting',
    ACTING_OVER: 'acting_over',
    ROUND_END: 'round_end'
  };

  var CharadesApp = function() {
    Disposable.call(this);
    this.mainDiv_ = createElement('div');
    document.body.appendChild(this.mainDiv_);
    this.state_ = new HangoutSharedData('state', CharadesAppState.START);
    this.roundNumber_ = new HangoutSharedData('round-number', 0);
    this.scores_ = new HangoutUserData('score', 0);
    this.lastRoundActed_ = new HangoutUserData('last-round-acted', -1);
    this.actor_ = new HangoutSharedData('current-actor');
    this.clue_ = new HangoutSharedData('current-clue');
    this.guessed_ = new HangoutSharedData('guessed');
    this.timer_ = new HangoutSharedData('timer');
    this.screen_ = null;

    this.state_.addListener(this.showNextScreen_.bind(this));
    if (this.state_.hasValue()) {
      this.showNextScreen_();
    }
  };
  mixinClass(CharadesApp, Disposable);
  CharadesApp.prototype.init = function() {
    this.showNextScreen_();
  };
  CharadesApp.prototype.waitForNewGame_ = function() {
    this.showEveryone();
    this.showScreen_(new WaitForNewGameScreen());
  };
  CharadesApp.prototype.showScreen_ = function(screen) {
    if (this.screen_) {
      this.screen_.dispose();
    }
    this.screen_ = screen;
    this.screen_.show(this.mainDiv_);
  };
  CharadesApp.prototype.showActor = function() {
    gapi.hangout.setDisplayedParticipant(this.actor_.value());
  };
  CharadesApp.prototype.clearActor = function() {
    gapi.hangout.clearDisplayedParticipant();
  };
  CharadesApp.prototype.showEveryone = function() {
    this.showParticipants(gapi.hangout.getParticipants().map(function(p) { return p.id; }), true);
  };
  CharadesApp.prototype.showParticipants = function(participantIds, state) {
    for (var i = 0; i < participantIds.length; i++) {
      var id = participantIds[i];
      gapi.hangout.av.setParticipantVisible(id, state);
      gapi.hangout.av.setParticipantAudible(id, state);
    }
  };
  CharadesApp.prototype.showTeammates = function() {
    this.showParticipants(this.team_, true);
  };
  CharadesApp.prototype.hideOpponents = function() {
    this.showParticipants(this.opponents_, false);
  };
  CharadesApp.prototype.start_ = function() {
    this.showEveryone();
    var screen = new StartScreen();
    this.showScreen_(screen);
    screen.addListener(this.everyoneReady_.bind(this));
  };
  CharadesApp.prototype.everyoneReady_ = function(playerIds) {
    // TODO: listen for participant left and abort the game.
    this.setTeams_(playerIds);
    if (this.isMaster_) {
      this.roundNumber_.set(0);
      this.state_.set(CharadesAppState.PICK_CLUE);
    }
  };
  CharadesApp.prototype.setTeams_ = function(playerIds) {
    this.players_ = playerIds
    var index = playerIds.indexOf(gapi.hangout.getParticipantId());
    this.teams_ = [[], []];
    for (var i = 0; i < playerIds.length; i++) {
      this.teams_[i % 2].push(playerIds[i]);
    }
    this.teamIndex_ = index % 2;
    this.opponentIndex_ = (this.teamIndex_ + 1) % 2;
    this.team_ = this.teams_[this.teamIndex_];
    this.opponents_ = this.teams_[this.opponentIndex_];
    this.isTeamCaptain_ = index < 2;
    this.isMaster_ = index === 0;
    this.numberOfRounds_ = this.teams_[0].length;
  };
  CharadesApp.prototype.actingTeam_ = function() {
    return this.roundNumber_.value() % 2;
  }
  CharadesApp.prototype.pickWord_ = function() {
    if (this.actingTeam_() == this.teamIndex_) {
      this.pickClue_();
    } else {
      this.pickActor_();
    }
  };
  CharadesApp.prototype.pickActor_ = function() {
    if (this.isTeamCaptain_) {
      // captain sets the next actor
      // TODO: have the team captain manually pick from team members who haven't acted yet.
      var team = this.team_.slice(0);
      // Just pick the team member who has acted the longest time ago.
      var nextActor = team.sort((function(a, b) {
            return this.lastRoundActed_.value(a) - this.lastRoundActed_.value(b);
          }).bind(this))[0];
      this.actor_.set(nextActor);
      this.lastRoundActed_.setForParticipant(nextActor, this.roundNumber_.value());
    }
  }
  CharadesApp.prototype.showWaitForClueScreen_ = function() {
    this.showTeammates();
    this.hideOpponents();
    this.showScreen_(new WaitForClueScreen(this.actor_));
  };
  CharadesApp.prototype.pickClue_ = function() {
    var screen;
    if (this.isTeamCaptain_) {
      this.showTeammates();
      this.hideOpponents();
      this.guessed_.set(false);
      screen = new EnterClueScreen(this.clue_);
    // TODO: wait for actor selection
      screen.addListener((function() { this.state_.set(CharadesAppState.ACTING); }).bind(this));
    } else {
      this.showTeammates();
      this.hideOpponents();
      screen = new WatchEnterClueScreen(this.clue_);
    }
    this.showScreen_(screen);
  };
  CharadesApp.prototype.isActing_ = function() {
    return isLocalParticipant(this.actor_.value());
  };
  CharadesApp.prototype.isActingTeam_ = function() {
    return this.team_.indexOf(this.actor_.value()) != -1;
  };
  CharadesApp.prototype.isGuessing_ = function() {
    return this.isActingTeam_() && !this.isActing_();
  }
  CharadesApp.prototype.act_ = function() {
    this.showEveryone();
    this.showActor();
    var screen = new ActingScreen(this.clue_, this.timer_);
    screen.addListener((function() { this.state_.set(CharadesAppState.ACTING_OVER); }).bind(this));
    this.showScreen_(screen);
  };
  CharadesApp.prototype.guess_ = function() {
    this.showEveryone();
    this.showActor();
    // TODO: hide opponents?
    this.showScreen_(new GuessingScreen(this.timer_));
  };
  CharadesApp.prototype.judge_ = function() {
    this.showEveryone();
    this.showActor();
    var screen = new JudgingScreen(this.timer_, this.clue_, this.guessed_);
    screen.addListener((function() { this.state_.set(CharadesAppState.ACTING_OVER); }).bind(this));
    this.showScreen_(screen);
  };
  CharadesApp.prototype.startActing_ = function() {
    if (this.isActing_()) {
      this.act_();
    } else if (this.isGuessing_()) {
      this.guess_();
    } else {
      this.judge_();
    }
  };
  CharadesApp.prototype.endActing_ = function() {
    if (this.isMaster_) {
      var actingTeam = this.teams_[this.actingTeam_()];
      for (var i = 0; i < actingTeam.length; i++) {
        var player = actingTeam[i];
        this.scores_.setForParticipant(player, this.scores_.value(player) + 1);
      }
      this.roundNumber_.addOneShotListener((function(){ this.state_.set(CharadesAppState.ROUND_END); }.bind(this)));
      this.roundNumber_.set(this.roundNumber_.value() + 1);
    }
  };
  CharadesApp.prototype.showRoundOver_ = function() {
    this.showEveryone();
    var screen = new RoundEndScreen(this.scores_, this.isMaster_);
    screen.addListener((function() { this.state_.set(CharadesAppState.START);}).bind(this));
    this.showScreen_(screen);
  };
  CharadesApp.prototype.roundEnd_ = function() {
    if (this.isGameOver_()) {
      this.showGameOver_(); // TODO:
    } else {
      this.showRoundOver_();
    }
  };
  CharadesApp.prototype.isGameOver_ = function() {
    return this.isPlaying_() && this.roundNumber_.value() > this.numberOfRounds_;
  };
  CharadesApp.prototype.isPlaying_ = function() {
    return this.state_.value() !== CharadesAppState.START && this.teams_;
  };
  CharadesApp.prototype.showNextScreen_ = function() {
    if (this.state_.value() === CharadesAppState.START) {
      this.start_();
      return;
    }

    if (!this.isPlaying_()) {
      this.waitForNewGame_();
      return;
    }

    switch (this.state_.value()) {
    case CharadesAppState.PICK_CLUE:
      this.pickWord_();
      break;
    case CharadesAppState.ACTING:
      this.startActing_();
      break;
    case CharadesAppState.ACTING_OVER:
      this.endActing_();
      break;
    case CharadesAppState.ROUND_END:
      this.roundEnd_();
      break;
    }
  };
  var DebugValue = function(initialValue) {
    EventSource.call(this);
    this.value_ = initialValue;
  };
  mixinClass(DebugValue, EventSource);
  DebugValue.prototype.set = function(value) {
    this.value_ = value;
  };
  DebugValue.prototype.value = function() {
    return this.value_;
  };
  if (debugging) {
    CharadesApp.prototype.showNextScreen_ = function() {
      var screen;
      // screen = new StartScreen();
      // TODO screen = new WaitForNewGameScreen();

      // screen = new EnterClueScreen(new DebugValue(''));
      screen = new WatchEnterClueScreen(new DebugValue('Current Clue'));
      // screen = new WaitForClueScreen(this.actor_);

      // screen = new JudgingScreen(this.timer_, this.clue_, this.guessed_);
      // screen = new GuessingScreen(this.timer_);
      // screen = new ActingScreen(this.clue_, this.timer_);

      // screen = new RoundEndScreen(this.scores_, this.isMaster_);
      screen.addListener(function() { debugger; alert('Screen complete!'); });
      this.showScreen_(screen);
    }
  }

  new CharadesApp();
});
