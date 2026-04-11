import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { CoursesList } from "./items/getCourses";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useAuthStore } from "../store/auth.store";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar glass-card min-w-[280px] h-screen sticky top-0 border-r border-[var(--color-border)] flex flex-col z-50">
      <div className="sidebar-content min-h-[5rem] flex items-center justify-center border-b border-[var(--color-border)]">
        <h2 className="text-2xl font-bold gradient-text">Admin Panel</h2>
      </div>
      
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <NavLink
            to="/"
            className={({ isActive }) =>
            `block w-full px-4 py-3 rounded-lg text-left text-base font-medium transition-all duration-300 ${
                isActive
                ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-semibold shadow-sm"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
            }`
            }
        >
            <div className="flex items-center gap-3">   
                <span>Dashboard</span>
            </div>
        </NavLink>

        <NavLink
            to="/lesson-images"
            className={({ isActive }) =>
            `block w-full px-4 py-3 rounded-lg text-left text-base font-medium transition-all duration-300 ${
                isActive
                ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-semibold shadow-sm"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
            }`
            }
        >
            <div className="flex items-center gap-3">
                <span>Thư viện ảnh</span>
            </div>
        </NavLink>

        <NavLink
            to="/internal-docs"
            className={({ isActive }) =>
            `block w-full px-4 py-3 rounded-lg text-left text-base font-medium transition-all duration-300 ${
                isActive
                ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-semibold shadow-sm"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
            }`
            }
        >
            <div className="flex items-center gap-3">
                <span>Tài liệu nội bộ</span>
            </div>
        </NavLink>

        {/* Dropdown Menu for Courses */}
        <div className="mt-2">
            <button
                onClick={() => setOpen(!open)}
                className={`
                    w-full px-4 py-3 rounded-lg text-left text-base font-medium transition-all duration-300 flex items-center justify-between
                    text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]
                `}
            >
                <div className="flex items-center gap-3">
                    <span>Courses</span>
                </div>
                <ArrowDropDownIcon 
                    className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                />
            </button>
            
            <div 
                className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${open ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}
                `}
            >
                <div className="pl-4 mt-1 border-l-2 border-[var(--color-border)] ml-4">
                    <CoursesList open={true} />
                    
                    {/* Add New Course Button */}
                     <NavLink
                        to="/courses/new"
                        className={({ isActive }) =>
                        `mt-2 block w-full px-4 py-2 rounded-lg text-left text-sm font-medium transition-all duration-300 border border-dashed border-gray-300 flex items-center gap-2 ${
                            isActive
                            ? "bg-blue-50 text-blue-600 border-blue-400"
                            : "text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-white"
                        }`
                        }
                    >
                        <span>+ Thêm khóa học</span>
                    </NavLink>
                </div>
            </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full px-4 py-2 text-sm font-medium text-red-600 transition-all duration-300 rounded-lg hover:text-red-700 hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
