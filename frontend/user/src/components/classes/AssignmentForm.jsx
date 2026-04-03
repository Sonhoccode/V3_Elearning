const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createEmptyQuestion = () => ({
  id: makeId(),
  title: "",
  answers: [{ id: makeId(), text: "" }],
  correctAnswerId: "",
});

export default function AssignmentForm({
  value,
  onChange,
  onSubmit,
  submitting,
  error,
  submitLabel,
  onCancel,
  title,
}) {
  const update = (patch) => {
    if (onChange) onChange({ ...value, ...patch });
  };

  const updateQuizQuestion = (questionId, patch) => {
    const questions = value.quiz.questions.map((q) =>
      q.id === questionId ? { ...q, ...patch } : q
    );
    update({ quiz: { ...value.quiz, questions } });
  };

  const addQuestion = () => {
    update({
      quiz: {
        ...value.quiz,
        questions: [...value.quiz.questions, createEmptyQuestion()],
      },
    });
  };

  const removeQuestion = (questionId) => {
    const questions = value.quiz.questions.filter((q) => q.id !== questionId);
    update({ quiz: { ...value.quiz, questions } });
  };

  const addAnswer = (questionId) => {
    const questions = value.quiz.questions.map((q) => {
      if (q.id !== questionId) return q;
      return {
        ...q,
        answers: [...q.answers, { id: makeId(), text: "" }],
      };
    });
    update({ quiz: { ...value.quiz, questions } });
  };

  const removeAnswer = (questionId, answerId) => {
    const questions = value.quiz.questions.map((q) => {
      if (q.id !== questionId) return q;
      const answers = q.answers.filter((a) => a.id !== answerId);
      const correctAnswerId =
        q.correctAnswerId === answerId ? "" : q.correctAnswerId;
      return { ...q, answers, correctAnswerId };
    });
    update({ quiz: { ...value.quiz, questions } });
  };

  const updateAnswer = (questionId, answerId, text) => {
    const questions = value.quiz.questions.map((q) => {
      if (q.id !== questionId) return q;
      const answers = q.answers.map((a) =>
        a.id === answerId ? { ...a, text } : a
      );
      return { ...q, answers };
    });
    update({ quiz: { ...value.quiz, questions } });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (onSubmit) onSubmit();
      }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900">
        {title || "Tạo bài tập mới"}
      </h3>
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="mt-4 grid gap-3">
        <input
          type="text"
          value={value.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Tiêu đề bài tập"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={value.type}
            onChange={(e) => update({ type: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="QUIZ">QUIZ</option>
            <option value="CODE">CODE</option>
          </select>
          <input
            type="datetime-local"
            value={value.deadline}
            onChange={(e) => update({ deadline: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {value.type === "QUIZ" && (
          <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800">
                Câu hỏi
              </h4>
              <button
                type="button"
                onClick={addQuestion}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
              >
                Thêm câu hỏi
              </button>
            </div>

            {value.quiz.questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Câu {index + 1}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="text-xs text-red-500"
                  >
                    Xóa
                  </button>
                </div>
                <input
                  type="text"
                  value={question.title}
                  onChange={(e) =>
                    updateQuizQuestion(question.id, { title: e.target.value })
                  }
                  placeholder="Nội dung câu hỏi"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <div className="mt-3 space-y-2">
                  {question.answers.map((answer, answerIndex) => (
                    <div
                      key={answer.id}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctAnswerId === answer.id}
                        onChange={() =>
                          updateQuizQuestion(question.id, {
                            correctAnswerId: answer.id,
                          })
                        }
                        className="h-4 w-4 accent-teal-600"
                      />
                      <input
                        type="text"
                        value={answer.text}
                        onChange={(e) =>
                          updateAnswer(question.id, answer.id, e.target.value)
                        }
                        placeholder={`Đáp án ${answerIndex + 1}`}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeAnswer(question.id, answer.id)}
                        className="text-xs text-red-500"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addAnswer(question.id)}
                    className="text-xs font-semibold text-teal-600"
                  >
                    + Thêm đáp án
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {value.type === "CODE" && (
          <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <input
              type="text"
              value={value.code.language}
              onChange={(e) =>
                update({ code: { ...value.code, language: e.target.value } })
              }
              placeholder="Ngôn ngữ (vd: javascript, python, java)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <textarea
              value={value.code.prompt}
              onChange={(e) =>
                update({ code: { ...value.code, prompt: e.target.value } })
              }
              rows={3}
              placeholder="Mô tả đề bài"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <textarea
              value={value.code.starter_code}
              onChange={(e) =>
                update({
                  code: { ...value.code, starter_code: e.target.value },
                })
              }
              rows={5}
              placeholder="Starter code"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {submitting ? "Đang xử lý..." : submitLabel || "Tạo bài tập"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Hủy
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
