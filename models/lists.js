Lists = new Mongo.Collection('lists');

Lists.attachSchema(new SimpleSchema({
  title: {
    type: String,
  },
  archived: {
    type: Boolean,
  },
  boardId: {
    type: String,
  },
  createdAt: {
    type: Date,
    denyUpdate: true,
  },
  permission: {
    type: String,
    allowedValues: ['anonymous','registered', 'member', 'admin']
  },
  sort: {
    type: Number,
    decimal: true,
    // XXX We should probably provide a default
    optional: true,
  },
  updatedAt: {
    type: Date,
    denyInsert: true,
    optional: true,
  },
}));

Lists.allow({
  insert(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});

Lists.helpers({
  cards() {
    var sortTypeText = Session.get("currentBoardSort");
    var sortType = {};
    if( !sortTypeText )
      sortTypeText = this.board.sortType;
    if( !sortTypeText )
      sortTypeText = 'sort';

    if( sortTypeText === 'sort' )
      sortType[sortTypeText] = 1;
    else
      sortType[sortTypeText] = -1;

    var slector = {
      listId: this._id,
      archived: false,
    };
       
    return Cards.find(Filter.mongoSelector(slector), { sort: sortType });
  },

  allCards() {
    return Cards.find({ listId: this._id });
  },

  board() {
    return Boards.findOne(this.boardId);
  },
});

Lists.mutations({
  rename(title) {
    return { $set: { title }};
  },

  archive() {
    return { $set: { archived: true }};
  },

  restore() {
    return { $set: { archived: false }};
  },
});

Lists.hookOptions.after.update = { fetchPrevious: false };

Lists.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.archived = false;
  if (!doc.userId)
    doc.userId = userId;
});

Lists.before.update((userId, doc, fieldNames, modifier) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

if (Meteor.isServer) {
  Lists.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      type: 'list',
      activityType: 'createList',
      boardId: doc.boardId,
      listId: doc._id,
    });
  });

  Lists.after.update((userId, doc) => {
    if (doc.archived) {
      Activities.insert({
        userId,
        type: 'list',
        activityType: 'archivedList',
        listId: doc._id,
        boardId: doc.boardId,
      });
    }
  });
}
