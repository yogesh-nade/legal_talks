const express = require('express');
const { auth } = require('../utils/middleware');
const {
  getForums,
  getForumPosts,
  getTopForums,
  createNewForum,
  editForumDescription,
  subscribeToForum,
} = require('../controllers/forum');

const router = express.Router();

router.get('/', getForums);
router.get('/f/:forumName', getForumPosts);
router.get('/top10', getTopForums);
router.post('/', auth, createNewForum);
router.patch('/:id', auth, editForumDescription);
router.post('/:id/subscribe', auth, subscribeToForum);

module.exports = router;
