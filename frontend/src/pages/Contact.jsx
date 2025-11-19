import { useState } from "react";

import api from "../api/axiosConfig";
import Footer from "../componets/common/Footer";
import Header from "../componets/common/Header";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({
    submitting: false,
    ok: null,
    message: "",
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim() || form.message.trim().length < 10)
      e.message = "Message should be at least 10 characters";
    return e;
  };

  const handleChange = (field) => (ev) => {
    setForm((s) => ({ ...s, [field]: ev.target.value }));
    setErrors((old) => ({ ...old, [field]: undefined }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      setStatus({ submitting: true, ok: null, message: "" });
      // POST to backend — adjust route if necessary
      await api.post("/contact", form);
      setStatus({
        submitting: false,
        ok: true,
        message: "Thank you — your message was sent.",
      });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus({
        submitting: false,
        ok: false,
        message:
          err?.response?.data?.message ||
          "An error occurred. Please try again later.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <section className="py-16 bg-gradient-to-b from-amber-50 to-white">
          <div className="max-w-6xl mx-auto px-4 grid gap-8 lg:grid-cols-2 items-start">
            {/* Contact info */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold text-amber-800">Contact</h2>
              <p className="mt-2 text-amber-600">
                We’re here to help. Use the form to send a message or reach us
                directly using the details below.
              </p>

              <div className="mt-6 space-y-4 text-sm text-amber-700">
                <div>
                  <strong>Address</strong>
                  <div className="mt-1 text-amber-600">
                    Nalasopara, Mumbai, Maharashtra, India
                  </div>
                </div>

                <div>
                  <strong>Email</strong>
                  <div className="mt-1 text-amber-600">
                    support@restorehub.example
                  </div>
                </div>

                <div>
                  <strong>Phone</strong>
                  <div className="mt-1 text-amber-600">+91 12345 67890</div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-amber-800">
                  Office hours
                </h4>
                <p className="text-amber-600 text-sm mt-1">
                  Mon–Fri, 9:00 AM — 6:00 PM IST
                </p>
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <form onSubmit={handleSubmit} noValidate>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Name
                    </label>
                    <input
                      value={form.name}
                      onChange={handleChange("name")}
                      className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-300"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Email
                    </label>
                    <input
                      value={form.email}
                      onChange={handleChange("email")}
                      type="email"
                      className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-300"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Subject
                    </label>
                    <input
                      value={form.subject}
                      onChange={handleChange("subject")}
                      className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-300"
                    />
                    {errors.subject && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-amber-700">
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={handleChange("message")}
                      rows={6}
                      className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-300"
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={status.submitting}
                      className="px-4 py-2 rounded-md bg-amber-700 text-white font-medium"
                    >
                      {status.submitting ? "Sending…" : "Send Message"}
                    </button>

                    {status.ok === true && (
                      <div className="text-sm text-emerald-600">
                        {status.message}
                      </div>
                    )}
                    {status.ok === false && (
                      <div className="text-sm text-rose-600">
                        {status.message}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
