import logo from "../assets/Logo TTTN/logo_full.png";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { Outlet } from "react-router-dom";

function Teacher() {
  const { isAuthenticated, user, logout_user } = useAuth();

  return (
    
    <div className="flex flex-col min-h-screen">
         
      {/* HEADER */}
      <header className="relative flex items-center justify-between h-20 px-5 text-black bg-white">
        {/* LEFT */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-10" />
        </div>

        {/* CENTER */}
        <div className="absolute -translate-x-1/2 left-1/2">
          <h1 className="text-2xl font-semibold">
            I am a{" "}
            <span className="font-semibold text-green-400 animated-text" />
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4 text-base">
          {!isAuthenticated ? (
            <>
              <Link to="/register" className="hover:text-cyan-400">
                Register
              </Link>
              <span className="text-gray-400">|</span>
              <Link to="/login" className="hover:text-cyan-400">
                Login
              </Link>
            </>
          ) : (
            <>
              <span>
                Xin chào, <b>{user?.username}</b>
              </span>
              <span className="text-gray-400">|</span>
              <button
                onClick={logout_user}
                className="hover:text-red-500"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {/* NAVBAR */}
      <nav className="bg-[#222] py-1 flex justify-center">
        <div className="flex gap-5 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {[
            "HTML","CSS","JavaScript","SQL","Python","Java","PHP",
            "How To","React","MySQL","NodeJS","Django"
          ].map((item, i) => (
            <a
              key={i}
              href="#"
              className="text-gray-200 px-3 py-2 rounded-md text-sm hover:bg-[#333] hover:text-cyan-400 transition"
            >
              {item}
            </a>
          ))}
        </div>
      </nav>

      {/* SECTION 1 */}
      <section className="bg-[#222] text-white text-center py-20">
        <h2 className="mb-4 text-4xl font-bold">
          Learn to code
        </h2>
        <p className="text-gray-300">
          With the world's largest web developer site.
        </p>
      </section>

      {/* WAVE */}
      <div className="w-full overflow-hidden leading-none bg-red-600">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-24">
          <path
            fill="#222"
            d="M0,256L48,229.3C96,203,192,149,288,144C384,139,480,181,576,192C672,203,768,181,864,170.7C960,160,1056,160,1152,149.3C1248,139,1344,117,1392,106.7L1440,96L1440,0L0,0Z"
            />
        </svg>
      </div>

      {/* SECTION 2 */}
      <section className="py-20 text-center text-white bg-red-600">
        <h2 className="mb-3 text-3xl font-bold">
          Content Area
        </h2>
        <p>This is where the main content will go.</p>
      </section>

            {/* STUDY PLAN SECTION */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-6xl px-6 mx-auto">

          <h2 className="mb-4 text-3xl font-bold text-center">
            Study Plan for Teachers
          </h2>

          <p className="mb-10 text-center text-gray-600">
            Create, organize and manage learning plans for your students.
          </p>

          <div className="grid gap-6 md:grid-cols-3">

            {/* Card 1 */}
            <div className="p-6 bg-white shadow rounded-xl">
              <h3 className="mb-2 text-lg font-semibold">
                📅 Weekly Study Plan
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Drag & drop lessons into a weekly calendar.
              </p>
              <Link
                to="/teacher/study-plan"
                className="inline-block px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
              >
                Open Study Plan
              </Link>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-white shadow rounded-xl">
              <h3 className="mb-2 text-lg font-semibold">
                👩‍🎓 Student Progress
              </h3>
              <p className="text-sm text-gray-600">
                Track learning progress of each student.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-white shadow rounded-xl">
              <h3 className="mb-2 text-lg font-semibold">
                🧠 Lesson Management
              </h3>
              <p className="text-sm text-gray-600">
                Create and organize lessons by topic.
              </p>
            </div>

          </div>
        </div>
      </section>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="p-3 text-sm text-center bg-white">
        footer
      </footer>

      {/* TEXT ANIMATION */}
      <style>{`
        .animated-text::after {
          content: " Web Developer";
          animation: words 6s infinite;
        }
        @keyframes words {
          0%,33% { content: " Web Developer"; color: #00ff7f; }
          34%,66% { content: " Creative Designer"; color: #ff00ff; }
          67%,100% { content: " Digital Creator"; color: #ffd700; }
        }
      `}</style>
    </div>
  );
}

export default Teacher;
