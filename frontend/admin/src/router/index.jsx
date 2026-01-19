// src/router/index.jsx
import { createBrowserRouter } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import DashboardPage from "../pages/DashboardPage";
import AdminLessonListPage from "../pages/AdminLessonListPage";
import AdminLessonDetailPage from "../pages/AdminLessonDetailPage";
import AdminLessonEditPage from "../pages/AdminLessonEditPage";
import AdminCourseCreatePage from "../pages/AdminCourseCreatePage";
import AdminCourseDetailPage from "../pages/AdminCourseDetailPage";
import LoginPage from "../pages/LoginPage";
import RequireAuth from "../components/RequireAuth";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AdminLayout />,
        children: [
          {
            index: true,          
            element: <DashboardPage />,
          },
          {
            path: "courses/new",
            element: <AdminCourseCreatePage />,
          },
          {
            path: "courses/:id",
            element: <AdminCourseDetailPage />,
          },
          {
            path: "lessons",
            element: <AdminLessonListPage />,
          },
          {
            path: "lessons/:slug",
            element: <AdminLessonDetailPage />,
          },
          {
            path: "lessons/:slug/edit",
            element: <AdminLessonEditPage />,
          },
          {
            path: "courses/:id/lessons/:slug/edit",
            element: <AdminLessonEditPage />,
          },
        ],
      },
    ],
  },
]);

export default router;
