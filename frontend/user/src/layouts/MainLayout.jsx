import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import ScrollToTop from '../components/items/ScrollToTop';

export default function MainLayout() {
    return (
        <div>
            <Header />
            <main>
                <ScrollToTop />
                <Outlet />
            </main>
        </div>
    );
}

