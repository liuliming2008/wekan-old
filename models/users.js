Users = Meteor.users;

// Search a user in the complete server database by its name or username. This
// is used for instance to add a new user to a board.
const searchInFields = ['username', 'profile.name'];
Users.initEasySearch(searchInFields, {
  'limit' : 20,
  use: 'mongo-db',
  returnFields: [...searchInFields, 'profile.avatarUrl', 'profile.fullname'],
});

Users.helpers({
  boards() {
    return Boards.find({ userId: this._id });
  },

  starredBoards() {
    const {starredBoards = []} = this.profile;
    return Boards.find({archived: false, _id: {$in: starredBoards}});
  },

  hasStarred(boardId) {
    const {starredBoards = []} = this.profile;
    return _.contains(starredBoards, boardId);
  },

  // at server side, can not use Session.get, must give boardId 
  isBoardMember(boardId) {
    if( !boardId )
      boardId = Session.get('currentBoard');
    const board = Boards.findOne(boardId);
    return board && _.contains(_.pluck(board.members, 'userId'), this._id) &&
                         _.where(board.members, {userId: this._id})[0].isActive;
  },

  // at server side, can not use Session.get, must give boardId 
  isBoardAdmin(boardId) {
    if( !boardId )
      boardId = Session.get('currentBoard');
    const board = Boards.findOne(boardId);
    return board && this.isBoardMember(board) &&
                          _.where(board.members, {userId: this._id})[0].isAdmin;
  },

  // at server side, can not use Session.get, must give orgId 
  isOrganizationMember(orgId) {
    let org;
    if( orgId )
      org = Organizations.findOne(orgId);
    else
      org = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    return org && _.contains(_.pluck(org.members, 'userId'), this._id) &&
                         _.where(org.members, {userId: this._id})[0].isActive;
  },

  // at server side, can not use Session.get, must give orgId 
  isOrganizationAdmin(orgId) {
    let org;
    if( orgId )
      org = Organizations.findOne(orgId);
    else
      org = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    if (org && this.isOrganizationMember(org))
      return _.where(org.members, {userId: this._id})[0].isAdmin;
  },
  
  getAvatarUrl() {
    // Although we put the avatar picture URL in the `profile` object, we need
    // to support Sandstorm which put in the `picture` attribute by default.
    // XXX Should we move both cases to `picture`?
    if (this.picture) {
      return this.picture;
    } else if (this.profile && this.profile.avatarUrl) {
      return this.profile.avatarUrl;
    } else {
      return null;
    }
  },

  getInitials() {
    const profile = this.profile || {};
    if (profile.initials)
      return profile.initials;

    else if (profile.fullname) {
      return profile.fullname.split(/\s+/).reduce((memo = '', word) => {
        return memo + word[0];
      }).toUpperCase();

    } else {
      return this.username[0].toUpperCase();
    }
  },

  hasVoted(cardId) {
    const votedCards = this.profile.votedCards || [];
    return _.contains(_.pluck(votedCards, 'cardId'), cardId);
  },

  getTodayVotes(){
    const today = new Date();
    const lastVoteDate = this.profile.lastVoteDate;
    if( !lastVoteDate || Utils.compareDay(today, lastVoteDate) === 1 )
      return 0;
    else{
      return this.profile.todayVotes;
    }
       
  },
  todayVotesLeft(){
    return 5 - this.getTodayVotes();
  },

  voteCard(cardId){
    if( !this.hasVoted(cardId) && this.getTodayVotes() < 5 ){
      Cards.update(cardId, {$inc: {votes: 1}});  
      const today = new Date();
      const lastVoteDate = this.profile.lastVoteDate;
      if(!lastVoteDate || Utils.compareDay(today, lastVoteDate) === 1 )
        Meteor.users.update(this._id, {
          $set: {
            'profile.todayVotes': 1,
          },
        });
      else 
        Meteor.users.update(this._id, {
          $inc: {
            'profile.todayVotes':1,
          },
        });
      
      Meteor.users.update(this._id, {
        $set: {
          'profile.lastVoteDate': today,
        },
      });
      const queryKind =  '$addToSet';
      Meteor.users.update(this._id, {
        [queryKind]: {
          'profile.votedCards': {cardId, date: today},
        },
      });
    }
   
  },
});

Users.mutations({
  toggleBoardStar(boardId) {
    const queryKind = this.hasStarred(boardId) ? '$pull' : '$addToSet';
    return {
      [queryKind]: {
        'profile.starredBoards': boardId,
      },
    };
  },

  setAvatarUrl(avatarUrl) {
    return { $set: { 'profile.avatarUrl': avatarUrl }};
  },

});

