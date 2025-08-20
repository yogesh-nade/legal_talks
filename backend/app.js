const express = require('express');
require('express-async-errors');
const cors = require('cors');
const path = require('path');
const middleware = require('./utils/middleware');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const forumRoutes = require('./routes/forum');
const userRoutes = require('./routes/user');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/users', userRoutes);

app.use(middleware.unknownEndpointHandler);
app.use(middleware.errorHandler);

module.exports = app;
