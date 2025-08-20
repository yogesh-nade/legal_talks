const User = require('../models/user');
const Post = require('../models/post');
const path = require('path');
const fs = require('fs');
const { AVATAR_DIR } = require('../utils/config');
const paginateResults = require('../utils/paginateResults');

const getUser = async (req, res) => {
  const { username } = req.params;
  const page = Number(req.query.page);
  const limit = Number(req.query.limit);

  const user = await User.findOne({
    username: { $regex: new RegExp('^' + username + '$', 'i') },
  });

  if (!user) {
    return res
      .status(404)
      .send({ message: `Username '${username}' does not exist on server.` });
  }

  const postsCount = await Post.find({ author: user.id }).countDocuments();
  const paginated = paginateResults(page, limit, postsCount);
  
  const userPosts = await Post.find({ author: user.id })
    .sort({ createdAt: -1 })
    .select('-comments')
    .limit(limit)
    .skip(paginated.startIndex)
    .populate('author', 'username')
    .populate('forum', 'forumName');

  const paginatedPosts = {
    previous: paginated.results.previous,
    results: userPosts,
    next: paginated.results.next,
  };

  res.status(200).json({ userDetails: user, posts: paginatedPosts });
};

const setUserAvatar = async (req, res) => {
  const { avatarImage } = req.body;

  if (!avatarImage) {
    return res
      .status(400)
      .send({ message: 'Image data needed for setting avatar.' });
  }

  const user = await User.findById(req.user);

  if (!user) {
    return res
      .status(404)
      .send({ message: 'User does not exist in database.' });
  }

  try {
    const base64Data = avatarImage.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const fileName = `avatar-${user._id}-${Date.now()}.jpg`;
    const filePath = path.join(AVATAR_DIR, fileName);
    
    if (user.avatar && user.avatar.exists && user.avatar.imageId !== 'null') {
      const oldFilePath = path.join(AVATAR_DIR, user.avatar.imageId);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    fs.writeFileSync(filePath, buffer);
    
    user.avatar = {
      exists: true,
      imageLink: `/uploads/avatars/${fileName}`,
      imageId: fileName,
    };

    const savedUser = await user.save();
    res.status(201).json({ avatar: savedUser.avatar });
  } catch (error) {
    res.status(500).send({ message: 'Error saving avatar: ' + error.message });
  }
};

const removeUserAvatar = async (req, res) => {
  const user = await User.findById(req.user);

  if (!user) {
    return res
      .status(404)
      .send({ message: 'User does not exist in database.' });
  }

  if (user.avatar && user.avatar.exists && user.avatar.imageId !== 'null') {
    const filePath = path.join(AVATAR_DIR, user.avatar.imageId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  user.avatar = {
    exists: false,
    imageLink: 'null',
    imageId: 'null',
  };

  await user.save();
  res.status(204).end();
};

module.exports = { getUser, setUserAvatar, removeUserAvatar };