Meteor.methods({
  setUsername(username) {
    check(username, String);
    const nUsersWithUsername = Users.find({ username }).count();
    if (nUsersWithUsername > 0) {
      throw new Meteor.Error('username-already-taken');
    } else {
      Users.update(this.userId, {$set: { username }});
    }
  },
});

if (Meteor.isServer) {
  Meteor.methods({
    enrollAccount (email) {
      check(email,String);
      const newUserId = Accounts.createUser({email: email, username:email.substring(0, email.indexOf('@')), password: 'smoch.cn'});
      
      // custom enroll template
      Accounts.sendEnrollmentEmail(newUserId);

      return newUserId;
    },
    enrollAccounts (emails, destType,destId) {
      check(emails,Array);
      check(destType,String);
      check(destId,String);
<<<<<<< HEAD
      let dest = null;
=======
>>>>>>> new feature：invite members to board or organization with email
      for(var i=0;i<emails.length;i++){
        let userId;
        if ( emails[i].indexOf('@') < 1 )
          continue;
        if( !Users.findOne({emails: {$elemMatch: {address:emails[i]}}})  ){
          userId = Meteor.call('enrollAccount', emails[i]);
        }
        else
          userId = Users.findOne({emails: {$elemMatch: {address:emails[i]}}})._id;
        if( userId )
        {
<<<<<<< HEAD
          if( dest === null ){
            if( destType === 'organization' && Meteor.user().isOrganizationAdmin(destId) ){
                dest = Organizations.findOne(destId);
            }
            else if( destType === 'board' && Meteor.user().isBoardAdmin(destId) ){
              dest = Boards.findOne(destId);   
            }
          }
            
          if( dest)
            dest.addMember(userId);
=======
          if( destType === 'organization' && Meteor.user().isOrganizationAdmin(destId) ){
            let org = Organizations.findOne(destId);
            org.addMember(userId);
          }
          else if( destType === 'board' && Meteor.user().isBoardAdmin(destId) ){
            let board = Boards.findOne(destId);
            board.addMember(userId);
          }
>>>>>>> new feature：invite members to board or organization with email
        }
        
      }
    },
  });
};

Users.before.insert((userId, doc) => {
  doc.profile = doc.profile || {};

  if (!doc.username && doc.profile.name) {
    doc.username = doc.profile.name.toLowerCase().replace(/\s/g, '');
  }
});

if (Meteor.isServer) {
  // Let mongoDB ensure username unicity
  Meteor.startup(() => {
    Users._collection._ensureIndex({
      username: 1,
    }, { unique: true });
  });

  // Each board document contains the de-normalized number of users that have
  // starred it. If the user star or unstar a board, we need to update this
  // counter.
  // We need to run this code on the server only, otherwise the incrementation
  // will be done twice.
  Users.after.update(function(userId, user, fieldNames) {
    // The `starredBoards` list is hosted on the `profile` field. If this
    // field hasn't been modificated we don't need to run this hook.
    if (!_.contains(fieldNames, 'profile'))
      return;

    // To calculate a diff of board starred ids, we get both the previous
    // and the newly board ids list
    function getStarredBoardsIds(doc) {
      return doc.profile && doc.profile.starredBoards;
    }
    const oldIds = getStarredBoardsIds(this.previous);
    const newIds = getStarredBoardsIds(user);

    // The _.difference(a, b) method returns the values from a that are not in
    // b. We use it to find deleted and newly inserted ids by using it in one
    // direction and then in the other.
    function incrementBoards(boardsIds, inc) {
      boardsIds.forEach((boardId) => {
        Boards.update(boardId, {$inc: {stars: inc}});
      });
    }
    incrementBoards(_.difference(oldIds, newIds), -1);
    incrementBoards(_.difference(newIds, oldIds), +1);
  });

  // XXX i18n
  // Users.after.insert((userId, doc) => {
  //   const ExampleBoard = {
  //     title: 'Welcome Board',
  //     userId: doc._id,
  //     permission: 'private',
  //   };

  //   // Insert the Welcome Board
  //   Boards.insert(ExampleBoard, (err, boardId) => {
  //     let sort = 0;
  //     ['Basics', 'Advanced'].forEach((title) => {
  //       const list = {
  //         title,
  //         boardId,
  //         userId: ExampleBoard.userId,
  //         sort,
  //         permission: 'member',

  //         // XXX Not certain this is a bug, but we except these fields get
  //         // inserted by the Lists.before.insert collection-hook. Since this
  //         // hook is not called in this case, we have to dublicate the logic and
  //         // set them here.
  //         archived: false,
  //         createdAt: new Date(),
  //       };

  //       Lists.insert(list);
  //       sort++;
  //     });
  //   });
  // });
}
