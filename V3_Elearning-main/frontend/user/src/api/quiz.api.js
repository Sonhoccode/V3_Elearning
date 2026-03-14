import api from "./client";

export const getQuizzes = () => {
    return api.get("/quiz/");
};

export const getQuizDetail = (id) => {
    return api.get(`/quiz/${id}/`);
};
