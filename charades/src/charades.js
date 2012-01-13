gapi.hangout.onApiReady.add(function() {

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
  var debugging = true;
  var assert = function(value) {
    if (debugging && !value) {
      debugger;
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
  EventSource.prototype.fireOnCondition_ = function(source, condition) {
    var listener = (function(var_args) {
      if (condition.apply(null, arguments)) {
        source.removeListener(listener);
        this.fireListeners_();
      }
    }).bind(this);
    app.state().addListener(listener);
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
  var createTextNode = document.createTextNode.bind(document);
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
  }
  var createTextInput = function(value, attributes) {
    var result = createElement('input', attributes);
    result.type = 'text';
    result.value = value || '';
    return result;
  };
  var createButton = function(text, attributes) {
    var result = createElement('input', attributes);
    result.type = 'button';
    result.value = text;
    return result;
  };
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
    this.keyprefix_ = id + '$';
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
      if (key.indexOf(this.keyprefix_) == 0) {
        id = key.substr(this.keyprefix_.length);
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
          !((this.keyprefix_ + id) in gapi.hangout.data.getState())) {
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
    delta[this.keyprefix_ + participantId] = stringify(value);
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
    this.dom_.value = this.data_.value();
  };

  var ReadyList = function(minimumPlayers) {
    EventSource.call(this);
    this.minimumPlayers_ = minimumPlayers;
    this.div_ = createElement('table');
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
    var name = createTextNode(gapi.hangout.getParticipantById(id).person.displayName + ' ' + id);
    var status = createElement('input');
    status.type = 'checkbox';
    status.disabled = true;
    var row = createElement('tr', [name, status]);

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

  var Screen = function(app) {
    Disposable.call(this);
    this.app_ = app;
  };
  mixinClass(Screen, Disposable);
  Screen.prototype.show = function(parent) {
    parent.appendChild(this.dom());
  };
  Screen.prototype.dispose = function() {
    removeElement(this.dom());
    Disposable.prototype.dispose.call(this);
  };

  var StartScreen = function(app) {
    Screen.call(this, app);
    app.showEveryone();
    this.readyList_ = new ReadyList(2);
    this.registerDispose(this.readyList_);
    this.readyList_.reset();
    this.readyList_.addListener(this.app_.everyoneReady.bind(this.app_));
  };
  mixinClass(StartScreen, Screen);
  StartScreen.prototype.dom = function() { return this.readyList_.dom(); };

  var WaitForNewGameScreen = function(app) {
    Screen.call(this, app);
    app.showEveryone();
    // TODO: show game progress - teams, score, round, etc.
    this.dom_ = createTextNode('Game already in progress. Waiting for game to finish...');
  }
  mixinClass(WaitForNewGameScreen, Screen);
  WaitForNewGameScreen.prototype.dom = function() { return this.dom_; };

  var WaitForClueScreen = function(app) {
    Screen.call(this, app);

    app.showTeammates();
    app.hideOpponents();

    this.messageNode_ = createTextNode('');
    this.actor_ = app.actor();
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

  var EnterClueScreen = function(app) {
    Screen.call(this, app);
    // TODO: add timer?
    app.showTeammates();
    app.hideOpponents();

    this.message_ = createTextNode('Enter Clue:');
    this.input_ = new TextInput();
    this.done_ = createButton('Start!');
    this.dom_ = createElement('div', [this.message_, this.input_.dom(), this.done_]);
    this.input_.onChange.addListener(this.onChanged_.bind(this));
    this.done_.addEventListener('click', this.onDone_.bind(this));
    app.guessed().set(false);
  };
  mixinClass(EnterClueScreen, Screen);
  EnterClueScreen.prototype.dom = function() { return this.dom_; };
  EnterClueScreen.prototype.onChanged_ = function() {
    this.app_.clue().set(this.input_.value());
  };
  EnterClueScreen.prototype.onDone_ = function() {
    // TODO: wait for actor selection
    this.app_.state().set(CharadesAppState.ACTING);
  };

  var WatchEnterClueScreen = function(app) {
    Screen.call(this, app);

    app.showTeammates();
    app.hideOpponents();

    this.message_ = createTextNode('Current Clue:');
    this.clue_ = new SharedTextNode(app.clue());
    this.registerDispose(this.clue_);
    this.dom_ = createElement('div', [this.message_, this.clue_.dom()]);
  };
  mixinClass(WatchEnterClueScreen, Screen);
  WatchEnterClueScreen.prototype.dom = function() { return this.dom_; };

  var ActingScreen = function(app) {
    Screen.call(this, app);

    app.showEveryone();
    gapi.hangout.av.setMicrophoneMute(true);
    app.showActor();

    this.message_ = createTextNode('Current Clue:');
    this.clue_ = createTextNode(app.clue().value());
    this.startTime_ = Date.now();
    this.timeRemaining_ = new SharedTextNode(app.timer());
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
      this.app_.state().set(CharadesAppState.ACTING_OVER);
    }
    this.app_.timer().set('Time Remaining: ' + (remaining * 1000).toFixed(1));
  };

  var GuessingScreen = function(app) {
    Screen.call(this, app);

    app.showEveryone();
    app.showActor();

    // TODO: hide opponents?
    this.timeRemaining_ = new SharedTextNode(app.timer());
    this.registerDispose(this.timeRemaining_);
    this.dom_ = this.timeRemaining_.dom();
  }
  mixinClass(GuessingScreen, Screen);
  GuessingScreen.prototype.dom = function() { return this.dom_; };

  var JudgingScreen = function(app) {
    Screen.call(this, app);

    app.showEveryone();
    app.showActor();

    this.timeRemaining_ = new SharedTextNode(app.timer());
    this.registerDispose(this.timeRemaining_);
    this.message_ = createTextNode('Current clue is: ' + app.clue().value());
    this.correctButton_ = createButton('Opponents Guessed Correct!');
    this.correctButton_.addEventListener('click', this.onGuessed_.bind(this));
    this.dom_ = createElement('div', [this.message_, this.correctButton_, this.timeRemaining_.dom()]);
  }
  mixinClass(JudgingScreen, Screen);
  JudgingScreen.prototype.dom = function() { return this.dom_; };
  JudgingScreen.prototype.onGuessed_ = function() {
    this.app_.guessed().set(true);
    this.app_.state().set(CharadesAppState.ACTING_OVER);
  }

  var ScoresList = function(app) {
    // table, rows & score
    var rows = [];
    var participants = app.scores().players();
    // TODO: Show only score for this game?
    // TODO: Sort by team?
    for (var i = 0; i < participants.length; i++) {
      rows.push(createElement('tr', [
          createTextNode(participants[i]),
          createTextNode(app.scores().value(participants[i]))
        ]));
    }
    this.dom_ = createElement('table', rows);
  };
  ScoresList.prototype.dom = function() { return this.dom_; };

  var RoundEndScreen = function(app) {
    Screen.call(this, app);

    app.showEveryone();

    var scores = new ScoresList(app);
    var elements = [scores.dom()];
    if (app.isMaster()) {
      // TODO: master gets next game button? or Timer?
      var button = createButton('Start Next Game!');
      button.addEventListener('click', function() {app.state().set(CharadesAppState.START);});
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
  CharadesApp.prototype.isMaster = function() {
    return this.isMaster_;
  };
  CharadesApp.prototype.clue = function() {
    return this.clue_;
  };
  CharadesApp.prototype.scores = function() {
    return this.scores_;
  };
  CharadesApp.prototype.state = function() {
    return this.state_;
  };
  CharadesApp.prototype.actor = function() {
    return this.actor_;
  };
  CharadesApp.prototype.guessed = function() {
    return this.guessed_;
  };
  CharadesApp.prototype.timer = function() {
    return this.timer_;
  };
  CharadesApp.prototype.init = function() {
    this.showNextScreen_();
  };
  CharadesApp.prototype.waitForNewGame_ = function() {
    this.showScreen_(new WaitForNewGameScreen(this));
  };
  CharadesApp.prototype.showScreen_ = function(screen) {
    if (this.screen_) {
      this.screen_.dispose();
    }
    this.screen_ = screen;
    this.screen_.show(this.mainDiv_);
  };
  CharadesApp.prototype.showActor = function() {
    gapi.hangout.setDisplayedParticipant(this.actor().value());
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
    this.showScreen_(new StartScreen(this));
  };
  CharadesApp.prototype.everyoneReady = function(playerIds) {
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
    this.showScreen_(new WaitForClueScreen(this));
  };
  CharadesApp.prototype.pickClue_ = function() {
    var screen;
    if (this.isTeamCaptain_) {
      screen = new EnterClueScreen(this);
    } else {
      screen = new WatchEnterClueScreen(this);
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
    this.showScreen_(new ActingScreen(this));
  };
  CharadesApp.prototype.guess_ = function() {
    this.showScreen_(new GuessingScreen(this));
  };
  CharadesApp.prototype.judge_ = function() {
    this.showScreen_(new JudgingScreen(this));
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
    this.showScreen_(new RoundEndScreen(this));
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

  new CharadesApp();
});
