// src/componets/common/Header.jsx
import {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import api from '../../api/axiosConfig';
import { UserContext } from '../../App';

export default function Header() {
  const { userData, setUserData } = useContext(UserContext);
  const navigate = useNavigate();
  const isLoggedIn = !!userData;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // purchases count for buyer
  const [ordersCount, setOrdersCount] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  // fetch buyer purchases count when logged in as buyer
  useEffect(() => {
    let mounted = true;
    const fetchOrdersCount = async () => {
      if (!userData || userData?.type !== "buyer") {
        if (mounted) setOrdersCount(null);
        return;
      }
      try {
        setOrdersLoading(true);
        const res = await api.get("/user/orders/my");
        if (!mounted) return;
        if (res?.data?.success) {
          const list = Array.isArray(res.data.data) ? res.data.data : [];
          setOrdersCount(list.length);
        } else {
          setOrdersCount(0);
        }
      } catch (err) {
        console.error("Failed to fetch orders for header:", err);
        if (mounted) setOrdersCount(0);
      } finally {
        if (mounted) setOrdersLoading(false);
      }
    };

    fetchOrdersCount();
    return () => {
      mounted = false;
    };
  }, [userData]);

  async function handleLogout() {
    try {
      await api.post("/user/logout");
    } catch (e) {
      console.error("Logout API error:", e);
    } finally {
      if (setUserData) setUserData(null);
      navigate("/");
    }
  }

  return (
    <header className="bg-gradient-to-r from-amber-200/30 via-amber-100 to-amber-50 shadow-sm sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 my-3">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center text-amber-700 font-bold">
                RH
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-amber-800 leading-none">
                  Restore Hub
                </h1>
                <p className="text-xs text-amber-600">
                  Revive • Rebuild • Restore
                </p>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link to="/" className="text-amber-800 hover:text-amber-900">
              Home
            </Link>
            <Link to="/items" className="text-amber-800 hover:text-amber-900">
              Items
            </Link>
            <Link to="/about" className="text-amber-800 hover:text-amber-900">
              About
            </Link>
            <Link to="/contact" className="text-amber-800 hover:text-amber-900">
              Contact
            </Link>

            {/* My Purchases visible to buyers */}
            {isLoggedIn && userData?.type === "buyer" && (
              <Link
                to="/my-purchases"
                className="relative inline-flex items-center gap-2 text-amber-800 hover:text-amber-900"
              >
                <span>My Purchases</span>
                <span className="ml-1 inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 text-xs font-medium rounded-full bg-amber-700 text-white">
                  {ordersLoading ? (
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  ) : (
                    ordersCount ?? 0
                  )}
                </span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isLoggedIn && (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md border border-amber-700 text-amber-700 hover:bg-amber-50 text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-md bg-amber-600 text-white text-sm shadow-sm"
                >
                  Register
                </Link>
              </>
            )}

            {isLoggedIn && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((s) => !s)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-white shadow-sm"
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                >
                  <img
                    src={
                      userData?.avatar?.url || "https://via.placeholder.com/40"
                    }
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-amber-800 font-medium text-sm">
                    {userData?.name || "User"}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg ring-1 ring-black/5">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
                    >
                      Profile
                    </Link>
                    {/* Quick access to purchases from dropdown for convenience (buyers) */}
                    {userData?.type === "buyer" && (
                      <Link
                        to="/my-purchases"
                        className="block px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
                      >
                        My Purchases
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileOpen((s) => !s);
              }}
              className="md:hidden p-2 rounded-md text-amber-700 hover:bg-amber-50"
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    mobileOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileOpen && (
          <div className="md:hidden pb-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-2 px-2">
              <Link
                to="/"
                className="py-2 px-3 rounded-md text-amber-800 hover:bg-amber-50"
              >
                Home
              </Link>
              <Link
                to="/items"
                className="py-2 px-3 rounded-md text-amber-800 hover:bg-amber-50"
              >
                Items
              </Link>
              <Link
                to="/about"
                className="py-2 px-3 rounded-md text-amber-800 hover:bg-amber-50"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="py-2 px-3 rounded-md text-amber-800 hover:bg-amber-50"
              >
                Contact
              </Link>

              {isLoggedIn && userData?.type === "buyer" && (
                <Link
                  to="/my-purchases"
                  className="flex items-center justify-between py-2 px-3 rounded-md text-amber-800 hover:bg-amber-50"
                >
                  <span>My Purchases</span>
                  <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 text-xs font-medium rounded-full bg-amber-700 text-white">
                    {ordersLoading ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                    ) : (
                      ordersCount ?? 0
                    )}
                  </span>
                </Link>
              )}

              {!isLoggedIn ? (
                <div className="flex gap-2 px-2 mt-2">
                  <Link
                    to="/login"
                    className="flex-1 py-2 px-3 rounded-md border border-amber-700 text-amber-700 text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 py-2 px-3 rounded-md bg-amber-600 text-white text-center"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="mt-2 border-t pt-2">
                  <Link
                    to="/dashboard"
                    className="block py-2 px-3 rounded-md text-amber-800 hover:bg-amber-50"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block py-2 px-3 rounded-md text-amber-800 hover:bg-amber-50"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2 px-3 rounded-md text-rose-600 hover:bg-rose-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
