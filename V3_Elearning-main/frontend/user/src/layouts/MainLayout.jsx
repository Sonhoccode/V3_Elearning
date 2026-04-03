import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import ScrollToTop from '../components/items/ScrollToTop';

export default function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main>
                <ScrollToTop />
                <Outlet />
            </main>
        </div>
    );
}

