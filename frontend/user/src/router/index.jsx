// src/router/index.jsx
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/HomePage";
import UserPage from "../pages/UserPage";
import RoadmapPage from "../pages/RoadmapPage";


const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,          
        element: <HomePage />,
      },
      {
        path: "roadmap",
        element: <RoadmapPage />,
      },
      {
        path: "user",        
        element: <UserPage />,
      },
    ],
  },
]);

export default router;
