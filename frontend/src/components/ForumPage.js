import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchForum,
  toggleUpvote,
  toggleDownvote,
  toggleSubscribe,
  editDescription,
  loadForumPosts,
} from '../reducers/forumPageReducer';
import { notify } from '../reducers/notificationReducer';
import SortTabBar from './SortTabBar';
import PostCard from './PostCard';
import LoadMoreButton from './LoadMoreButton';
import PostFormModal from './PostFormModal';
import ErrorPage from './ErrorPage';
import LoadingSpinner from './LoadingSpinner';
import getErrorMsg from '../utils/getErrorMsg';

import {
  Container,
  Paper,
  Typography,
  Button,
  Link,
  TextField,
} from '@material-ui/core';
import { useForumPageStyles } from '../styles/muiStyles';
import CakeIcon from '@material-ui/icons/Cake';
import PersonIcon from '@material-ui/icons/Person';
import CheckIcon from '@material-ui/icons/Check';
import GroupIcon from '@material-ui/icons/Group';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import PostAddIcon from '@material-ui/icons/PostAdd';

const ForumPage = () => {
  const classes = useForumPageStyles();
  const { forum } = useParams();
  const dispatch = useDispatch();
  const { user, forumPage } = useSelector((state) => state);
  const [editOpen, setEditOpen] = useState(false);
  const [descInput, setDescInput] = useState('');
  const [sortBy, setSortBy] = useState('hot');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [pageError, setPageError] = useState(null);

  useEffect(() => {
    const getForum = async () => {
      try {
        await dispatch(fetchForum(forum, 'hot'));
        setPageLoading(false);
      } catch (err) {
        setPageError(getErrorMsg(err));
      }
    };
    getForum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forum]);

  useEffect(() => {
    if (forumPage) {
      setDescInput(forumPage.forumDetails.description);
    }
  }, [forumPage]);

  if (pageError) {
    return (
      <Container disableGutters>
        <Paper variant="outlined" className={classes.mainPaper}>
          <ErrorPage errorMsg={pageError} />
        </Paper>
      </Container>
    );
  }

  if (!forumPage || pageLoading) {
    return (
      <Container disableGutters>
        <Paper variant="outlined" className={classes.mainPaper}>
          <LoadingSpinner text={'Fetching forum data...'} />
        </Paper>
      </Container>
    );
  }

  const {
    forumName,
    subscribedBy,
    subscriberCount,
    description,
    admin,
    createdAt,
    id,
  } = forumPage.forumDetails;

  const isSubscribed = user && subscribedBy.includes(user.id);

  const handleForumJoin = async () => {
    try {
      let updatedSubscribedBy = [];

      if (isSubscribed) {
        updatedSubscribedBy = subscribedBy.filter((s) => s !== user.id);
      } else {
        updatedSubscribedBy = [...subscribedBy, user.id];
      }
      await dispatch(toggleSubscribe(id, updatedSubscribedBy));

      let message = isSubscribed
        ? `Unsubscribed from f/${forumName}`
        : `Subscribed to f/${forumName}!`;
      dispatch(notify(message, 'success'));
    } catch (err) {
      dispatch(notify(getErrorMsg(err), 'error'));
    }
  };

  const handleEditDescription = async () => {
    try {
      await dispatch(editDescription(id, descInput));
      setEditOpen(false);
      dispatch(
        notify(`Updated description of your forum: f/${forumName}`, 'success')
      );
    } catch (err) {
      dispatch(notify(getErrorMsg(err), 'error'));
    }
  };

  const handleTabChange = async (e, newValue) => {
    try {
      setPostsLoading(true);
      await dispatch(fetchForum(forum, newValue));
      setSortBy(newValue);
      setPostsLoading(false);

      if (page !== 1) {
        setPage(1);
      }
    } catch (err) {
      setPostsLoading(false);
      dispatch(notify(getErrorMsg(err), 'error'));
    }
  };

  const handleLoadPosts = async () => {
    try {
      setLoadingMore(true);
      await dispatch(loadForumPosts(forum, sortBy, page + 1));
      setPage((prevState) => prevState + 1);
      setLoadingMore(false);
    } catch (err) {
      dispatch(notify(getErrorMsg(err), 'error'));
    }
  };

  return (
    <Container disableGutters>
      <Paper variant="outlined" className={classes.mainPaper}>
        <Paper variant="outlined" className={classes.forumInfoWrapper}>
          <div className={classes.firstPanel}>
            <Typography variant="h6" color="secondary">
              f/{forumName}
            </Typography>
            <div className={classes.description}>
              {!editOpen ? (
                <Typography variant="body1">{description}</Typography>
              ) : (
                <div className={classes.inputDiv}>
                  <TextField
                    multiline
                    required
                    fullWidth
                    rows={2}
                    rowsMax={Infinity}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                  <div className={classes.submitBtns}>
                    <Button
                      onClick={() => setEditOpen(false)}
                      color="primary"
                      variant="outlined"
                      size="small"
                      className={classes.cancelBtn}
                      style={{ padding: '0.2em' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEditDescription}
                      color="primary"
                      variant="outlined"
                      size="small"
                      style={{ padding: '0.2em' }}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              )}
              {user && user.id === admin.id && !editOpen && (
                <Button
                  onClick={() => setEditOpen((prevState) => !prevState)}
                  size="small"
                  variant="outlined"
                  color="primary"
                  style={{ padding: '0.2em', marginLeft: '0.5em' }}
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
              )}
            </div>
            <Typography
              variant="body2"
              className={classes.iconText}
              color="secondary"
            >
              <CakeIcon style={{ marginRight: 5 }} /> Created
              {' ' +
                String(new Date(createdAt)).split(' ').slice(1, 4).join(' ')}
            </Typography>
            <Typography
              variant="body2"
              color="secondary"
              className={classes.iconText}
            >
              <PersonIcon style={{ marginRight: 5 }} />
              Admin:
              <Link
                component={RouterLink}
                to={`/u/${admin.username}`}
                style={{ marginLeft: '0.3em' }}
              >
                u/{admin.username}
              </Link>
            </Typography>
          </div>
          <div className={classes.secondPanel}>
            {user && (
              <Button
                color="primary"
                variant="contained"
                startIcon={isSubscribed ? <CheckIcon /> : <AddIcon />}
                className={classes.joinBtn}
                onClick={handleForumJoin}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Button>
            )}
            <Typography
              variant="body2"
              color="primary"
              className={classes.iconText}
            >
              <GroupIcon style={{ marginRight: 5 }} />
              {subscriberCount} subscribers
            </Typography>
          </div>
        </Paper>
        <PostFormModal fromForum={{ forumName, id }} />
        <SortTabBar sortBy={sortBy} handleTabChange={handleTabChange} />
        {postsLoading ? (
          <LoadingSpinner text={'Fetching forum posts...'} />
        ) : (
          <>
            <div>
              {forumPage.posts.results.length !== 0 ? (
                forumPage.posts.results.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    toggleUpvote={toggleUpvote}
                    toggleDownvote={toggleDownvote}
                  />
                ))
              ) : (
                <div className={classes.noPosts}>
                  <PostAddIcon color="primary" fontSize="large" />
                  <Typography variant="h5" color="secondary">
                    No Posts Yet
                  </Typography>
                  <Typography variant="h6" color="secondary">
                    Be the first one to post in f/{forumName}!
                  </Typography>
                </div>
              )}
            </div>
            {'next' in forumPage.posts && (
              <LoadMoreButton
                handleLoadPosts={handleLoadPosts}
                loading={loadingMore}
              />
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default ForumPage;
