import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSubscribe } from '../reducers/forumReducer';
import { notify } from '../reducers/notificationReducer';
import ForumFormModal from './ForumFormModal';
import LoadingSpinner from './LoadingSpinner';
import getErrorMsg from '../utils/getErrorMsg';
import storageService from '../utils/localStorage';

import {
  Paper,
  Typography,
  useMediaQuery,
  Link,
  Button,
} from '@material-ui/core';
import { useForumPanelStyles } from '../styles/muiStyles';
import { useTheme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import CheckIcon from '@material-ui/icons/Check';

const TopForumsPanel = () => {
  const { forums, user } = useSelector((state) => state);
  const dispatch = useDispatch();
  const classes = useForumPanelStyles();
  const theme = useTheme();
  const isNotDesktop = useMediaQuery(theme.breakpoints.down('md'));

  if (isNotDesktop) {
    return null;
  }

  const loggedUser = storageService.loadUser() || user;

  const loadingForums = !forums || !forums.topForums;

  const isSubscribed = (subscribedBy, user) => {
    return subscribedBy.includes(user.id);
  };

  const handleJoinForum = async (id, subscribedBy, forumName) => {
    try {
      let updatedSubscribedBy;

      if (subscribedBy.includes(user.id)) {
        updatedSubscribedBy = subscribedBy.filter((s) => s !== user.id);
      } else {
        updatedSubscribedBy = [...subscribedBy, user.id];
      }
      dispatch(toggleSubscribe(id, updatedSubscribedBy));

      let message = subscribedBy.includes(user.id)
        ? `Left legal community f/${forumName}`
        : `Joined legal community f/${forumName}!`;
      dispatch(notify(message, 'success'));
    } catch (err) {
      dispatch(notify(getErrorMsg(err), 'error'));
    }
  };

  return (
    <Paper variant="outlined" className={classes.mainPaper}>
      <Paper variant="outlined" className={classes.listPaper}>
        <Typography variant="h5" color="secondary" className={classes.title}>
          Top Legal Communities
        </Typography>
        {loadingForums ? (
          <LoadingSpinner text="Fetching forums data..." />
        ) : (
          forums.topForums.map((s, i) => (
            <div key={s.id} className={classes.listWrapper}>
              <Typography variant="body2" className={classes.listItem}>
                {`${i + 1}. `}
                <Link
                  component={RouterLink}
                  to={`/f/${s.forumName}`}
                  color="primary"
                >
                  f/{s.forumName}
                </Link>
                {` - ${s.subscriberCount} members `}
              </Typography>
              {loggedUser && (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={
                    isSubscribed(s.subscribedBy, user) ? (
                      <CheckIcon />
                    ) : (
                      <AddIcon />
                    )
                  }
                  onClick={() =>
                    handleJoinForum(s.id, s.subscribedBy, s.forumName)
                  }
                >
                  {isSubscribed(s.subscribedBy, user) ? 'Joined' : 'Join'}
                </Button>
              )}
            </div>
          ))
        )}
      </Paper>
      {loggedUser && <ForumFormModal />}
    </Paper>
  );
};

export default TopForumsPanel;
