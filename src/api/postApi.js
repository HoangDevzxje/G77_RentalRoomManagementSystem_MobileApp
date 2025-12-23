import baseApi from "./baseApi";

export const getPosts = async (params = {}) => {
  const res = await baseApi.get("/posts", { params });
  return res.data;
};

export const getPostById = async (id) => {
  const res = await baseApi.get(`/posts/${id}`);
  return res.data.data || res.data;
};

export const getRoomsByPost = async (postId) => {
  const post = await getPostById(postId);
  return post.rooms || [];
};

export const getRoomById = async (roomId) => {
  const res = await baseApi.get(`/posts/rooms/${roomId}`);
  return res.data.data;
};

export const getPostByRoomId = async (roomId) => {
  const res = await baseApi.get(`/posts/rooms/${roomId}`);
  return res.data.data;
};
