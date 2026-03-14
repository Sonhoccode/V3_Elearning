// frontend/user/src/components/items/authItems.jsx

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/useAuth.jsx";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AuthItems() {
  const [openUser, setOpenUser] = useState(false);
  const { isAuthenticated, user, logout_user } = useAuth();

  const { t } = useTranslation("common");

  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest("[data-user-menu]")) setOpenUser(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);
  return (
    <div className="flex items-center gap-4 text-base relative" data-user-menu>
      {!isAuthenticated ? (
        <>
          <NavLink to="/register" className="hover:text-[#FFCCCC]">
            {t("Register")}
          </NavLink>
          <span className="text-gray-400">|</span>
          <NavLink to="/login" className="hover:text-[#FFCCCC]">
            {t("Login")}
          </NavLink>
        </>
      ) : (
        <>
          <div className="relative">
            <button
              onClick={() => setOpenUser((p) => !p)}
              type="button"
              className="flex items-center gap-1 hover:text-[#FFCCCC]"
            >
              {t("Hello")},
              <b className="flex items-center gap-1">
                {user?.username}
                <ArrowDropDownIcon
                  className={
                    openUser
                      ? "rotate-180 transition-transform"
                      : "transition-transform"
                  }
                />
              </b>
            </button>

            {openUser && (
              <aside
                className="absolute top-full right-0 mt-2 z-50
                                  w-48 overflow-hidden
                                  rounded-xl border border-gray-100 bg-white
                                  shadow-lg
                                  origin-top-right animate-[fadeInTranslate_.12s_ease-out]"
              >
                <div className="p-2">
                  <NavLink
                    to="/profile"
                    onClick={() => setOpenUser(false)}
                    className="block w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex items-center gap-2">
                      <AccountCircleIcon /> {t("Profile")}
                    </span>
                  </NavLink>
                </div>
                <button onClick={logout_user} className="block w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                  {t("Logout")}
                </button>
              </aside>
            )}
          </div>
        </>
      )}
    </div>
  );
}
