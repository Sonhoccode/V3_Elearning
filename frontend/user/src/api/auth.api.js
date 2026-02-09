import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const LOGIN_URL = `${BASE_URL}/api/user/token/`;
const REFRESH_URL = `${BASE_URL}/api/user/token/refresh/`;
const LOGOUT_URL = `${BASE_URL}/api/user/logout/`;
const AUTH_URL = `${BASE_URL}/api/user/authenticated/`;
const REGISTER_URL = `${BASE_URL}/api/user/register/`;
const OTP_URL = `${BASE_URL}/api/user/verify_otp/`;

const GITHUB_URL = `${BASE_URL}/api/user/oauth/github/login/`;
const GOOGLE_URL = `${BASE_URL}/api/user/oauth/google/login/`;

const ME_URL = `${BASE_URL}/api/user/me/`;
const UPDATE_ME_URL = `${BASE_URL}/api/user/me/update/`;



export const github_login = () => {
  // chuyển trình duyệt sang backend để bắt đầu OAuth
  window.location.href = GITHUB_URL;
};

export const google_login = () => {
  // chuyển trình duyệt sang backend để bắt đầu OAuth
  window.location.href = GOOGLE_URL;
}

export const get_me = async () => {
  const res = await axios.get(ME_URL, { withCredentials: true });
  return res.data; // {id, username, email, role}
};

export const login = async (email, password) => {
  const response = await axios.post(
    LOGIN_URL,
    { email, password },
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

export const verify_otp = async (email, otp) => {
  const response = await axios.post(
    OTP_URL,
    { email, otp },
    { withCredentials: true }
  );
  return response.data;
};

export const update_me = async (payload) => {
  const res = await axios.put(
    UPDATE_ME_URL,
    payload,
    { withCredentials: true }
  );
  return res.data;
};