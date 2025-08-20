const Post = require('../models/post');
const Forum = require('../models/forum');
const User = require('../models/user');
const postTypeValidator = require('../utils/postTypeValidator');
const { POST_IMAGE_DIR } = require('../utils/config');
const path = require('path');
const fs = require('fs');
const paginateResults = require('../utils/paginateResults');

const getPosts = async (req, res) => {
  const page = Number(req.query.page);
  const limit = Number(req.query.limit);
  const sortBy = req.query.sortby;

  let sortQuery;
  switch (sortBy) {
    case 'new':
      sortQuery = { createdAt: -1 };
      break;
    case 'top':
      sortQuery = { pointsCount: -1 };
      break;
    case 'best':
      sortQuery = { voteRatio: -1 };
      break;
    case 'hot':
      sortQuery = { hotAlgo: -1 };
      break;
    case 'controversial':
      sortQuery = { controversialAlgo: -1 };
      break;
    case 'old':
      sortQuery = { createdAt: 1 };
      break;
    default:
      sortQuery = {};
  }

  const postsCount = await Post.countDocuments();
  const paginated = paginateResults(page, limit, postsCount);
  const allPosts = await Post.find({})
    .sort(sortQuery)
    .select('-comments')
    .limit(limit)
    .skip(paginated.startIndex)
    .populate('author', 'username')
    .populate('forum', 'forumName');

  const paginatedPosts = {
    previous: paginated.results.previous,
    results: allPosts,
    next: paginated.results.next,
  };

  res.status(200).json(paginatedPosts);
};

const getSubscribedPosts = async (req, res) => {
  const page = Number(req.query.page);
  const limit = Number(req.query.limit);

  const user = await User.findById(req.user);
  if (!user) {
    return res
      .status(404)
      .send({ message: 'User does not exist in database.' });
  }

  const subscribedForums = await Forum.find({
    _id: { $in: user.subscribedForums },
  });

  const postsCount = subscribedForums
    .map((s) => s.posts.length)
    .reduce((sum, s) => s + sum, 0);

  const paginated = paginateResults(page, limit, postsCount);
  const subscribedPosts = await Post.find({
    forum: { $in: user.subscribedForums },
  })
    .sort({ hotAlgo: -1 })
    .select('-comments')
    .limit(limit)
    .skip(paginated.startIndex)
    .populate('author', 'username')
    .populate('forum', 'forumName');

  const paginatedPosts = {
    previous: paginated.results.previous,
    results: subscribedPosts,
    next: paginated.results.next,
  };

  res.status(200).json(paginatedPosts);
};

const getSearchedPosts = async (req, res) => {
  const page = Number(req.query.page);
  const limit = Number(req.query.limit);
  const query = req.query.query;

  const findQuery = {
    $or: [
      {
        title: {
          $regex: query,
          $options: 'i',
        },
      },
      {
        textSubmission: {
          $regex: query,
          $options: 'i',
        },
      },
    ],
  };

  const postsCount = await Post.find(findQuery).countDocuments();
  const paginated = paginateResults(page, limit, postsCount);
  const searchedPosts = await Post.find(findQuery)
    .sort({ hotAlgo: -1 })
    .select('-comments')
    .limit(limit)
    .skip(paginated.startIndex)
    .populate('author', 'username')
    .populate('forum', 'forumName');

  const paginatedPosts = {
    previous: paginated.results.previous,
    results: searchedPosts,
    next: paginated.results.next,
  };

  res.status(200).json(paginatedPosts);
};

const getPostAndComments = async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id);
  if (!post) {
    return res
      .status(404)
      .send({ message: `Post with ID: '${id}' does not exist in database.` });
  }

  const populatedPost = await post
    .populate('author', 'username')
    .populate('forum', 'forumName')
    .populate('comments.commentedBy', 'username')
    .populate('comments.replies.repliedBy', 'username')
    .execPopulate();

  res.status(200).json(populatedPost);
};

