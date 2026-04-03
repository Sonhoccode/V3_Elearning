// admin/src/components/items/getCourses.jsx
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCourses } from "../../api/AdminCoursesAPI";

export function CoursesList({ open }) {
  const {
    data: courses = [],
    isLoading: coursesLoading,
    isError: coursesError,
    // eslint-disable-next-line no-undef, react-hooks/rules-of-hooks
  } = useQuery({
    queryKey: ["courses"],
    queryFn: ({ signal }) => fetchCourses({ signal }),
    staleTime: 0,
    gcTime: 0, // v5 (nếu v4 là cacheTime)
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

    return (
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden
            ${open ? "h-full opacity-100" : "max-h-0 opacity-0"}
          `}
        >
          <nav className="flex flex-col gap-1">
            {coursesLoading && (
              <div className="h-full flex items-center justify-center p-4">
                <span className="loader"></span>
              </div>
            )}
            {coursesError && (
              <div className="text-red-500 text-sm p-4">
                Error loading courses
              </div>
            )}
            {!coursesLoading && !coursesError && (
              <>
                {courses?.length > 0 ? (
                  courses.map((course) => (
                    <div key={course.id} className="sidebar-item rounded-lg">
                      <NavLink 
                        to={`/courses/${course.id}`}
                        className={({ isActive }) => 
                            `block w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                isActive 
                                ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-semibold shadow-sm" 
                                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
                            }`
                        }
                      >
                        <span className="opacity-70 text-xs mr-2">#{course.id}</span>
                        <span>{course.title}</span>
                      </NavLink>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--color-text-muted)] text-sm p-4">No courses available.</p>
                )}
              </>
            )}
          </nav>
        </div>
    )
}