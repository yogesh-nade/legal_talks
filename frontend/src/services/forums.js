import axios from 'axios';
import backendUrl from '../backendUrl';
import { token } from './auth';

const baseUrl = `${backendUrl}/api/forums`;

const setConfig = () => {
  return {
    headers: { 'x-auth-token': token },
  };
};

const getAllForums = async () => {
  const response = await axios.get(baseUrl);
  return response.data;
};

const getForum = async (forumName, sortBy, limit, page) => {
  const response = await axios.get(
    `${baseUrl}/f/${forumName}/?sortby=${sortBy}&limit=${limit}&page=${page}`
  );
  return response.data;
};

const createForum = async (forumObj) => {
  const response = await axios.post(`${baseUrl}`, forumObj, setConfig());
  return response.data;
};

const subscribeForum = async (id) => {
  const response = await axios.post(
    `${baseUrl}/${id}/subscribe`,
    null,
    setConfig()
  );
  return response.data;
};

const updateDescription = async (id, descriptionObj) => {
  const response = await axios.patch(
    `${baseUrl}/${id}`,
    descriptionObj,
    setConfig()
  );
  return response.data;
};

const getTopForums = async () => {
  const response = await axios.get(`${baseUrl}/top10`);
  return response.data;
};

const forumService = {
  getAllForums,
  createForum,
  getForum,
  subscribeForum,
  updateDescription,
  getTopForums,
};

export default forumService;
