Lists = new Mongo.Collection('lists');

Lists.attachSchema(new SimpleSchema({
  title: {
    type: String
  },
  archived: {
    type: Boolean
  },
  boardId: {
    type: String
  },
  createdAt: {
    type: Date,
    denyUpdate: true
  },
  
  sort: {
    type: Number,
    decimal: true,
    // XXX We should probably provide a default
    optional: true
  },
  updatedAt: {
    type: Date,
    denyInsert: true,
<<<<<<< HEAD
    optional: true
  }
=======
    optional: true,
  },
  permission: {
    type: String,
    allowedValues: ['any','registered', 'member', 'admin']
  },
>>>>>>> fix bug
}));

if (Meteor.isServer) {
  Lists.allow({
    insert: function(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    update: function(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    remove: function(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    fetch: ['boardId']
  });
}

Lists.helpers({
  cards: function() { 
    var sortTypeText = Session.get("currentBoardSort");
    var sortType = {};
    if( sortTypeText )
      sortType[sortTypeText] = sortTypeText=='sort'?1:-1 ;
    else if (this.board.sortType)
      sortType[this.board.sortType] = sortTypeText=='sort'?1:-1 ;
    else
      sortType = ['sort'];  

    var slector = {
      listId: this._id,
      archived: false
    };

    // var ret = new Mongo.Collection("");
    // var cards = Cards.find(Filter.mongoSelector(slector), { sort: [sortType] });

    // // miniMongo dont have index now!
    // var searchText = Session.get('currentBoardSearchText');
    // if( searchText ){
    //   for( var i=cards.length-1;i--;i>=0)
    //       {
            
    //         if( cards[i].title.indexOf(text) > 0 )
    //           //cards.splice(i,1); 
    //           var card = cards[i];
    //           ret.insert({
    //             title: card.title,
    //             archived: card.archived,
    //             listId: card.listId,
    //             boardId: card.boardId,
    //             coverId:card.coverId,
    //             createdAt: card.createdAt,
    //             dateLastActivity: card.dateLastActivity,
    //             description: card.description,
    //             labelIds: card.labelIds,
    //             members: card.members,
    //             // XXX Should probably be called `authorId`. Is it even needed since we have
    //             // the `members` field?
    //             userId: card.userId,
    //             votes: card.votes,
    //             sort: card.sort,
    //           });
             
    //       }    
    // }
    // else
    //   ret = cards;
       
    return Cards.find(Filter.mongoSelector(slector), { sort: sortType });
  },
  board: function() {
    return Boards.findOne(this.boardId);
  }
});

// HOOKS
Lists.hookOptions.after.update = { fetchPrevious: false };

Lists.before.insert(function(userId, doc) {
  doc.createdAt = new Date();
  doc.archived = false;
  doc.permission = doc.permission || "member";

  if (! doc.userId)
    doc.userId = userId;
});

Lists.before.update(function(userId, doc, fieldNames, modifier) {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

if (Meteor.isServer) {
  Lists.after.insert(function(userId, doc) {
    Activities.insert({
      type: 'list',
      activityType: 'createList',
      boardId: doc.boardId,
      listId: doc._id,
      userId: userId
    });
  });

  Lists.after.update(function(userId, doc) {
    if (doc.archived) {
      Activities.insert({
        type: 'list',
        activityType: 'archivedList',
        listId: doc._id,
        boardId: doc.boardId,
        userId: userId
      });
    }
  });
}
