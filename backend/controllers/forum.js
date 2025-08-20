const Forum = require('../models/forum');
const User = require('../models/user');
const Post = require('../models/post');

const paginateResults = require('../utils/paginateResults');

const getForums = async (_req, res) => {
  const allForums = await Forum.find({}).select('id forumName');
  res.status(200).json(allForums);
};

const getForumPosts = async (req, res) => {
  const { forumName } = req.params;
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

  const forum = await Forum.findOne({
    forumName: { $regex: new RegExp('^' + forumName + '$', 'i') },
  }).populate('admin', 'username');

  if (!forum) {
    return res.status(404).send({
      message: `Forum '${forumName}' does not exist on server.`,
    });
  }

  const postsCount = await Post.find({
    forum: forum.id,
  }).countDocuments();

  const paginated = paginateResults(page, limit, postsCount);
  
  const forumPosts = await Post.find({ forum: forum.id })
    .sort(sortQuery)
    .select('-comments')
    .limit(limit)
    .skip(paginated.startIndex)
    .populate('author', 'username')
    .populate('forum', 'forumName');

  const paginatedPosts = {
    previous: paginated.results.previous,
    results: forumPosts,
    next: paginated.results.next,
  };

  res.status(200).json({ forumDetails: forum, posts: paginatedPosts });
};

const getTopForums = async (_req, res) => {
  const top10Forums = await Forum.find({})
    .sort({ subscriberCount: -1 })
    .limit(10)
    .select('-description -posts -admin ');

  res.status(200).json(top10Forums);
};

const createNewForum = async (req, res) => {
  const { forumName, description } = req.body;

  const admin = await User.findById(req.user);
  if (!admin) {
    return res
      .status(404)
      .send({ message: 'User does not exist in database.' });
  }

  const existingForumName = await Forum.findOne({
    forumName: { $regex: new RegExp('^' + forumName + '$', 'i') },
  });

  if (existingForumName) {
    return res.status(403).send({
      message: `Forum having same name "${forumName}" already exists. Choose another name.`,
    });
  }

  const newForum = new Forum({
    forumName,
    description,
    admin: admin._id,
    subscribedBy: [admin._id],
    subscriberCount: 1,
  });

  const savedForum = await newForum.save();

  admin.subscribedForums = admin.subscribedForums.concat(savedForum._id);
  await admin.save();

  return res.status(201).json(savedForum);
};

const editForumDescription = async (req, res) => {
  const { description } = req.body;
  const { id } = req.params;

  if (!description) {
    return res
      .status(400)
      .send({ message: `Description body can't be empty.` });
  }

  const admin = await User.findById(req.user);
  const forum = await Forum.findById(id);

  if (!admin) {
    return res
      .status(404)
      .send({ message: 'User does not exist in database.' });
  }

  if (!forum) {
    return res.status(404).send({
      message: `Forum with ID: ${id} does not exist in database.`,
    });
  }

  if (forum.admin.toString() !== admin._id.toString()) {
    return res.status(401).send({ message: 'Access is denied.' });
  }

  forum.description = description;

  await forum.save();
  res.status(202).end();
};

const subscribeToForum = async (req, res) => {
  const { id } = req.params;

  const forum = await Forum.findById(id);
  const user = await User.findById(req.user);

  if (forum.subscribedBy.includes(user._id.toString())) {
    forum.subscribedBy = forum.subscribedBy.filter(
      (s) => s.toString() !== user._id.toString()
    );

    user.subscribedForums = user.subscribedForums.filter(
      (s) => s.toString() !== forum._id.toString()
    );
  } else {
    forum.subscribedBy = forum.subscribedBy.concat(user._id);
    user.subscribedForums = user.subscribedForums.concat(forum._id);
  }

  forum.subscriberCount = forum.subscribedBy.length;

  await forum.save();
  await user.save();

  res.status(201).end();
};

module.exports = {
  getForums,
  getForumPosts,
  getTopForums,
  createNewForum,
  editForumDescription,
  subscribeToForum,
};
