// src/router/index.jsx
import { createBrowserRouter, redirect } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import HomePage from "../pages/HomePage";
import RoadmapPage from "../pages/RoadmapPage";
import CourseDetailPage from "../pages/CourseDetailPage";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import OAuthCallback from "../router/OAuthCallback";
import ProfilePage from "../pages/ProfilePage.jsx";
import ProfileUpdatePage from "../pages/ProfileUpdatePage.jsx";

import { AuthProvider } from "../contexts/useAuth.jsx";

import { queryClient } from "../queryClient";
import { fetchLessonsByCourse } from "../api/lessonsAPI";
import { fetchCourses } from "../api/coursesAPI";

import i18n from "../i18n/i18.js";

async function courseIndexLoader({ params }) {
  const { slug } = params;

  try {
    const courses = await queryClient.ensureQueryData({
      queryKey: ["courses"],
      queryFn: ({ signal }) => fetchCourses({ signal }),
      staleTime: 300_000,
    });
    const course = courses.find((c) => c.slug === slug);
    if (!course) return null;

    const lessons = await queryClient.ensureQueryData({
      queryKey: ["lessons-by-course", slug, i18n.language],
      queryFn: ({ signal }) =>
        fetchLessonsByCourse({
          courseSlug: slug,
          lang: i18n.language,
          signal,
        }),
      staleTime: 300_000,
    });
    if (!lessons.length) return null;

    return redirect(`/courses/${slug}/lessons/${lessons[0].slug}`);
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return null;
  }
}

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
        loader: courseIndexLoader,
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
