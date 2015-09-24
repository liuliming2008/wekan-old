let previousPath;
FlowRouter.triggers.exit([({path}) => {
  previousPath = path;
}]);

FlowRouter.route('/', {
  name: 'home',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    Session.set('currentOrganizationShortName', null);
    Session.set('currentBoard', null);
    Session.set('currentCard', null);
    Session.set('previousURL', FlowRouter.current().path);
    
    Filter.reset();
    EscapeActions.executeAll();

    BlazeLayout.render('boardsLayout', { content: 'boardList' });
  }
});


FlowRouter.route('/org/:shortName', {
  name: 'organization',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action: function(params) {
    Session.set('currentOrganizationShortName', params.shortName);
    Session.set('currentBoard', null);
    Session.set('currentCard', null);
    Session.set('previousURL', FlowRouter.current().path);

    BlazeLayout.render('orgsLayout', { content: 'organization' });
  }
});

FlowRouter.route('/b/:id/:slug', {
  name: 'board',
  action(params) {
    const currentBoard = params.id;
    const previousBoard = Session.get('currentBoard');
    Session.set('currentOrganizationShortName', null);
    Session.set('currentBoard', currentBoard);
    Session.set('currentCard', null);
<<<<<<< HEAD
    Session.set('currentBoardSort', null);
    Session.set('previousURL', FlowRouter.current().path);
=======
    Session.get('currentBoardSort', null);
>>>>>>> merge wekan

    // If we close a card, we'll execute again this route action but we don't
    // want to excape every current actions (filters, etc.)
    if (previousBoard !== currentBoard) {
      EscapeActions.executeAll();
    } else {
      EscapeActions.executeUpTo('popup-close');
    }

    BlazeLayout.render('defaultLayout', { content: 'board' });
  },
});

FlowRouter.route('/b/:boardId/:slug/:cardId', {
  name: 'card',
  action(params) {
    EscapeActions.executeUpTo('inlinedForm');

    Session.set('currentOrganizationShortName', null);
    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', params.cardId);
    //Session.set('cardURL', FlowRouter.current().path);
    Session.set('previousURL', FlowRouter.current().path);

    BlazeLayout.render('defaultLayout', { content: 'board' });
  },
});

FlowRouter.route('/shortcuts', {
  name: 'shortcuts',
  action() {
    const shortcutsTemplate = 'keyboardShortcuts';

    EscapeActions.executeUpTo('popup-close');

    if (previousPath) {
      Modal.open(shortcutsTemplate, {
        onCloseGoTo: previousPath,
      });
    } else {
      // XXX There is currently no way to escape this page on Sandstorm
      BlazeLayout.render('defaultLayout', { content: shortcutsTemplate });
    }
  },
});

FlowRouter.notFound = {
  action() {
    BlazeLayout.render('defaultLayout', { content: 'notFound' });
  },
};

// As it is not possible to use template helpers in the page <head> we create a
// reactive function whose role is to set any page-specific tag in the <head>
// using the `kadira:dochead` package. Currently we only use it to display the
// board title if we are in a board page (see #364) but we may want to support
// some <meta> tags in the future.
const appTitle = '思奇';

// XXX The `Meteor.startup` should not be necessary -- we don't need to wait for
// the complete DOM to be ready to call `DocHead.setTitle`. But the problem is
// that the global variable `Boards` is undefined when this file loads so we
// wait a bit until hopefully all files are loaded. This will be fixed in a
// clean way once Meteor will support ES6 modules -- hopefully in Meteor 1.3.
Meteor.startup(() => {
  Tracker.autorun(() => {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const titleStack = [appTitle];
    if (currentBoard) {
      titleStack.push(currentBoard.title);
    }
    DocHead.setTitle(titleStack.reverse().join(' - '));
  });
});

