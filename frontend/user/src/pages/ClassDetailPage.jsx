import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../contexts/useAuth.jsx";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  getClassAssignments,
  getClassStudents,
  getMyClasses,
  getMySubmission,
  getTeacherClasses,
  submitAssignment,
  updateAssignment,
} from "../api/classes.api.js";
import { shuffleArray } from "../utils/shuffleArray.js";
import CodeAssignmentEditor from "../components/classes/CodeAssignmentEditor.jsx";
import QuizAssignmentForm from "../components/classes/QuizAssignmentForm.jsx";
import AssignmentForm from "../components/classes/AssignmentForm.jsx";

const normalizeAssignments = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((assignment) => {
    if (assignment?.type !== "QUIZ") return assignment;
    const content = assignment?.content;
    if (!content || !Array.isArray(content.questions)) return assignment;
    const questions = shuffleArray(content.questions).map((question) => {
      if (!question || !Array.isArray(question.answers)) return question;
      return {
        ...question,
        answers: shuffleArray(question.answers),
      };
    });
    return {
      ...assignment,
      content: {
        ...content,
        questions,
      },
    };
  });
};

const formatDateTime = (value) => {
  if (!value) return "Không giới hạn";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createEmptyQuestion = () => ({
  id: makeId(),
  title: "",
  answers: [{ id: makeId(), text: "" }],
  correctAnswerId: "",
});

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

const JSON_TEMPLATES = {
  QUIZ: `{
  "questions": [
    {
      "id": "q1",
      "title": "Câu hỏi mẫu",
      "answers": [
        { "id": "A", "text": "Đáp án A" },
        { "id": "B", "text": "Đáp án B" }
      ],
      "correctAnswerId": "A"
    }
  ]
}`,
  CODE: `{
  "language": "javascript",
  "prompt": "Mô tả đề bài",
  "starter_code": ""
}`,
};

export default function ClassDetailPage() {
  const { id } = useParams();
  const classId = useMemo(() => Number(id), [id]);
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState("assignments");
  const [classInfo, setClassInfo] = useState(null);
  const [classError, setClassError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [assignmentsState, setAssignmentsState] = useState({
    loading: false,
    error: "",
  });
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsState, setSubmissionsState] = useState({
    loading: false,
    error: "",
  });
  const [students, setStudents] = useState([]);
  const [studentsState, setStudentsState] = useState({
    loading: false,
    error: "",
  });
  const [deleteState, setDeleteState] = useState({
    loading: false,
    error: "",
  });
  const [submitState, setSubmitState] = useState({
    loading: false,
    error: "",
    success: "",
  });
  const [mySubmissionState, setMySubmissionState] = useState({
    loading: false,
    error: "",
  });
  const [mySubmission, setMySubmission] = useState(null);
  const [createState, setCreateState] = useState({
    loading: false,
    error: "",
  });
  const [jsonState, setJsonState] = useState({
    loading: false,
    error: "",
  });
  const [jsonForm, setJsonForm] = useState({
    open: false,
    title: "",
    type: "QUIZ",
    deadline: "",
    contentText: JSON_TEMPLATES.QUIZ,
  });
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    type: "QUIZ",
    deadline: "",
    quiz: { questions: [createEmptyQuestion()] },
    code: { language: "javascript", starter_code: "", prompt: "" },
  });

  const role = (user?.role || "").toLowerCase();
  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  const selectedAssignment = useMemo(
    () => assignments.find((item) => item.id === selectedAssignmentId) || null,
    [assignments, selectedAssignmentId]
  );

  const completedCount = useMemo(() => {
    const unique = new Set(submissions.map((item) => item.student));
    return unique.size;
  }, [submissions]);

  const loadStudents = async () => {
    setStudentsState({ loading: true, error: "" });
    try {
      const data = await getClassStudents(classId);
      setStudents(Array.isArray(data) ? data : []);
      setStudentsState({ loading: false, error: "" });
    } catch (err) {
      setStudentsState({
        loading: false,
        error: err?.response?.data?.detail || "Không thể tải danh sách học viên.",
      });
    }
  };

  const toEditorState = (assignment) => {
    if (!assignment) return null;
    const deadlineValue = assignment.deadline
      ? new Date(assignment.deadline).toISOString().slice(0, 16)
      : "";
    if (assignment.type === "CODE") {
      return {
        title: assignment.title || "",
        type: "CODE",
        deadline: deadlineValue,
        quiz: { questions: [createEmptyQuestion()] },
        code: {
          language: assignment.content?.language || "javascript",
          starter_code: assignment.content?.starter_code || "",
          prompt: assignment.content?.prompt || "",
        },
      };
    }
    const questions =
      assignment.content?.questions?.length
        ? assignment.content.questions.map((q) => ({
            id: q.id || makeId(),
            title: q.title || "",
            answers: Array.isArray(q.answers)
              ? q.answers.map((a) => ({
                  id: a.id || makeId(),
                  text: a.text || "",
                }))
              : [{ id: makeId(), text: "" }],
            correctAnswerId: q.correctAnswerId || "",
          }))
        : [createEmptyQuestion()];
    return {
      title: assignment.title || "",
      type: "QUIZ",
      deadline: deadlineValue,
      quiz: { questions },
      code: { language: "javascript", starter_code: "", prompt: "" },
    };
  };

  useEffect(() => {
    if (!loading && user) {
      const fetchClassInfo = async () => {
        setClassError("");
        try {
          const data = isTeacher ? await getTeacherClasses() : await getMyClasses();
          const found = Array.isArray(data)
            ? data.find((item) => Number(item.id) === classId)
            : null;
          setClassInfo(found || null);
          if (!found) setClassError("Không tìm thấy lớp học.");
        } catch (err) {
          setClassError(err?.response?.data?.detail || "Không thể tải thông tin lớp.");
        }
      };

      fetchClassInfo();
    }
  }, [loading, user, classId, isTeacher]);

  const loadAssignments = async () => {
    if (!classId || Number.isNaN(classId)) {
      setAssignmentsState({ loading: false, error: "ID lớp không hợp lệ." });
      return;
    }
    setAssignmentsState({ loading: true, error: "" });
    try {
      const data = await getClassAssignments(classId);
      const normalized = normalizeAssignments(data);
      setAssignments(normalized);
      if (normalized.length) {
        if (!selectedAssignmentId) {
          setSelectedAssignmentId(normalized[0].id);
        } else if (!normalized.some((item) => item.id === selectedAssignmentId)) {
          setSelectedAssignmentId(normalized[0].id);
        }
      } else {
        setSelectedAssignmentId(null);
      }
      setAssignmentsState({ loading: false, error: "" });
    } catch (err) {
      setAssignmentsState({
        loading: false,
        error: err?.response?.data?.detail || "Không thể tải bài tập.",
      });
    }
  };

  useEffect(() => {
    if (!loading && user) {
      loadAssignments();
    }
  }, [loading, user, classId]);

  useEffect(() => {
    if (!selectedAssignmentId || !isTeacher) return;
    const fetchSubmissions = async () => {
      setSubmissionsState({ loading: true, error: "" });
      try {
        const data = await getAssignmentSubmissions(selectedAssignmentId);
        setSubmissions(Array.isArray(data) ? data : []);
        setSubmissionsState({ loading: false, error: "" });
      } catch (err) {
        setSubmissionsState({
          loading: false,
          error: err?.response?.data?.detail || "Không thể tải bài nộp.",
        });
      }
    };
    fetchSubmissions();
  }, [selectedAssignmentId, isTeacher]);

  useEffect(() => {
    if (!selectedAssignment || !isStudent) return;
    if (!selectedAssignment.has_submitted) {
      setMySubmission(null);
      setMySubmissionState({ loading: false, error: "" });
      return;
    }
    const fetchMySubmission = async () => {
      setMySubmissionState({ loading: true, error: "" });
      try {
        const data = await getMySubmission(selectedAssignment.id);
        setMySubmission(data);
        setMySubmissionState({ loading: false, error: "" });
      } catch (err) {
        setMySubmission(null);
        setMySubmissionState({
          loading: false,
          error: err?.response?.data?.detail || "Không thể tải bài đã nộp.",
        });
      }
    };
    fetchMySubmission();
  }, [selectedAssignmentId, isStudent]);

  useEffect(() => {
    if (!isTeacher || !classId || Number.isNaN(classId)) return;
    if (students.length) return;
    loadStudents();
  }, [isTeacher, classId, students.length]);

  useEffect(() => {
    if (activeTab !== "students" || !isTeacher) return;
    if (!students.length && !studentsState.loading) {
      loadStudents();
    }
  }, [activeTab, isTeacher]);

  useEffect(() => {
    setSubmitState({ loading: false, error: "", success: "" });
  }, [selectedAssignmentId]);

  const handleCreateAssignment = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!newAssignment.title.trim()) return;
    const contentPayload =
      newAssignment.type === "QUIZ"
        ? {
            questions: newAssignment.quiz.questions
              .filter((q) => q.title.trim())
              .map((q) => ({
                id: q.id,
                title: q.title.trim(),
                answers: q.answers
                  .filter((a) => a.text.trim())
                  .map((a) => ({ id: a.id, text: a.text.trim() })),
                correctAnswerId: q.correctAnswerId || null,
              })),
          }
        : {
            language: newAssignment.code.language,
            starter_code: newAssignment.code.starter_code,
            prompt: newAssignment.code.prompt,
          };

    setCreateState({ loading: true, error: "" });
    try {
      const isEditing = Boolean(editingAssignmentId);
      const payload = {
        title: newAssignment.title.trim(),
        type: newAssignment.type,
        content: contentPayload,
        deadline: newAssignment.deadline
          ? new Date(newAssignment.deadline).toISOString()
          : null,
      };
      const created = isEditing
        ? await updateAssignment(editingAssignmentId, payload)
        : await createAssignment(classId, payload);
      setNewAssignment({
        title: "",
        type: "QUIZ",
        deadline: "",
        quiz: { questions: [createEmptyQuestion()] },
        code: { language: "javascript", starter_code: "", prompt: "" },
      });
      setEditingAssignmentId(null);
      if (isTeacher) {
        setAssignments((prev) => {
          const updated = isEditing
            ? prev.map((item) => (item.id === created.id ? created : item))
            : [...prev, created];
          return normalizeAssignments(updated);
        });
        setSelectedAssignmentId(created.id);
        setAssignmentsState({ loading: false, error: "" });
      } else {
        await loadAssignments();
      }
      setCreateState({ loading: false, error: "" });
    } catch (err) {
      setCreateState({
        loading: false,
        error: err?.response?.data?.detail || "Tạo bài tập thất bại.",
      });
    }
  };

  const handleSubmitAssignment = async (payload) => {
    if (!selectedAssignment) return;
    setSubmitState({ loading: true, error: "", success: "" });
    try {
      const submitted = await submitAssignment(selectedAssignment.id, payload);
      setSubmitState({ loading: false, error: "", success: "Nộp bài thành công." });
      setAssignments((prev) =>
        prev.map((item) =>
          item.id === selectedAssignment.id
            ? { ...item, has_submitted: true }
            : item
        )
      );
      setMySubmission(submitted || null);
    } catch (err) {
      setSubmitState({
        loading: false,
        error: err?.response?.data?.detail || "Nộp bài thất bại.",
        success: "",
      });
    }
  };

  const handleJsonSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!jsonForm.title.trim()) return;
    let contentPayload = {};
    try {
      contentPayload = JSON.parse(jsonForm.contentText || "{}");
    } catch {
      setJsonState({ loading: false, error: "JSON không hợp lệ." });
      return;
    }
    setJsonState({ loading: true, error: "" });
    try {
      const created = await createAssignment(classId, {
        title: jsonForm.title.trim(),
        type: jsonForm.type,
        content: contentPayload,
        deadline: jsonForm.deadline
          ? new Date(jsonForm.deadline).toISOString()
          : null,
      });
      setJsonForm({
        open: false,
        title: "",
        type: "QUIZ",
        deadline: "",
        contentText: JSON_TEMPLATES.QUIZ,
      });
      if (isTeacher) {
        setAssignments((prev) => {
          const merged = [...prev, created];
          return normalizeAssignments(merged);
        });
        setSelectedAssignmentId(created.id);
      }
      setJsonState({ loading: false, error: "" });
    } catch (err) {
      setJsonState({
        loading: false,
        error: err?.response?.data?.detail || "Tạo bài tập thất bại.",
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!assignmentId || deleteState.loading) return;
    setDeleteState({ loading: true, error: "" });
    try {
      await deleteAssignment(assignmentId);
      setAssignments((prev) => prev.filter((item) => item.id !== assignmentId));
      if (selectedAssignmentId === assignmentId) {
        setSelectedAssignmentId(null);
      }
      if (editingAssignmentId === assignmentId) {
        setEditingAssignmentId(null);
        setNewAssignment({
          title: "",
          type: "QUIZ",
          deadline: "",
          quiz: { questions: [createEmptyQuestion()] },
          code: { language: "javascript", starter_code: "", prompt: "" },
        });
      }
      setDeleteState({ loading: false, error: "" });
    } catch (err) {
      setDeleteState({
        loading: false,
        error: err?.response?.data?.detail || "Xóa bài tập thất bại.",
      });
    }
  };

  const getSubmissionSummary = (submission) => {
    if (!submission) return "";
    if (selectedAssignment?.type === "CODE") {
      const raw =
        typeof submission.submitted_content === "string"
          ? submission.submitted_content
          : submission.submitted_content?.code || "";
      return raw ? `${raw.slice(0, 60)}${raw.length > 60 ? "..." : ""}` : "Đã nộp";
    }
    const answers = Array.isArray(submission.submitted_content)
      ? submission.submitted_content
      : submission.submitted_content?.answers || [];
    return `Đã chọn ${answers.length} đáp án`;
  };

  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  if (!user) {
    return <div className="text-center mt-20">Chưa đăng nhập</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">
            {classInfo?.name || "Chi tiết lớp học"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            ID lớp: {classId}
          </p>
          {classInfo?.join_code && (
            <p className="mt-2 text-sm text-slate-700">
              Join code:{" "}
              <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold">
                {classInfo.join_code}
              </span>
            </p>
          )}
          {classError && (
            <div className="mt-3 text-sm text-red-600">{classError}</div>
          )}
        </header>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "students", label: "Danh sách học viên" },
            { id: "assignments", label: "Bài tập" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "students" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Danh sách học viên
            </h2>
            {!isTeacher && (
              <p className="mt-2 text-sm text-slate-500">
                Chỉ giáo viên mới xem được danh sách học viên.
              </p>
            )}
            {isTeacher && (
              <div className="mt-4 space-y-3">
                {studentsState.error && (
                  <div className="text-sm text-red-600">
                    {studentsState.error}
                  </div>
                )}
                {studentsState.loading ? (
                  <div className="text-sm text-slate-500">Đang tải...</div>
                ) : students.length ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm"
                      >
                        <div className="font-semibold text-slate-900">
                          {student.username}
                        </div>
                        <div className="text-xs text-slate-500">
                          {student.email}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    Chưa có học viên tham gia lớp.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Danh sách bài tập
                </h2>
                {assignmentsState.loading && (
                  <span className="text-xs text-slate-400">Đang tải...</span>
                )}
              </div>

              {assignmentsState.error && (
                <div className="mt-3 text-sm text-red-600">
                  {assignmentsState.error}
                </div>
              )}

              <div className="mt-4 space-y-2">
                {assignments.length ? (
                  assignments.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                        selectedAssignmentId === item.id
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedAssignmentId(item.id)}
                        className="w-full text-left"
                      >
                        <div className="font-semibold text-slate-900">
                          {item.title}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.type} · {formatDateTime(item.deadline)}
                        </div>
                        {isStudent && item.has_submitted && (
                          <div className="mt-2 text-xs font-semibold text-teal-600">
                            Đã nộp
                          </div>
                        )}
                      </button>
                      {isTeacher && (
                        <div className="mt-2 flex flex-wrap justify-end gap-2">
                          <Link
                            to={`/classes/${classId}/assignments/${item.id}/submissions`}
                            className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                          >
                            Bài nộp
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAssignmentId(item.id);
                              setNewAssignment(toEditorState(item));
                            }}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-700"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAssignment(item.id)}
                            disabled={deleteState.loading}
                            className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-60"
                          >
                            Xóa bài tập
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">
                    Chưa có bài tập nào.
                  </div>
                )}
              </div>
              {deleteState.error && (
                <div className="mt-3 text-sm text-red-600">
                  {deleteState.error}
                </div>
              )}
            </section>

            <section className="space-y-4 lg:col-span-2">
              {isTeacher && (
                <div className="space-y-4">
                  <AssignmentForm
                    value={newAssignment}
                    onChange={setNewAssignment}
                    onSubmit={handleCreateAssignment}
                    submitting={createState.loading}
                    error={createState.error}
                    title={editingAssignmentId ? "Cập nhật bài tập" : "Tạo bài tập mới"}
                    submitLabel={editingAssignmentId ? "Cập nhật bài tập" : "Tạo bài tập"}
                    onCancel={
                      editingAssignmentId
                        ? () => {
                            setEditingAssignmentId(null);
                            setNewAssignment({
                              title: "",
                              type: "QUIZ",
                              deadline: "",
                              quiz: { questions: [createEmptyQuestion()] },
                              code: {
                                language: "javascript",
                                starter_code: "",
                                prompt: "",
                              },
                            });
                          }
                        : null
                    }
                  />

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Thêm bài tập bằng JSON
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setJsonForm((prev) => ({
                            ...prev,
                            open: !prev.open,
                          }))
                        }
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {jsonForm.open ? "Đóng" : "Mở"}
                      </button>
                    </div>

                    {jsonForm.open && (
                      <form onSubmit={handleJsonSubmit} className="mt-4 grid gap-3">
                        {jsonState.error && (
                          <div className="text-sm text-red-600">
                            {jsonState.error}
                          </div>
                        )}
                        <input
                          type="text"
                          value={jsonForm.title}
                          onChange={(e) =>
                            setJsonForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Tiêu đề bài tập"
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <select
                            value={jsonForm.type}
                            onChange={(e) => {
                              const nextType = e.target.value;
                              setJsonForm((prev) => ({
                                ...prev,
                                type: nextType,
                                contentText: JSON_TEMPLATES[nextType] || prev.contentText,
                              }));
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="QUIZ">QUIZ</option>
                            <option value="CODE">CODE</option>
                          </select>
                          <input
                            type="datetime-local"
                            value={jsonForm.deadline}
                            onChange={(e) =>
                              setJsonForm((prev) => ({
                                ...prev,
                                deadline: e.target.value,
                              }))
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <textarea
                          value={jsonForm.contentText}
                          onChange={(e) =>
                            setJsonForm((prev) => ({
                              ...prev,
                              contentText: e.target.value,
                            }))
                          }
                          rows={8}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                          type="submit"
                          disabled={jsonState.loading}
                          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                        >
                          {jsonState.loading ? "Đang tạo..." : "Tạo bài tập"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {selectedAssignment && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {selectedAssignment.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedAssignment.type} ·{" "}
                      {formatDateTime(selectedAssignment.deadline)}
                    </p>
                  </div>

                  {isStudent && (
                    <div className="space-y-3">
                      {submitState.error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {submitState.error}
                        </div>
                      )}
                      {submitState.success && (
                        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                          {submitState.success}
                        </div>
                      )}
                      {selectedAssignment.type === "QUIZ" ? (
                        selectedAssignment.has_submitted ? (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h4 className="text-base font-semibold text-slate-800">
                              Bài đã nộp
                            </h4>
                            {mySubmissionState.error && (
                              <div className="mt-2 text-sm text-red-600">
                                {mySubmissionState.error}
                              </div>
                            )}
                            {mySubmissionState.loading && (
                              <div className="mt-2 text-sm text-slate-500">
                                Đang tải bài đã nộp...
                              </div>
                            )}
                            {!mySubmissionState.loading && mySubmission && (
                              <div className="mt-3 space-y-4">
                                <div className="text-sm font-semibold text-teal-700">
                                  Số câu đúng:{" "}
                                  {computeCorrectCount(
                                    selectedAssignment.content?.questions || [],
                                    buildAnswerList(mySubmission.submitted_content)
                                  )}{" "}
                                  / {(selectedAssignment.content?.questions || []).length}
                                </div>
                                {(selectedAssignment.content?.questions || []).map(
                                  (question, index) => {
                                    const selectedAnswers = buildAnswerList(
                                      mySubmission.submitted_content
                                    );
                                    const selectedValue = selectedAnswers[index];
                                    return (
                                      <div
                                        key={question.id || index}
                                        className="rounded-xl border border-slate-100 p-3"
                                      >
                                        <div className="text-sm font-semibold text-slate-800">
                                          {question.title || `Câu ${index + 1}`}
                                        </div>
                                        <div className="mt-2 space-y-2 text-sm">
                                          {(question.answers || []).map((answer) => {
                                            const isCorrect =
                                              question.correctAnswerId &&
                                              answer.id === question.correctAnswerId;
                                            const isSelected = answer.id === selectedValue;
                                            const baseStyle =
                                              "rounded-lg border px-3 py-2";
                                            const highlight = isCorrect
                                              ? "border-green-200 bg-green-50 text-green-700"
                                              : isSelected
                                              ? "border-amber-200 bg-amber-50 text-amber-700"
                                              : "border-slate-100 bg-white text-slate-700";
                                            return (
                                              <div
                                                key={answer.id}
                                                className={`${baseStyle} ${highlight}`}
                                              >
                                                {answer.text}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <QuizAssignmentForm
                            assignment={selectedAssignment}
                            onSubmit={handleSubmitAssignment}
                            submitting={submitState.loading}
                          />
                        )
                      ) : (
                        selectedAssignment.has_submitted ? (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h4 className="text-base font-semibold text-slate-800">
                              Bài đã nộp
                            </h4>
                            {mySubmissionState.error && (
                              <div className="mt-2 text-sm text-red-600">
                                {mySubmissionState.error}
                              </div>
                            )}
                            {mySubmissionState.loading && (
                              <div className="mt-2 text-sm text-slate-500">
                                Đang tải bài đã nộp...
                              </div>
                            )}
                            {!mySubmissionState.loading && mySubmission && (
                              <div className="mt-3">
                                <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                                  {typeof mySubmission.submitted_content === "string"
                                    ? mySubmission.submitted_content
                                    : mySubmission.submitted_content?.code || ""}
                                </pre>
                                {mySubmission.ai_feedback && (
                                  <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4">
                                    <h5 className="font-semibold text-teal-800">
                                      AI Feedback
                                    </h5>
                                    <div className="prose prose-sm prose-teal mt-2 max-w-none text-teal-700">
                                      <ReactMarkdown>
                                        {mySubmission.ai_feedback}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <CodeAssignmentEditor
                            initialCode={
                              selectedAssignment.content?.starter_code ||
                              selectedAssignment.content?.starterCode ||
                              ""
                            }
                            language={selectedAssignment.content?.language}
                            onSubmit={handleSubmitAssignment}
                            submitting={submitState.loading}
                          />
                        )
                      )}
                    </div>
                  )}

                  {isTeacher && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h4 className="text-base font-semibold text-slate-800">
                        Danh sách bài nộp
                      </h4>
                      <div className="mt-2 text-sm text-slate-600">
                        Hoàn thành:{" "}
                        <span className="font-semibold text-teal-600">
                          {completedCount}
                        </span>{" "}
                        / <span className="font-semibold">{students.length}</span>
                      </div>
                      {submissionsState.error && (
                        <div className="mt-2 text-sm text-red-600">
                          {submissionsState.error}
                        </div>
                      )}
                      {submissionsState.loading ? (
                        <div className="mt-3 text-sm text-slate-500">
                          Đang tải bài nộp...
                        </div>
                      ) : (
                        <div className="mt-4 flex justify-end">
                          <Link
                            to={`/classes/${classId}/assignments/${selectedAssignmentId}/submissions`}
                            className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                          >
                            Xem bài tập
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!selectedAssignment && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Chọn một bài tập để xem chi tiết.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
