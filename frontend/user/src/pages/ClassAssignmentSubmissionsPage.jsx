import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/useAuth.jsx";
import {
  getAssignmentDetail,
  getAssignmentSubmissions,
  getClassStudents,
} from "../api/classes.api.js";

const buildAnswerList = (submittedContent) => {
  if (Array.isArray(submittedContent)) return submittedContent;
  if (submittedContent && Array.isArray(submittedContent.answers)) {
    return submittedContent.answers;
  }
  if (submittedContent && Array.isArray(submittedContent.selected)) {
    return submittedContent.selected;
  }
  return [];
};

const computeCorrectCount = (questions, selectedAnswers) => {
  if (!Array.isArray(questions)) return 0;
  let correct = 0;
  questions.forEach((question, index) => {
    const expected = question?.correctAnswerId;
    if (!expected) return;
    if (selectedAnswers[index] === expected) correct += 1;
  });
  return correct;
};

export default function ClassAssignmentSubmissionsPage() {
  const { id, assignmentId } = useParams();
  const [searchParams] = useSearchParams();
  const classId = Number(id);
  const assignmentKey = Number(assignmentId);
  const { user, loading } = useAuth();
  const { t } = useTranslation("classes");

  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [state, setState] = useState({
    loading: false,
    error: "",
  });
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const role = (user?.role || "").toLowerCase();
  const isTeacher = role === "teacher";

  useEffect(() => {
    if (!isTeacher || !assignmentKey) return;
    const fetchData = async () => {
      setState({ loading: true, error: "" });
      try {
        const [assignmentData, studentsData, submissionsData] = await Promise.all([
          getAssignmentDetail(assignmentKey),
          getClassStudents(classId),
          getAssignmentSubmissions(assignmentKey),
        ]);
        setAssignment(assignmentData || null);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
        setState({ loading: false, error: "" });
      } catch (err) {
        setState({
          loading: false,
          error: err?.response?.data?.detail || t("messages.load_submissions_failed", "Không thể tải dữ liệu bài nộp."),
        });
      }
    };
    fetchData();
  }, [isTeacher, assignmentKey, classId]);

  useEffect(() => {
    if (!students.length) return;
    const fromQuery = Number(searchParams.get("studentId"));
    if (fromQuery && students.some((s) => s.id === fromQuery)) {
      setSelectedStudentId(fromQuery);
      return;
    }
    if (!selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId, searchParams]);

  const submissionMap = useMemo(() => {
    const map = new Map();
    submissions.forEach((item) => {
      if (!map.has(item.student)) {
        map.set(item.student, item);
      }
    });
    return map;
  }, [submissions]);

  const completedCount = useMemo(() => {
    const unique = new Set(submissions.map((item) => item.student));
    return unique.size;
  }, [submissions]);

  const selectedSubmission = useMemo(() => {
    if (!selectedStudentId) return null;
    return submissionMap.get(selectedStudentId) || null;
  }, [selectedStudentId, submissionMap]);

  const selectedAnswers = useMemo(() => {
    if (!selectedSubmission) return [];
    return buildAnswerList(selectedSubmission.submitted_content);
  }, [selectedSubmission]);

  const correctCount = useMemo(() => {
    if (assignment?.type !== "QUIZ") return 0;
    return computeCorrectCount(assignment.content?.questions || [], selectedAnswers);
  }, [assignment, selectedAnswers]);

  const studentCorrectMap = useMemo(() => {
    if (assignment?.type !== "QUIZ") return new Map();
    const questions = assignment.content?.questions || [];
    const map = new Map();
    submissions.forEach((item) => {
      const answers = buildAnswerList(item.submitted_content);
      const count = computeCorrectCount(questions, answers);
      map.set(item.student, count);
    });
    return map;
  }, [assignment, submissions]);

  if (loading) {
    return <div className="text-center mt-20">{t("status.loading", "Đang tải...")}</div>;
  }

  if (!user || !isTeacher) {
    return <div className="text-center mt-20">{t("status.no_permission", "Không có quyền truy cập")}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {t("titles.assignment_submissions")}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {assignment?.title || t("titles.assignment_submissions", "Bài tập")}
              </p>
            </div>
            <Link
              to={`/classes/${classId}`}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {t("buttons.back_to_class")}
            </Link>
          </div>
          <div className="mt-4 text-sm text-slate-700">
            {t("labels.completed")}:{" "}
            <span className="font-semibold text-teal-600">
              {completedCount}
            </span>
            {" / "}
            <span className="font-semibold">{students.length}</span>
          </div>
        </header>

        {state.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("titles.students_list")}
            </h2>
            {state.loading ? (
              <div className="mt-3 text-sm text-slate-500">{t("status.loading")}</div>
            ) : students.length ? (
              <div className="mt-4 space-y-2">
                {students.map((student) => {
                  const hasSubmitted = submissionMap.has(student.id);
                  const correctForStudent = studentCorrectMap.get(student.id);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        if (hasSubmitted) setSelectedStudentId(student.id);
                      }}
                      disabled={!hasSubmitted}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        selectedStudentId === student.id
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-semibold text-slate-900">
                        {student.username}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {hasSubmitted
                          ? assignment?.type === "QUIZ"
                            ? `${t("labels.correct_answers")} ${correctForStudent ?? 0}/${(assignment.content?.questions || []).length}`
                            : t("status.submitted")
                          : t("status.not_submitted")}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-500">
                {t("status.no_students")}
              </div>
            )}
          </section>

          <section className="space-y-4 lg:col-span-2">
            {!selectedStudentId && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                {t("status.select_student")}
              </div>
            )}

            {selectedStudentId && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  {t("titles.student_submission")}
                </h3>
                {!selectedSubmission && (
                  <div className="mt-3 text-sm text-slate-500">
                    {t("status.student_not_submitted")}
                  </div>
                )}
                {selectedSubmission && assignment?.type === "CODE" && (
                  <>
                    <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                      {typeof selectedSubmission.submitted_content === "string"
                        ? selectedSubmission.submitted_content
                        : selectedSubmission.submitted_content?.code || ""}
                    </pre>

                    {selectedSubmission.ai_feedback && (
                      <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                            <span>🤖</span> {t("titles.ai_feedback")}
                          </h4>
                          {selectedSubmission.score !== null && (
                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                              {t("labels.score")}: {selectedSubmission.score} / 10
                            </span>
                          )}
                        </div>
                        <div className="mt-3 prose prose-sm max-w-none text-indigo-800">
                          <ReactMarkdown>{selectedSubmission.ai_feedback}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {selectedSubmission && assignment?.type === "QUIZ" && (
                  <div className="mt-4 space-y-4">
                    <div className="text-sm font-semibold text-teal-700">
                      {t("labels.correct_answers")}: {correctCount} /{" "}
                      {(assignment.content?.questions || []).length}
                    </div>
                    {(assignment.content?.questions || []).map((question, index) => {
                      const selectedValue = selectedAnswers[index];
                      return (
                        <div
                          key={question.id || index}
                          className="rounded-xl border border-slate-100 p-3"
                        >
                          <div className="text-sm font-semibold text-slate-800">
                            {question.title || `${t("form.question", "Câu hỏi")} ${index + 1}`}
                          </div>
                          <div className="mt-2 space-y-2 text-sm">
                            {(question.answers || []).map((answer) => {
                              const isCorrect =
                                question.correctAnswerId &&
                                answer.id === question.correctAnswerId;
                              const isSelected = answer.id === selectedValue;
                              const baseStyle = "rounded-lg border px-3 py-2";
                              const highlight = isCorrect
                                ? "border-green-200 bg-green-50 text-green-700"
                                : isSelected
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-slate-100 bg-white text-slate-700";
                              return (
                                <div key={answer.id} className={`${baseStyle} ${highlight}`}>
                                  {answer.text}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
