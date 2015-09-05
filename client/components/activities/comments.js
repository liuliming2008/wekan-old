const commentFormIsOpen = new ReactiveVar(false);

BlazeComponent.extendComponent({
  template() {
    return 'commentForm';
  },

  onDestroyed() {
    commentFormIsOpen.set(false);
  },

  commentFormIsOpen() {
    return commentFormIsOpen.get();
  },

  getInput() {
    return this.$('.js-new-comment-input');
  },
    evt.preventDefault();  },
}).register('commentForm');

// XXX This should be a static method of the `commentForm` component
function resetCommentInput(input) {
  input.val('');
  input.blur();
  commentFormIsOpen.set(false);
}

// XXX This should handled a `onUpdated` callback of the `commentForm` component
// but since this callback doesn't exists, and `onRendered` is not called if the
// data is not destroyed and recreated, we simulate the desired callback using
// Tracker.autorun to register the component dependencies, and re-run when these
// dependencies are invalidated. A better component API would remove this hack.
Tracker.autorun(() => {
  Session.get('currentCard');
  Tracker.afterFlush(() => {
    autosize.update($('.js-new-comment-input'));
  });
});

EscapeActions.register('inlinedForm',
  () => {
    const draftKey = {
      fieldName: 'cardComment',
      docId: Session.get('currentCard'),
    };
    const commentInput = $('.js-new-comment-input');
    const draft = commentInput.val().trim();
    if (draft) {
      UnsavedEdits.set(draftKey, draft);
    } else {
      UnsavedEdits.reset(draftKey);
    }
    resetCommentInput(commentInput);
  },
  () => { return commentFormIsOpen.get(); }, {
    noClickEscapeOn: '.js-new-comment',
  }
);
