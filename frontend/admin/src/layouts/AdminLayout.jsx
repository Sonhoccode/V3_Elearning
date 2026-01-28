import { Outlet } from 'react-router-dom';
import ScrollToTop from '../components/items/ScrollToTop';
import Sidebar from '../components/Sidebar.jsx';
import LessonSidebar from '../components/LessonSidebar.jsx';

export default function AdminLayout() {
    return (
        <div className="admin-layout flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
            {/* Layer 1: Courses Navigation */}
            <Sidebar />
            
            {/* Layer 2: Lessons Context Navigation (Auto-visible if course selected) */}
            <LessonSidebar />

            {/* Layer 3: Main Content */}
            <main className="flex-1 overflow-y-auto">
                <ScrollToTop />
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