const createNewPost = async (req, res) => {
  const {
    title,
    forum,
    postType,
    textSubmission,
    linkSubmission,
    imageSubmission,
  } = req.body;

  const validatedFields = postTypeValidator(
    postType,
    textSubmission,
    linkSubmission,
    imageSubmission
  );

  const author = await User.findById(req.user);
  const targetForum = await Forum.findById(forum);

  if (!author) {
    return res
      .status(404)
      .send({ message: 'User does not exist in database.' });
  }

  if (!targetForum) {
    return res.status(404).send({
      message: `Forum with ID: '${forum}' does not exist in database.`,
    });
  }

  const newPost = new Post({
    title,
    forum,
    author: author._id,
    upvotedBy: [author._id],
    pointsCount: 1,
    ...validatedFields,
  });

  if (postType === 'Image') {
    try {
      const base64Data = imageSubmission.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const fileName = `post-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
      const filePath = path.join(POST_IMAGE_DIR, fileName);
      
      fs.writeFileSync(filePath, buffer);
      
      newPost.imageSubmission = {
        imageLink: `/uploads/posts/${fileName}`,
        imageId: fileName,
      };
    } catch (error) {
      return res.status(500).send({ message: 'Error saving image: ' + error.message });
    }
  }

  const savedPost = await newPost.save();

  targetForum.posts = targetForum.posts.concat(savedPost._id);
  await targetForum.save();

  author.posts = author.posts.concat(savedPost._id);
  author.karmaPoints.postKarma++;
  await author.save();

  const populatedPost = await savedPost
    .populate('author', 'username')
    .populate('forum', 'forumName')
    .execPopulate();

  res.status(201).json(populatedPost);
};

const updatePost = async (req, res) => {
  const { id } = req.params;

  const { textSubmission, linkSubmission, imageSubmission } = req.body;

  const post = await Post.findById(id);
  const author = await User.findById(req.user);

  if (!post) {
    return res.status(404).send({
      message: `Post with ID: ${id} does not exist in database.`,
    });
  }

  if (!author) {
    return res
      .status(404)
      .send({ message: 'User does not exist in database.' });
  }

  if (post.author.toString() !== author._id.toString()) {
    return res.status(401).send({ message: 'Access is denied.' });
  }

  const validatedFields = postTypeValidator(
    post.postType,
    textSubmission,
    linkSubmission,
    imageSubmission
  );

  switch (post.postType) {
    case 'Text':
      post.textSubmission = validatedFields.textSubmission;
      break;

    case 'Link':
      post.linkSubmission = validatedFields.linkSubmission;
      break;

    case 'Image': {
      try {
        if (post.imageSubmission && post.imageSubmission.imageId) {
          const oldFilePath = path.join(POST_IMAGE_DIR, post.imageSubmission.imageId);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        const base64Data = imageSubmission.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const fileName = `post-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        const filePath = path.join(POST_IMAGE_DIR, fileName);
        
        fs.writeFileSync(filePath, buffer);
        
        post.imageSubmission = {
          imageLink: `/uploads/posts/${fileName}`,
          imageId: fileName,
        };
      } catch (error) {
        return res.status(500).send({ message: 'Error saving image: ' + error.message });
      }
      break;
    }

    default:
      return res.status(403).send({ message: 'Invalid post type.' });
  }

  post.updatedAt = Date.now();

  const savedPost = await post.save();
  const populatedPost = await savedPost
    .populate('author', 'username')
    .populate('forum', 'forumName')
    .populate('comments.commentedBy', 'username')
    .populate('comments.replies.repliedBy', 'username')
    .execPopulate();

  res.status(202).json(populatedPost);
};

const deletePost = async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id);
  const author = await User.findById(req.user);

  if (!post) {
    return res.status(404).send({
      message: `Post with ID: ${id} does not exist in database.`,
    });
  }

  if (!author) {
    return res
      .status(404)
      .send({ message: 'User does not exist in database.' });
  }

  if (post.author.toString() !== author._id.toString()) {
    return res.status(401).send({ message: 'Access is denied.' });
  }

  const forum = await Forum.findById(post.forum);

  if (!forum) {
    return res.status(404).send({
      message: `Forum with ID: '${forum._id}'  does not exist in database.`,
    });
  }

  await Post.findByIdAndDelete(id);

  forum.posts = forum.posts.filter((p) => p.toString() !== id);
  await forum.save();

  author.posts = author.posts.filter((p) => p.toString() !== id);
  await author.save();

  res.status(204).end();
};

module.exports = {
  getPosts,
  getSubscribedPosts,
  getSearchedPosts,
  getPostAndComments,
  createNewPost,
  updatePost,
  deletePost,
};
