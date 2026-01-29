import { useAuth } from "../contexts/useAuth";

const LogoutButton = () => {
  const { logout_user } = useAuth();

  return (
    <button
      onClick={logout_user}
      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
    >
      Logout
    </button>
  );
};

export default LogoutButton;