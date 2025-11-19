import { useContext, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import api from "../../api/axiosConfig";
import { UserContext } from "../../App";
import Footer from "./Footer";
import Header from "./Header";

export default function Login() {
  const navigate = useNavigate();
  const { fetchMe } = useContext(UserContext) || {};
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setStatus({ loading: false, error: "", success: "" });
  };

  const validate = () => {
    if (!form.email?.trim() || !form.password)
      return "Please fill in both email and password.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim()))
      return "Please enter a valid email address.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: false, error: "", success: "" });

    const err = validate();
    if (err) {
      setStatus((s) => ({ ...s, error: err }));
      return;
    }

    try {
      setStatus({ loading: true, error: "", success: "" });

      // Login request — backend should set session cookie or return token via response.
      const res = await api.post("/user/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (res?.data?.success) {
        // Do NOT use . Rely on fetchMe to refresh context from server-side session.
        if (typeof fetchMe === "function") {
          await fetchMe();
        }

        setStatus({
          loading: false,
          error: "",
          success: res.data.message || "Logged in successfully",
        });
        navigate("/dashboard");
      } else {
        setStatus({
          loading: false,
          error: res?.data?.message || "Login failed",
          success: "",
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err?.response?.data?.message ??
        "Something went wrong. Please try again.";
      setStatus({ loading: false, error: msg, success: "" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-amber-800 text-center">
            Sign in
          </h2>
          <p className="text-sm text-amber-600 text-center mt-2">
            Sign in to manage your items or continue exploring the platform.
          </p>

          {status.error && (
            <div className="mt-4 text-sm text-rose-700 bg-rose-50 p-3 rounded">
              {status.error}
            </div>
          )}
          {status.success && (
            <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 p-3 rounded">
              {status.success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-amber-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-amber-700"
              >
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-2 text-sm text-amber-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="text-sm">
                <Link to="/register" className="text-amber-700 hover:underline">
                  Create account
                </Link>
              </div>
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="text-amber-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={status.loading}
                className={`w-full px-4 py-2 rounded-md text-white font-medium ${
                  status.loading
                    ? "bg-amber-300 cursor-not-allowed"
                    : "bg-amber-700 hover:bg-amber-800"
                }`}
              >
                {status.loading ? "Signing in…" : "Sign In"}
              </button>
            </div>

            <div className="mt-4 text-center text-sm">
              <span className="text-amber-600">Or</span>
            </div>

            <div className="mt-2 flex gap-3">
              <Link
                to="/"
                className="flex-1 px-3 py-2 rounded-md border text-center border-amber-200 text-amber-700"
              >
                Visit Home
              </Link>
              <Link
                to="/items"
                className="flex-1 px-3 py-2 rounded-md bg-amber-700 text-white text-center"
              >
                Browse Items
              </Link>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
