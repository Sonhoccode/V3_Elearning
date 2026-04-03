import { useEffect, useMemo, useState } from "react";

export default function QuizAssignmentForm({ assignment, onSubmit, submitting }) {
  const questions = useMemo(() => {
    if (!assignment || !assignment.content) return [];
    if (Array.isArray(assignment.content.questions)) {
      return assignment.content.questions;
    }
    return [];
  }, [assignment]);

  const [answers, setAnswers] = useState({});

  useEffect(() => {
    setAnswers({});
  }, [assignment?.id]);

  const handleChange = (questionKey, value) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
  };

  const handleSubmit = () => {
    const payload = questions.map((question, index) => {
      const questionKey = question?.id ?? index;
      return answers[questionKey] ?? null;
    });
    if (onSubmit) onSubmit(payload);
  };

  if (!questions.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Chưa có dữ liệu câu hỏi cho bài quiz này.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold text-slate-800">Quiz</h4>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {submitting ? "Đang nộp..." : "Nộp bài"}
        </button>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const questionKey = question?.id ?? index;
          const title = question?.title || question?.question || `Câu ${index + 1}`;
          const options =
            question?.answers ||
            question?.options ||
            [];

          return (
            <div key={questionKey} className="rounded-xl border border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-800">{title}</p>
              <div className="mt-3 grid gap-2">
                {options.map((option, optionIndex) => {
                  const value = option?.id ?? option?.value ?? optionIndex;
                  const label =
                    typeof option === "string"
                      ? option
                      : option?.text || option?.label || `Đáp án ${optionIndex + 1}`;
                  return (
                    <label
                      key={`${questionKey}-${value}`}
                      className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="radio"
                        name={`q-${questionKey}`}
                        value={value}
                        checked={answers[questionKey] === value}
                        onChange={() => handleChange(questionKey, value)}
                        className="h-4 w-4 accent-teal-600"
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
