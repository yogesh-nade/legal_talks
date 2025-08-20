require('dotenv').config();
const path = require('path');

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;
const SECRET = process.env.SECRET;

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const POST_IMAGE_DIR = path.join(UPLOAD_DIR, 'posts');

module.exports = {
  PORT,
  MONGODB_URI,
  SECRET,
  UPLOAD_DIR,
  AVATAR_DIR,
  POST_IMAGE_DIR,
};
