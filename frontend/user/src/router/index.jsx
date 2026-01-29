// src/router/index.jsx
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/HomePage";
import RoadmapPage from "../pages/RoadmapPage";
import CourseDetailPage from "../pages/CourseDetailPage";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import OAuthCallback from "../router/OAuthCallback";
import { AuthProvider } from "../contexts/useAuth.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import ProfileUpdatePage from "../pages/ProfileUpdatePage.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      { path: "oauth/callback", element: <OAuthCallback /> },
      {
        path: "roadmap",
        element: <RoadmapPage />,
      },
      {
        path: "courses/:slug",
        element: <CourseDetailPage />,
      },
      {
        path: "courses/:slug/lessons/:lessonSlug",
        element: <CourseDetailPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "profile/update",
        element: <ProfileUpdatePage />,
      },
    ],
  },
]);

export default router;
