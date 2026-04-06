import api from "./client";

export const getTeacherClasses = async () => {
  const res = await api.get("/classes/");
  return Array.isArray(res.data) ? res.data : [];
};

export const createClass = async ({ name }) => {
  const res = await api.post("/classes/", { name });
  return res.data;
};

export const joinClass = async ({ join_code }) => {
  const res = await api.post("/classes/join/", { join_code });
  return res.data;
};

export const getMyClasses = async () => {
  const res = await api.get("/classes/my-classes/");
  return Array.isArray(res.data) ? res.data : [];
};

export const getClassAssignments = async (classId) => {
  const res = await api.get(`/classes/${classId}/assignments/`);
  return Array.isArray(res.data) ? res.data : [];
};

export const getClassStudents = async (classId) => {
  const res = await api.get(`/classes/${classId}/students/`);
  return Array.isArray(res.data) ? res.data : [];
};

export const createAssignment = async (classId, payload) => {
  const res = await api.post(`/classes/${classId}/assignments/`, payload);
  return res.data;
};

export const getAssignmentSubmissions = async (assignmentId) => {
  const res = await api.get(`/assignments/${assignmentId}/submissions/`);
  return Array.isArray(res.data) ? res.data : [];
};

export const deleteAssignment = async (assignmentId) => {
  const res = await api.delete(`/assignments/${assignmentId}/`);
  return res.data;
};

export const getAssignmentDetail = async (assignmentId) => {
  const res = await api.get(`/assignments/${assignmentId}/`);
  return res.data;
};

export const updateAssignment = async (assignmentId, payload) => {
  const res = await api.patch(`/assignments/${assignmentId}/`, payload);
  return res.data;
};

export const submitAssignment = async (assignmentId, submitted_content) => {
  const res = await api.post(`/assignments/${assignmentId}/submit/`, {
    submitted_content,
  });
  return res.data;
};

export const getMySubmission = async (assignmentId) => {
  const res = await api.get(`/assignments/${assignmentId}/my-submission/`);
  return res.data;
};
