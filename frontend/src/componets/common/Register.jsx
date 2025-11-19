import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import api from "../../api/axiosConfig";
import Footer from "./Footer";
import Header from "./Header";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    type: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setStatus({ loading: false, error: "", success: "" });
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim()))
      return "Please enter a valid email address";
    const phoneClean = (form.phone || "").replace(/\s+/g, "");
    if (!/^\d{10,15}$/.test(phoneClean))
      return "Please enter a valid phone number (10-15 digits)";
    if (!form.password || form.password.length < 6)
      return "Password must be at least 6 characters";
    if (!form.type) return "Please select user type (buyer or seller)";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setStatus({ loading: false, error: err, success: "" });
      return;
    }

    try {
      setStatus({ loading: true, error: "", success: "" });
      const submission = {
        ...form,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      };

      const res = await api.post("/user/register", submission);

      if (res?.data?.success) {
        setStatus({
          loading: false,
          error: "",
          success: res.data.message || "Registered successfully. Please login.",
        });
        // redirect to login after short delay so user sees success
        setTimeout(() => navigate("/login"), 900);
      } else {
        setStatus({
          loading: false,
          error: res?.data?.message || "Registration failed",
          success: "",
        });
      }
    } catch (err) {
      console.error("Register error:", err);
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
            Create an account
          </h2>
          <p className="text-sm text-amber-600 text-center mt-2">
            Join Restore Hub to list items or buy restored goods.
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

          <form onSubmit={handleSubmit} className="mt-6 space-y-3" noValidate>
            <div>
              <label className="block text-sm font-medium text-amber-700">
                Full name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-700">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-700">
                Phone
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Mobile number (10-15 digits)"
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                  required
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

            <div>
              <label className="block text-sm font-medium text-amber-700">
                Account type
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              >
                <option value="">Select account type</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="submit"
                disabled={status.loading}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  status.loading
                    ? "bg-amber-300"
                    : "bg-amber-700 hover:bg-amber-800"
                }`}
              >
                {status.loading ? "Signing up…" : "Sign Up"}
              </button>
            </div>

            <div className="mt-3 text-sm text-center text-amber-600">
              Already have an account?{" "}
              <Link to="/login" className="text-amber-700 hover:underline">
                Sign in
              </Link>
            </div>

            <div className="mt-4 flex gap-3">
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
