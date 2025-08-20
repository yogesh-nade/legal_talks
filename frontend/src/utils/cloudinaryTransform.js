// Since we're using local storage instead of Cloudinary, 
// we'll return the original image links without transformation
const getEditedThumbnail = (imageLink) => {
  // For local images, just return the original link
  // In a real app, you might want to implement image resizing on the server
  return imageLink;
};

export const getCircularAvatar = (imageLink) => {
  // For local images, just return the original link
  // The client-side CSS will handle the circular styling
  return imageLink;
};

export default getEditedThumbnail;
