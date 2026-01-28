import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/useAuth";

import Login from "./router/login";
import Register from "./router/register";
import Student from "./pages/StudentPage";
import Teacher from "./pages/TeacherPage";
import Home from "./pages/HomePage";
import OAuthCallback from "./router/OAuthCallback";
import PrivateRoute from "./component/private_route";

// 🔥 IMPORT ĐÚNG
import StudyPlanPage from "./pages/StudyPlanPage";
import QuizList from "./pages/Quiz/QuizList";
import QuizDetail from "./pages/Quiz/QuizDetail";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* STUDENT */}
          <Route
            path="/StudentPage"
            element={
              <PrivateRoute roles={["student"]}>
                <Student />
              </PrivateRoute>
            }
          />

          {/* TEACHER DASHBOARD */}
          <Route
            path="/TeacherPage"
            element={
              <PrivateRoute roles={["teacher"]}>
                <Teacher />
              </PrivateRoute>
            }
          />

          {/* 🔥 STUDY PLAN – FIX MÀN TRẮNG */}
          <Route
            path="/teacher/study-plan"
            element={
              <PrivateRoute roles={["teacher"]}>
                <StudyPlanPage />
              </PrivateRoute>
            }
          />

          {/* QUIZ ROUTES */}
          <Route
            path="/quiz"
            element={
              <PrivateRoute roles={["student", "teacher", "admin"]}>
                <QuizList />
              </PrivateRoute>
            }
          />
          <Route
            path="/quiz/:id"
            element={
              <PrivateRoute roles={["student", "teacher", "admin"]}>
                <QuizDetail />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
