// src/components/NavBar.jsx
import { useCallback, useContext, useMemo, useState } from "react";

import PropTypes from "prop-types";
import {
  FaBox,
  FaShoppingBag,
  FaSignOutAlt,
  FaStore,
  FaUser,
} from "react-icons/fa";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";

import api from "../../api/axiosConfig";
import { UserContext } from "../../App";

/**
 * Tailwind NavBar with teal / amethyst / amber palette + hover animations
 */
const NavBar = ({ setSelectedComponent }) => {
  const navigate = useNavigate();
  const { userData, setUserData, fetchMe } = useContext(UserContext) || {};
  const [open, setOpen] = useState(false);

  const userType = userData?.type;
  const isAuthenticated = !!userData;
  // optional counts (if your backend provides them)
  const cartCount = userData?.cartCount ?? 0;
  const notifCount = userData?.notifCount ?? 0;

  const handleLogout = useCallback(async () => {
    try {
      await api.post("/user/logout");
    } catch (err) {
      // still proceed with clearing local state
      console.warn("Logout failed:", err);
    } finally {
      setUserData?.(null);
      localStorage.removeItem("user");
      if (typeof fetchMe === "function") {
        try {
          await fetchMe();
        } catch (e) {
          // silent
        }
      }
      navigate("/login", { replace: true });
    }
  }, [setUserData, fetchMe, navigate]);

  const navItems = useMemo(() => {
    if (!isAuthenticated) return [];

    const base = [
      {
        to: "/",
        label: "Home",
        icon: <FaStore className="inline-block mr-2" />,
      },
    ];

    const buyer = [
      {
        to: "/items",
        label: "Browse Items",
        icon: <FaBox className="inline-block mr-2" />,
      },
      {
        to: "/my-purchases",
        label: "My Purchases",
        icon: <FaShoppingBag className="inline-block mr-2" />,
      },
    ];

    const seller = [
      {
        to: "/items",
        label: "Manage Items",
        icon: <FaBox className="inline-block mr-2" />,
      },
    ];

    return [...base, ...(userType === "buyer" ? buyer : seller)];
  }, [isAuthenticated, userType]);

  // utility for link classes with active state
  const linkClass = (isActive) =>
    [
      "flex items-center px-3 py-2 rounded-md transition transform motion-safe:transition-all",
      "hover:scale-[1.03] hover:shadow-sm",
      "text-gray-700",
      "dark:text-gray-200",
      "text-sm font-medium",
      isActive
        ? "bg-gradient-to-r from-teal-50 via-purple-50 to-amber-50 text-teal-700 shadow-inner"
        : "hover:bg-gradient-to-r hover:from-teal-50 hover:via-purple-50 hover:to-amber-50",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 bg-white/75 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <RouterNavLink
              to="/"
              className="inline-flex items-center gap-3"
              onClick={() => setOpen(false)}
            >
              <FaStore className="w-7 h-7 text-teal-500 drop-shadow-sm" />
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-teal-400 via-purple-600 to-amber-400 bg-clip-text text-transparent select-none">
                Restore Hub
              </h1>
            </RouterNavLink>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <div className="flex items-center gap-2">
              {navItems.map((item) => (
                <RouterNavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </RouterNavLink>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Auth links / User dropdown */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-800">
                    {userData?.name || userData?.email}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {userType}
                  </span>
                </div>

                {/* small avatar-like button (acts as dropdown trigger) */}
                <div className="relative">
                  {/* simple popover using native details/summary for accessibility */}
                  <details className="relative">
                    <summary className="flex items-center gap-2 cursor-pointer list-none p-2 rounded-full hover:bg-gray-100 transition">
                      <FaUser className="w-5 h-5 text-teal-600" />
                      <span className="sr-only">Account menu</span>
                    </summary>

                    <div className="mt-2 right-0 w-44 bg-white border border-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 p-2">
                      <RouterNavLink
                        to="/profile"
                        className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-50 text-sm"
                      >
                        <FaUser /> <span>Profile</span>
                      </RouterNavLink>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-50 text-sm text-red-600"
                        type="button"
                      >
                        <FaSignOutAlt /> <span>Log out</span>
                      </button>
                    </div>
                  </details>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <RouterNavLink
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-teal-600 transition"
                >
                  Login
                </RouterNavLink>
                <RouterNavLink
                  to="/register"
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-teal-400 via-purple-600 to-amber-400 text-white shadow-md hover:scale-105 transition transform"
                >
                  Register
                </RouterNavLink>
              </div>
            )}

            {/* mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition"
              aria-expanded={open}
              onClick={() => setOpen((s) => !s)}
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {open ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white/95">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <RouterNavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                    isActive
                      ? "bg-gradient-to-r from-teal-50 via-purple-50 to-amber-50 text-teal-700"
                      : "hover:bg-gray-50"
                  }`
                }
                onClick={() => setOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </RouterNavLink>
            ))}

            <div className="pt-2 border-t border-gray-100">
              {isAuthenticated ? (
                <>
                  <RouterNavLink
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50"
                  >
                    <FaUser /> Profile
                  </RouterNavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-red-600"
                  >
                    <FaSignOutAlt /> Log Out
                  </button>
                </>
              ) : (
                <>
                  <RouterNavLink
                    to="/login"
                    className="block px-3 py-2 rounded-md hover:bg-gray-50"
                  >
                    Login
                  </RouterNavLink>
                  <RouterNavLink
                    to="/register"
                    className="block px-3 py-2 rounded-md hover:bg-gray-50"
                  >
                    Register
                  </RouterNavLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

NavBar.propTypes = {
  setSelectedComponent: PropTypes.func,
};

export default NavBar;
