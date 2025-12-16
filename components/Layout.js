import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import logoImg from "../public/logo.png";

const navItems = (isFr) => [
  { href: "/", label: isFr ? "Accueil" : "Home" },
  { href: "/about", label: isFr ? "Aperçu" : "About" },
  { href: "/programs", label: isFr ? "Programmes" : "Programs" },
  { href: "/admissions", label: isFr ? "Admissions" : "Admissions" },
  { href: "/calendar", label: isFr ? "Calendrier" : "Calendar" },
  { href: "/fees", label: isFr ? "Frais" : "Fees" },
  { href: "/gallery", label: isFr ? "Galerie" : "Gallery" },
  { href: "/contact", label: isFr ? "Contact" : "Contact" },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isFr = router.locale === "fr";

  const handleLocaleToggle = () => {
    const nextLocale = isFr ? "en" : "fr";
    router.push(router.pathname, router.asPath, { locale: nextLocale });
    setOpen(false);
  };

  return (
    <>
      <header>
        <div className="container nav-bar">
          <div className="brand">
            <div className="mark" aria-hidden="true">
              <Image src={logoImg} alt="La Gracieuse logo" width={128} height={128} quality={100} priority className="logo-img" />
            </div>
            <div className="brand-text">
              {isFr ? "Groupe Scolaire Bilingue La Gracieuse" : "La Gracieuse Nursery and Primary Bilingual School"}
            </div>
          </div>
          <button className="nav-toggle" aria-label="Toggle navigation" onClick={() => setOpen((o) => !o)}>
            {isFr ? "Menu" : "Menu"}
          </button>
          <nav>
            <ul id="navLinks" className={open ? "open" : ""}>
              {navItems(isFr).map((item) => (
                <li key={item.href} onClick={() => setOpen(false)}>
                  <Link
                    href={item.href}
                    className={router.pathname.startsWith(item.href) && item.href !== "/" ? "nav-active" : router.pathname === item.href ? "nav-active" : ""}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <button
            className={`lang-toggle ${isFr ? "lang-fr" : "lang-en"}`}
            onClick={handleLocaleToggle}
            aria-label="Toggle language"
          >
            <span className={!isFr ? "active-lang" : ""}>EN</span> / <span className={isFr ? "active-lang" : ""}>FR</span>
          </button>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <div className="container">
          <div className="grid grid-3">
            <div>
              <div className="brand footer-brand">
                <div className="mark" aria-hidden="true">
                  <Image src={logoImg} alt="La Gracieuse logo" width={72} height={72} quality={100} className="logo-img" />
                </div>
                <div className="brand-text footer-brand-text">
                  {isFr ? "Groupe Scolaire Bilingue La Gracieuse" : "La Gracieuse Nursery and Primary Bilingual School"}
                </div>
              </div>
              <p>{isFr ? "Apprentissages sûrs, bilingues et joyeux pour la Maternelle et le Primaire." : "Safe, bilingual, and joyful learning for Nursery and Primary pupils."}</p>
            </div>
            <div>
              <strong>{isFr ? "Visiter" : "Visit"}</strong>
              <p>
                BP 123, Main Avenue, City Center
                <br />
                {isFr ? "Heures de bureau : Lun–Ven 8h00–16h00" : "Office hours: Mon–Fri 8:00–16:00"}
              </p>
            </div>
            <div>
              <strong>Contact</strong>
              <p>
                {isFr ? "Téléphone / WhatsApp : +237 650 000 111" : "Phone / WhatsApp: +237 650 000 111"}
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
