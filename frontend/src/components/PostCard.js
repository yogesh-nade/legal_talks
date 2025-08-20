import React from 'react';

const PostCard = ({ post, toggleUpvote, toggleDownvote }) => {
  return (
    <div>
      {/* Placeholder for PostCard component */}
      <h3>{post?.title || 'Post Title'}</h3>
      <p>Post content will be displayed here</p>
    </div>
  );
};

export default PostCard;
