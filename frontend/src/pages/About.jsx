import React, {
  useEffect,
  useState,
} from 'react';

import Footer from '../componets/common/Footer';
import Header from '../componets/common/Header';

export default function About() {
  // theme: "system" | "light" | "dark"
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("rh_theme") || "system";
    } catch {
      return "system";
    }
  });

  // apply theme (adds class to <html> so CSS inside file can override variables)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    if (theme === "light") root.classList.add("theme-light");
    if (theme === "dark") root.classList.add("theme-dark");
    try {
      localStorage.setItem("rh_theme", theme);
    } catch {}
  }, [theme]);

  // convenience: reset to system (used when user picks Auto)
  const handleThemeChange = (value) => {
    setTheme(value);
  };

  const features = [
    {
      title: "Verified Listings",
      desc: "Photos, restoration notes & history for every listing.",
    },
    {
      title: "Secure Contacts",
      desc: "Message listers securely and coordinate pickup or delivery.",
    },
    {
      title: "Category Browsing",
      desc: "Find goods by type, age or restoration condition.",
    },
    {
      title: "Item Management",
      desc: "Edit listings, add restoration notes and manage availability.",
    },
  ];

  return (
    <div className="about-root">
      {/* STYLE: self-contained soft-pastel theme + dark override + responsive layout */}
      <style>{`
        /* Soft Pastel Theme variables (light) */
        :root {
          --bg: #F8FAFC;
          --surface: #FFFFFF;
          --muted: #E6EEF6;
          --primary: #A78BFA;
          --primary-600: #8B5CF6;
          --accent: #FBCFE8;
          --warm: #FDE68A;
          --text: #334155;
          --subtext: #64748B;
          --border: #E2E8F0;
          --shadow: 0 10px 25px rgba(16,24,40,0.06);
          --radius: 12px;
          --container: 1100px;
          --maxWidth: 1200px;
        }

        /* Dark override when system prefers dark */
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #071122;
            --surface: rgba(255,255,255,0.03);
            --muted: rgba(167,139,250,0.06);
            --primary: #C4B5FD;
            --primary-600: #A78BFA;
            --accent: #FBCFE8;
            --warm: #FDE68A;
            --text: #E6EEF6;
            --subtext: #94A3B8;
            --border: rgba(255,255,255,0.06);
            --shadow: 0 8px 20px rgba(2,6,23,0.6);
          }
        }

        /* Explicit overrides if user forced theme in-page */
        .theme-dark {
          --bg: #071122;
          --surface: rgba(255,255,255,0.03);
          --muted: rgba(167,139,250,0.06);
          --primary: #C4B5FD;
          --primary-600: #A78BFA;
          --accent: #FBCFE8;
          --warm: #FDE68A;
          --text: #E6EEF6;
          --subtext: #94A3B8;
          --border: rgba(255,255,255,0.06);
          --shadow: 0 8px 20px rgba(2,6,23,0.6);
        }
        .theme-light {
          --bg: #F8FAFC;
          --surface: #FFFFFF;
          --muted: #E6EEF6;
          --primary: #A78BFA;
          --primary-600: #8B5CF6;
          --accent: #FBCFE8;
          --warm: #FDE68A;
          --text: #334155;
          --subtext: #64748B;
          --border: #E2E8F0;
          --shadow: 0 10px 25px rgba(16,24,40,0.06);
        }

        /* Reset + typography */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html,body,#root { height: 100%; background: var(--bg); color: var(--text); font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }

        /* Layout */
        .about-root { min-height: 100vh; display: flex; flex-direction: column; }
        main { flex: 1; }

        .container { max-width: var(--container); margin: 0 auto; padding: 28px; }

        /* HERO */
        .hero {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 28px;
          align-items: center;
          padding: 48px 0;
        }

        .hero-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.02));
          background-color: var(--surface);
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
          padding: 28px;
          border-radius: var(--radius);
        }

        .hero h1 {
          font-size: 34px;
          line-height: 1.05;
          color: var(--primary);
          margin-bottom: 14px;
        }
        .hero p { color: var(--subtext); font-size: 16px; margin-bottom: 18px; }

        .actions { margin-top: 18px; display:flex; gap:10px; flex-wrap:wrap; }

        .btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          background: linear-gradient(90deg,var(--primary),var(--primary-600));
          color: white; padding:10px 16px; border-radius: 10px; font-weight:600; text-decoration:none;
          border: none; cursor:pointer;
        }
        .btn-ghost {
          background: transparent; border: 1px solid var(--border); color: var(--primary); padding:10px 14px; border-radius:10px; cursor:pointer;
        }

        /* right column: svg card */
        .hero-visual { display:flex; justify-content:center; align-items:center; gap:12px; }
        .stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:14px; }

        .stat {
          background: var(--surface); border:1px solid var(--border); padding:12px; border-radius:10px; text-align:center;
        }
        .stat .v { font-weight:700; color:var(--primary); font-size:18px; }

        /* 3-column mission grid */
        .grid-3 { display:grid; grid-template-columns: repeat(3,1fr); gap:18px; margin: 20px 0; }
        .card { background: var(--surface); border:1px solid var(--border); padding:20px; border-radius:10px; box-shadow: var(--shadow); color:var(--subtext); }
        .card h3 { color:var(--primary); margin-bottom:8px; }

        /* features area */
        .features { display:grid; grid-template-columns: repeat(4,1fr); gap:14px; margin-top: 12px; }
        .feature { background: linear-gradient(180deg, rgba(167,139,250,0.06), transparent); border-radius:10px; padding:14px; border:1px solid var(--border); }
        .feature h4 { color:var(--primary); margin-bottom:6px; }
        .feature p { color:var(--subtext); font-size:14px; }

        /* CTA */
        .cta { text-align:center; padding:28px 0; }
        .cta .links { display:inline-flex; gap:12px; margin-top:12px; }

        /* FAQ */
        .faq { max-width:800px; margin: 0 auto; padding-bottom: 40px; }
        details { background: var(--surface); border:1px solid var(--border); padding:12px; border-radius:8px; }
        summary { cursor:pointer; font-weight:600; color:var(--primary); }

        /* small helpers */
        .muted { color:var(--subtext); }

        /* responsive */
        @media (max-width: 960px) {
          .hero { grid-template-columns: 1fr; }
          .features { grid-template-columns: repeat(2,1fr); }
          .grid-3 { grid-template-columns: 1fr; }
        }
        @media (max-width: 520px) {
          .features { grid-template-columns: 1fr; }
        }

        /* theme selector control */
        .theme-control { display:inline-flex; gap:8px; align-items:center; background:var(--surface); border:1px solid var(--border); padding:6px; border-radius:8px; }
        .theme-select { background: transparent; border: none; color: var(--text); font-weight:600; padding:6px; }
      `}</style>

      <Header />

      <main>
        <div className="container">
          {/* theme selector (Auto | Light | Dark) */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 10,
            }}
          >
            <div className="theme-control" aria-hidden={false}>
              <label style={{ fontSize: 13, color: "var(--subtext)" }}>
                Theme
              </label>
              <select
                className="theme-select"
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
                aria-label="Theme selector"
              >
                <option value="system">Auto (system)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          {/* HERO */}
          <section className="hero">
            <div className="hero-card">
              <h1>Restore Hub — breathe new life into treasured items</h1>
              <p>
                Restore Hub is a community-driven marketplace connecting
                craftsmen, collectors and buyers. We celebrate restoration,
                transparency, and sustainability — so every item tells a story.
              </p>

              <div className="actions">
                <a href="/items" className="btn-primary" role="button">
                  Browse Items
                </a>
                <a href="/contact" className="btn-ghost" role="button">
                  Contact Us
                </a>
              </div>

              <div className="grid-3" style={{ marginTop: 18 }}>
                <div className="card">
                  <h3>Our Mission</h3>
                  <p className="muted">
                    To empower communities and craftsmen by providing a trusted
                    platform to restore, document and trade renewed goods with
                    dignity and clarity.
                  </p>
                </div>

                <div className="card">
                  <h3>What We Value</h3>
                  <ul className="muted" style={{ marginTop: 8 }}>
                    <li>✔ Quality restoration and truthful listings</li>
                    <li>✔ Fair pricing and transparent history</li>
                    <li>✔ Responsible reuse and sustainability</li>
                  </ul>
                </div>

                <div className="card">
                  <h3>How It Works</h3>
                  <ol className="muted" style={{ marginTop: 8 }}>
                    <li>
                      Restore or prepare an item with clear photos and
                      descriptions.
                    </li>
                    <li>
                      List the item on the platform with price & condition
                      details.
                    </li>
                    <li>
                      Buyers contact the lister or purchase through the
                      platform.
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              {/* Inline decorative SVG (self-contained) */}
              <div style={{ width: 420 }}>
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 18,
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <svg
                    viewBox="0 0 160 120"
                    width="100%"
                    height="160"
                    aria-hidden
                  >
                    <defs>
                      <linearGradient id="g1" x1="0" x2="1">
                        <stop
                          offset="0"
                          stopColor="var(--accent)"
                          stopOpacity="0.9"
                        />
                        <stop
                          offset="1"
                          stopColor="var(--primary)"
                          stopOpacity="0.8"
                        />
                      </linearGradient>
                    </defs>
                    <rect
                      x="6"
                      y="26"
                      rx="8"
                      ry="8"
                      width="148"
                      height="88"
                      fill="url(#g1)"
                      opacity="0.18"
                    />
                    <g
                      transform="translate(18,18)"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    >
                      <path d="M12 70 L12 46 L36 34 L76 34 L100 46 L100 70" />
                      <path d="M22 20 L90 20" strokeLinecap="round" />
                      <path d="M36 34 v-8 a8 8 0 0 1 8 -8 h12 a8 8 0 0 1 8 8 v8" />
                      <circle cx="60" cy="52" r="3" fill="var(--primary)" />
                    </g>
                  </svg>

                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <div className="stat">
                      <div style={{ fontSize: 12, color: "var(--subtext)" }}>
                        Avg. Rating
                      </div>
                      <div className="v">4.8 / 5</div>
                    </div>
                    <div className="stat">
                      <div style={{ fontSize: 12, color: "var(--subtext)" }}>
                        Active Listings
                      </div>
                      <div className="v">1.2k+</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section style={{ padding: "10px 0" }}>
            <div
              style={{
                borderRadius: 12,
                padding: 14,
                background:
                  "linear-gradient(180deg, rgba(251,207,232,0.3), transparent)",
              }}
            >
              <h2
                style={{
                  textAlign: "center",
                  color: "var(--primary)",
                  marginBottom: 12,
                }}
              >
                Platform Highlights
              </h2>

              <div className="features">
                {features.map((f) => (
                  <div className="feature" key={f.title}>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="cta">
            <div>
              <h3 style={{ color: "var(--primary)" }}>Get in touch</h3>
              <p className="muted" style={{ marginTop: 8 }}>
                If you have restoration stories or partnership ideas, we'd love
                to hear from you.
              </p>

              <div className="links" style={{ marginTop: 14 }}>
                <a href="/contact" className="btn-primary">
                  Contact Us
                </a>
                <a href="/items" className="btn-ghost">
                  Browse Items
                </a>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="faq">
            <h4
              style={{
                color: "var(--primary)",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Frequently asked questions
            </h4>

            <div style={{ display: "grid", gap: 10 }}>
              <details>
                <summary>How are items verified?</summary>
                <div style={{ marginTop: 8 }}>
                  Sellers provide photos and restoration notes. Admins may
                  review listings for quality and accuracy.
                </div>
              </details>

              <details>
                <summary>How do I contact a lister?</summary>
                <div style={{ marginTop: 8 }}>
                  Open the item details and click "Contact" to message the
                  lister directly.
                </div>
              </details>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
