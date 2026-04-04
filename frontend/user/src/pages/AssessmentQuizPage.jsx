import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/useAuth.jsx";
import {
  fetchAssessmentResult,
  generateAssessmentQuiz,
  submitAssessmentResult,
} from "../api/ai.api.js";

import { useTranslation } from "react-i18next";

const initialConfig = {
  topic: "HTML/CSS/JavaScript cơ bản",
  numQuestions: 10,
  choicesPerQuestion: 4,
};

export default function AssessmentQuizPage() {
  const { t } = useTranslation("assessment");
  const { user, loading } = useAuth();
  const [config, setConfig] = useState(initialConfig);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [state, setState] = useState({
    loading: false,
    error: "",
  });

  const isAuthenticated = Boolean(user);

  const totalQuestions = quiz?.questions?.length || 0;
  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAssessmentResult()
      .then((data) => setCurrentResult(data))
      .catch(() => null);
  }, [isAuthenticated]);

  const handleGenerate = async () => {
    if (!isAuthenticated) return;
    setState({ loading: true, error: "" });
    setQuiz(null);
    setAnswers({});
    setResult(null);
    try {
      const data = await generateAssessmentQuiz({
        topic: config.topic,
        numQuestions: config.numQuestions,
        choicesPerQuestion: config.choicesPerQuestion,
      });
      setQuiz(data);
    } catch (err) {
      setState({
        loading: false,
        error: err?.response?.data?.error || t("generate_error", "Không thể tạo bài test."),
      });
      return;
    }
    setState({ loading: false, error: "" });
  };

  const handleSubmit = async () => {
    if (!quiz?.questions?.length) return;
    const correctCount = quiz.questions.reduce((count, q) => {
      const selected = answers[q.id];
      if (selected && selected === q.correctAnswerId) {
        return count + 1;
      }
      return count;
    }, 0);
    const score = Math.round((correctCount / quiz.questions.length) * 100);

    setState({ loading: true, error: "" });
    try {
      const saved = await submitAssessmentResult(score);
      setResult({
        score,
        correctCount,
        total: quiz.questions.length,
        detail: saved,
      });
      setCurrentResult(saved);
    } catch (err) {
      setState({
        loading: false,
        error: err?.response?.data?.detail || t("save_error", "Không thể lưu kết quả."),
      });
      return;
    }
    setState({ loading: false, error: "" });
  };

  if (loading) {
    return <div className="mt-20 text-center">{t("loading", "Loading...")}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">
            {t("page_title", "Bài Test Đánh Giá Năng Lực")}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {t("page_desc", "AI sẽ tự tạo bộ câu hỏi phù hợp để đánh giá trình độ hiện tại của bạn.")}
          </p>
          {!isAuthenticated && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {t("login_required", "Vui lòng đăng nhập để làm bài test.")}
            </div>
          )}
          {currentResult && (
            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
              <div className="font-semibold">{t("latest_result", "Kết quả gần nhất")}</div>
              <div className="mt-1">
                {t("score", "Điểm")}: {currentResult.score} · {t("level", "Trình độ")}: {currentResult.level}
              </div>
            </div>
          )}
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("setup", "Thiết lập đề thi")}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">
                {t("topic", "Chủ đề")}
              </label>
              <input
                type="text"
                value={config.topic}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, topic: event.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                {t("num_questions", "Số câu hỏi")}
              </label>
              <input
                type="number"
                min={5}
                max={20}
                value={config.numQuestions}
                onChange={(event) =>
                  setConfig((prev) => ({
                    ...prev,
                    numQuestions: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                {t("choices_per_question", "Số đáp án mỗi câu")}
              </label>
              <input
                type="number"
                min={2}
                max={6}
                value={config.choicesPerQuestion}
                onChange={(event) =>
                  setConfig((prev) => ({
                    ...prev,
                    choicesPerQuestion: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          {state.error && (
            <div className="mt-4 text-sm text-red-600">{state.error}</div>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!isAuthenticated || state.loading}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {state.loading ? t("generating", "Đang tạo...") : t("generate_btn", "Tạo đề test")}
            </button>
            {quiz && (
              <div className="text-sm text-slate-500">
                {t("status_created", "Đã tạo {{totalQuestions}} câu · Đã trả lời {{answeredCount}}", { totalQuestions, answeredCount })}
              </div>
            )}
          </div>
        </section>

        {quiz && (
          <section className="space-y-4">
            {quiz.questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="text-sm font-semibold text-slate-800">
                  {index + 1}. {question.title}
                </div>
                <div className="mt-4 grid gap-2">
                  {question.answers.map((answer) => {
                    const selected = answers[question.id] === answer.id;
                    const isCorrect =
                      result && answer.id === question.correctAnswerId;
                    const isWrong =
                      result &&
                      selected &&
                      answer.id !== question.correctAnswerId;
                    const base =
                      "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm";
                    const highlight = isCorrect
                      ? "border-green-200 bg-green-50 text-green-700"
                      : isWrong
                      ? "border-red-200 bg-red-50 text-red-700"
                      : selected
                      ? "border-teal-200 bg-teal-50 text-teal-700"
                      : "border-slate-200 bg-white text-slate-700";

                    return (
                      <label
                        key={answer.id}
                        className={`${base} ${highlight} ${
                          result ? "cursor-default" : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={answer.id}
                          checked={selected}
                          disabled={Boolean(result)}
                          onChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: answer.id,
                            }))
                          }
                          className="h-4 w-4"
                        />
                        <span>{answer.text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={state.loading || answeredCount === 0 || result}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {state.loading ? t("grading", "Đang chấm...") : t("submit_btn", "Nộp bài")}
              </button>
              {result && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-700">
                  {t("result_summary", "Đúng {{correctCount}}/{{total}} · Điểm {{score}}", { correctCount: result.correctCount, total: result.total, score: result.score })}
                </div>
              )}
            </div>
          </section>
        )}

        {result?.detail && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              {t("eval_title", "Đánh giá năng lực")}
            </h3>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div>
                <span className="font-semibold">{t("eval_level", "Trình độ:")}</span>{" "}
                {result.detail.level}
              </div>
              <div>
                <span className="font-semibold">{t("eval_strengths", "Điểm mạnh:")}</span>{" "}
                {result.detail.strengths}
              </div>
              <div>
                <span className="font-semibold">{t("eval_weaknesses", "Điểm yếu:")}</span>{" "}
                {result.detail.weaknesses}
              </div>
              <div>
                <span className="font-semibold">{t("eval_paths", "Gợi ý lộ trình:")}</span>{" "}
                {result.detail.recommended_paths}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
