import logo from "../assets/Logo TTTN/logo_full.png";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

function Student() {
  const { isAuthenticated, user, logout_user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">

      {/* HEADER */}
      <header className="relative h-20 bg-white text-black flex items-center justify-between px-5">
        {/* LEFT */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-10" />
        </div>

        {/* CENTER */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-2xl font-semibold">
            I am a{" "}
            <span className="animated-text text-green-400 font-semibold" />
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
        <div className="flex gap-5 overflow-x-auto whitespace-nowrap px-4 scrollbar-hide">
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
        <h2 className="text-4xl font-bold mb-4">
          Learn to code
        </h2>
        <p className="text-gray-300">
          With the world's largest web developer site.
        </p>
      </section>

      {/* WAVE */}
      <div className="w-full bg-red-600 overflow-hidden leading-none">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-24">
          <path
            fill="#222"
            d="M0,256L48,229.3C96,203,192,149,288,144C384,139,480,181,576,192C672,203,768,181,864,170.7C960,160,1056,160,1152,149.3C1248,139,1344,117,1392,106.7L1440,96L1440,0L0,0Z"
            />
        </svg>
      </div>

      {/* SECTION 2 */}
      <section className="bg-red-600 text-white text-center py-20">
        <h2 className="text-3xl font-bold mb-3">
          Content Area
        </h2>
        <p>This is where the main content will go.</p>
      </section>

      {/* FOOTER */}
      <footer className="bg-white p-3 text-center text-sm">
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

export default Student;
