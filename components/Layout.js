import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/admissions", label: "Admissions" },
  { href: "/calendar", label: "Calendar" },
  { href: "/fees", label: "Fees" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <header>
        <div className="container nav-bar">
          <div className="brand">
            <div className="mark">LG</div>
            <div>
              <div>La Gracieuse</div>
              <small style={{ color: "var(--muted)", fontWeight: 600 }}>
                Bilingual Nursery &amp; Primary
              </small>
            </div>
          </div>
          <button className="nav-toggle" aria-label="Toggle navigation" onClick={() => setOpen((o) => !o)}>
            Menu
          </button>
          <nav>
            <ul id="navLinks" className={open ? "open" : ""}>
              {navItems.map((item) => (
                <li key={item.href} onClick={() => setOpen(false)}>
                  <Link
                    href={item.href}
                    className={router.pathname.startsWith(item.href) && item.href !== "/" ? "nav-active" : router.pathname === item.href ? "nav-active" : ""}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li onClick={() => setOpen(false)}>
                <Link className="btn btn-primary cta" href="/admissions">
                  Choose your path
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <div className="container">
          <div className="grid grid-3">
            <div>
              <div className="brand">
                <div className="mark">LG</div>
                <div>La Gracieuse</div>
              </div>
              <p>Safe, bilingual, and joyful learning for Nursery and Primary pupils.</p>
            </div>
            <div>
              <strong>Visit</strong>
              <p>
                BP 123, Main Avenue, City Center
                <br />
                Office hours: Mon–Fri 8:00–16:00
              </p>
            </div>
            <div>
              <strong>Contact</strong>
              <p>
                Phone / WhatsApp: +237 650 000 111
                <br />
                Email: contact@lagracieuse.edu
              </p>
              <div className="link-row">
                <a href="https://wa.me/237650000111" target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
                <a href="tel:+237650000111">Call</a>
                <a href="mailto:contact@lagracieuse.edu">Email</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
