import api from "./client";

export const generateAssessmentQuiz = async ({
  topic,
  numQuestions = 10,
  choicesPerQuestion = 4,
}) => {
  const res = await api.post("/ai/quiz/generate/", {
    topic,
    num_questions: numQuestions,
    choices_per_question: choicesPerQuestion,
  });
  return res.data;
};

export const submitAssessmentResult = async (score) => {
  const res = await api.post("/user/test-result/", { score });
  return res.data;
};

export const fetchAssessmentResult = async () => {
  const res = await api.get("/user/test-result/");
  return res.data;
};
