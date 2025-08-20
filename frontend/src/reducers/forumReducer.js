import forumService from '../services/forums';

const forumReducer = (state = null, action) => {
  switch (action.type) {
    case 'SET_ALL_FORUMS_LIST':
      return { ...state, allForums: action.payload };
    case 'SET_TOP_FORUMS_LIST':
      return { ...state, topForums: action.payload };
    case 'SUBSCRIBE_FORUM_FROM_LIST':
      return {
        ...state,
        topForums: state.topForums.map((t) =>
          t.id !== action.payload.id ? t : { ...t, ...action.payload.data }
        ),
      };
    case 'ADD_NEW_FORUM':
      return {
        ...state,
        allForums: [...state.allForums, action.payload],
      };
    default:
      return state;
  }
};

export const setForumList = () => {
  return async (dispatch) => {
    const forums = await forumService.getAllForums();

    dispatch({
      type: 'SET_ALL_FORUMS_LIST',
      payload: forums,
    });
  };
};

export const setTopForumsList = () => {
  return async (dispatch) => {
    const top10Forums = await forumService.getTopForums();

    dispatch({
      type: 'SET_TOP_FORUMS_LIST',
      payload: top10Forums,
    });
  };
};

export const toggleSubscribe = (id, subscribedBy) => {
  return async (dispatch) => {
    const subscriberCount = subscribedBy.length;

    dispatch({
      type: 'SUBSCRIBE_FORUM_FROM_LIST',
      payload: { id, data: { subscribedBy, subscriberCount } },
    });

    await forumService.subscribeForum(id);
  };
};

export const addNewForum = (forumObj) => {
  return async (dispatch) => {
    const createdForum = await forumService.createForum(forumObj);

    dispatch({
      type: 'ADD_NEW_FORUM',
      payload: {
        forumName: createdForum.forumName,
        id: createdForum.id,
      },
    });
  };
};

export default forumReducer;
