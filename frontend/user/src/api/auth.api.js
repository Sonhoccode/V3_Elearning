import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api/user/';
const LOGIN_URL = `${BASE_URL}token/`;
const REFRESH_URL = `${BASE_URL}token/refresh/`;
const NOTES_URL = `${BASE_URL}note/`;
const LOGOUT_URL = `${BASE_URL}logout/`;
const AUTH_URL = `${BASE_URL}authenticated/`;
const REGISTER_URL = `${BASE_URL}register/`;
// 🔥 OAuth Github
const GITHUB_URL = `${BASE_URL}oauth/github/login/`;
// 🔥 endpoint lấy user từ cookie (backend phải có /me/)
const ME_URL = `${BASE_URL}me/`;

export const github_login = () => {
  // chuyển trình duyệt sang backend để bắt đầu OAuth
  window.location.href = GITHUB_URL;
};

export const get_me = async () => {
  const res = await axios.get(ME_URL, { withCredentials: true });
  return res.data; // {id, username, email, role}
};

export const login = async (username, password) => {
  const response = await axios.post(
    LOGIN_URL,
    { username, password },
    { withCredentials: true }
  );

  // ✅ backend của bạn trả { success: true, user: {...role...} }
  return response.data; 
};

export const refresh_token = async () => {
  try {
    await axios.post(REFRESH_URL, {}, { withCredentials: true });
    return true;
  } catch (error) {
    console.error("refresh failed:", error);
    return false;
  }
};

const call_refresh = async (error, func) => {
  if (error.response && error.response.status === 401) {
    const tokenRefresh = await refresh_token();
    if (tokenRefresh) {
      const retryResponse = await func();
      return retryResponse.data;
    }
  }
  return false;
};

export const get_notes = async () => {
  try {
    const response = await axios.get(NOTES_URL, { withCredentials: true });
    return response.data;
  } catch (error) {
    return call_refresh(error, () => axios.get(NOTES_URL, { withCredentials: true }));
  }
};

export const logout = async () => {
  try {
    await axios.post(LOGOUT_URL, {}, { withCredentials: true });
    return true;
  } catch (error) {
    console.error("Logout failed:", error);
    return false;
  }
};

export const is_authenticated = async () => {
  try {
    await axios.post(AUTH_URL, {}, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
};

export const register = async (username, email, password, role = "student") => {
  const response = await axios.post(
    REGISTER_URL,
    { username, email, password, role },
    { withCredentials: true }
  );
  return response.data;
};