import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/useAuth";

import Login from "./router/login";
import Register from "./router/register";
import Student from "./pages/StudentPage";
import Teacher from "./pages/TeacherPage";
import Home from "./pages/HomePage";
import OAuthCallback from "./router/OAuthCallback";
import PrivateRoute from "./component/private_route";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register/>} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/" element={<Home/>} />
          {/* STUDENT */}
          <Route
            path="/StudentPage"
            element={
              <PrivateRoute roles={["student"]}>
                <Student />
              </PrivateRoute>
            }
          />

          {/* TEACHER */}
          <Route
            path="/TeacherPage"
            element={
              <PrivateRoute roles={["teacher"]}>
                <Teacher />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
