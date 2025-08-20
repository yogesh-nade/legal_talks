import forumService from '../services/forums';
import postService from '../services/posts';

const forumPageReducer = (state = null, action) => {
  switch (action.type) {
    case 'FETCH_FORUM':
      return action.payload;
    case 'LOAD_FORUM_POSTS':
      return {
        ...state,
        posts: {
          ...action.payload.posts,
          results: [...state.posts.results, ...action.payload.posts.results],
        },
      };
    case 'TOGGLE_FORUMPAGE_VOTE':
      return {
        ...state,
        posts: {
          ...state.posts,
          results: state.posts.results.map((p) =>
            p.id !== action.payload.id ? p : { ...p, ...action.payload.data }
          ),
        },
      };
    case 'SUBSCRIBE_FORUM':
      return {
        ...state,
        forumDetails: { ...state.forumDetails, ...action.payload },
      };
    case 'EDIT_DESCRIPTION':
      return {
        ...state,
        forumDetails: { ...state.forumDetails, description: action.payload },
      };
    default:
      return state;
  }
};

export const fetchForum = (forumName, sortBy) => {
  return async (dispatch) => {
    const forum = await forumService.getForum(forumName, sortBy, 10, 1);

    dispatch({
      type: 'FETCH_FORUM',
      payload: forum,
    });
  };
};

export const loadForumPosts = (forumName, sortBy, page) => {
  return async (dispatch) => {
    const forum = await forumService.getForum(forumName, sortBy, 10, page);

    dispatch({
      type: 'LOAD_FORUM_POSTS',
      payload: forum,
    });
  };
};

export const toggleUpvote = (id, upvotedBy, downvotedBy) => {
  return async (dispatch) => {
    let pointsCount = upvotedBy.length - downvotedBy.length;
    if (pointsCount < 0) {
      pointsCount = 0;
    }

    dispatch({
      type: 'TOGGLE_FORUMPAGE_VOTE',
      payload: { id, data: { upvotedBy, pointsCount, downvotedBy } },
    });

    await postService.upvotePost(id);
  };
};

export const toggleDownvote = (id, downvotedBy, upvotedBy) => {
  return async (dispatch) => {
    let pointsCount = upvotedBy.length - downvotedBy.length;
    if (pointsCount < 0) {
      pointsCount = 0;
    }

    dispatch({
      type: 'TOGGLE_FORUMPAGE_VOTE',
      payload: { id, data: { upvotedBy, pointsCount, downvotedBy } },
    });

    await postService.downvotePost(id);
  };
};

export const toggleSubscribe = (id, subscribedBy) => {
  return async (dispatch) => {
    const subscriberCount = subscribedBy.length;

    dispatch({
      type: 'SUBSCRIBE_FORUM',
      payload: { subscribedBy, subscriberCount },
    });

    await forumService.subscribeForum(id);
  };
};

export const editDescription = (id, description) => {
  return async (dispatch) => {
    await forumService.updateDescription(id, { description });

    dispatch({
      type: 'EDIT_DESCRIPTION',
      payload: description,
    });
  };
};

export default forumPageReducer;
