import api from "./client";

export const sendChatMessage = async ({
  conversationId,
  sessionId,
  message,
}) => {
  const payload = { message };
  if (conversationId) payload.conversation_id = conversationId;
  if (sessionId) payload.session_id = sessionId;
  const res = await api.post("/chat/", payload);
  return res.data;
};

export const fetchChatHistory = async (conversationId) => {
  const params = conversationId ? { conversation_id: conversationId } : {};
  const res = await api.get("/chat/", { params });
  return res.data;
};
