import api from "./client";

export const login = async (email, password) => {
  const response = await api.post("/user/token/", { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
    // Optional: If you have an endpoint to get user details
    // For now we might just decode token or rely on token presence
    // But typically: return api.get("/user/me/");
    return {}; 
};
