import baseApi from "./baseApi";

export const getPosts = async (params = {}) => {
  const res = await baseApi.get("/posts", { params });
  return res.data;
};

export const getPostById = async (id) => {
  const res = await baseApi.get(`/posts/${id}`);
  return res.data.data;
};

export const getPostByRoomId = async (id) => {
  const res = await baseApi.get(`/posts/rooms/${id}`);
  return res.data.data;
};
