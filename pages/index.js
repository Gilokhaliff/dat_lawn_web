import Head from "next/head";
import Link from "next/link";
import ContactForm from "../components/ContactForm";
import Image from "next/image";
import headerImg from "../public/header.png";
import { calendarData, levelLabels } from "../lib/data";
import { useRouter } from "next/router";

export default function Home() {
  const { locale } = useRouter();
  const isFr = locale === "fr";

  return (
    <>
      <Head>
        <title>La Gracieuse | {isFr ? "Accueil" : "Home"}</title>
        <meta
          name="description"
          content={
            isFr
              ? "Groupe scolaire bilingue La Gracieuse – école maternelle et primaire bilingue, moderne, sûre et ouverte."
              : "Groupe scolaire bilingue La Gracieuse – bilingual nursery and primary school with a modern, safe, and multicultural environment."
          }
        />
      </Head>

      <section className="hero" id="home">
        <div className="container hero-landing">
          <div className="hero-content">
            <div className="kicker">{isFr ? "Bienvenue" : "Welcome"}</div>
            <h1 className="headline">
              {isFr ? "Bienvenue à La Gracieuse Primary School" : "Welcome to La Gracieuse Primary School"}
            </h1>
            <p className="lead">{isFr ? "Là où les jeunes esprits grandissent avec soin et confiance." : "Where young minds grow with care and confidence."}</p>
            <div className="hero-buttons" style={{ marginTop: "1.4rem" }}>
              <Link className="btn btn-primary" href="/about">
                {isFr ? "En savoir plus" : "Learn More"}
              </Link>
              <Link className="btn btn-outline" href="/admissions">
                {isFr ? "S'inscrire" : "Register Now"}
              </Link>
            </div>
          </div>
          <div className="hero-photo">
            <Image
              src={headerImg}
              alt="Smiling primary school children in Cameroon classroom"
              fill
              className="hero-img"
              priority
            />
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">{isFr ? "Pourquoi nous choisir" : "Why families choose us"}</div>
              <h2>{isFr ? "Des classes chaleureuses, un bilinguisme assumé" : "Warm classrooms, bilingual growth, trusted safety"}</h2>
            </div>
            <Link className="btn btn-ghost" href="/programs">
              {isFr ? "Voir les programmes" : "See programs"}
            </Link>
          </div>
          <div className="grid stats">
            <div className="stat">
              <strong>{isFr ? "Parcours bilingues" : "Bilingual streams"}</strong>
              <span>{isFr ? "Enseignants francophones et anglophones" : "Francophone &amp; Anglophone teachers"}</span>
            </div>
            <div className="stat">
              <strong>{isFr ? "Maternelle 1–2 et Primaire 1–6" : "Nursery 1–2 &amp; Class 1 – Class 6"}</strong>
              <span>{isFr ? "Petits groupes, apprentissage actif" : "Small groups, active learning"}</span>
            </div>
            <div className="stat">
              <strong>{isFr ? "Sur place &amp; en ligne" : "On-site &amp; online"}</strong>
              <span>{isFr ? "Inscrivez votre enfant comme vous préférez" : "Register your child the way you prefer"}</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">{isFr ? "Programmes" : "Programs"}</div>
              <h2>{isFr ? "Parcours francophone et anglophone, de la Maternelle au CM2" : "Francophone and Anglophone streams, Nursery to Primary 6"}</h2>
            </div>
            <Link className="btn btn-primary" href="/programs">
              {isFr ? "Explorer les programmes" : "Explore all programs"}
            </Link>
          </div>
          <div className="grid grid-2">
            <div className="card glass">
              <div className="badge">{isFr ? "Parcours francophone" : "Francophone Stream"}</div>
              <p className="muted">
                {isFr
                  ? "Lecture/écriture en français, mathématiques, sciences, éducation civique, arts et sport."
                  : "French literacy, mathematics, science, civic education, arts, and sports."}
              </p>
              <Link className="btn btn-primary" href={{ pathname: "/admissions", query: { stream: "Francophone" } }}>
                {isFr ? "Commencer l'inscription" : "Start Application"}
              </Link>
            </div>
            <div className="card glass">
              <div className="badge">{isFr ? "Parcours anglophone" : "Anglophone Stream"}</div>
              <p className="muted">
                {isFr
                  ? "Lecture/écriture en anglais, mathématiques, sciences, sciences sociales, arts, bases du code."
                  : "English literacy, mathematics, science, social studies, arts, coding basics."}
              </p>
              <Link className="btn btn-primary" href={{ pathname: "/admissions", query: { stream: "Anglophone" } }}>
                {isFr ? "Commencer l'inscription" : "Start Application"}
              </Link>
            </div>
          </div>
          <div className="level-chips" style={{ marginTop: "0.5rem" }}>
            {levelLabels.map((level) => (
              <span className="level" key={level}>
                {level}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">{isFr ? "Admissions" : "Admissions"}</div>
              <h2>{isFr ? "Inscription en ligne ou sur place en trois étapes" : "Apply online or register on-site in three steps"}</h2>
              <p>
                {isFr
                  ? "Choisissez un parcours, une classe et soumettez le formulaire — ou passez au bureau entre 8h00 et 16h00."
                  : "Pick a stream, choose a class, and submit the form—or visit our office between 8:00–16:00."}
              </p>
            </div>
            <Link className="btn btn-accent" href="/admissions">
              {isFr ? "Commencer l'inscription" : "Start registration"}
            </Link>
          </div>
          <div className="grid grid-3">
            <div className="card hero-bubble">
              <h3>{isFr ? "Étape 1" : "Step 1"}</h3>
              <p className="muted">{isFr ? "Choisissez le parcours francophone ou anglophone." : "Choose Francophone or Anglophone."}</p>
            </div>
            <div className="card hero-bubble">
              <h3>{isFr ? "Étape 2" : "Step 2"}</h3>
              <p className="muted">{isFr ? "Sélectionnez Maternelle 1–2 ou Primaire 1–6." : "Select Nursery 1–2 or Primary 1–6."}</p>
            </div>
            <div className="card hero-bubble">
              <h3>{isFr ? "Étape 3" : "Step 3"}</h3>
              <p className="muted">
                {isFr ? "Soumettez en ligne ou passez à BP 123, Main Avenue, City Center." : "Submit online or visit BP 123, Main Avenue, City Center."}
              </p>
            </div>
          </div>
          <div className="banner" style={{ marginTop: "1rem" }}>
            <strong>{isFr ? "Inscription sur place :" : "On-site registration:"}</strong>{" "}
            {isFr ? "Heures de bureau Lun–Ven 8h00–16h00. Téléphone / WhatsApp : +237 650 000 111." : "Office hours Mon–Fri 8:00–16:00. Phone / WhatsApp: +237 650 000 111."}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">{isFr ? "Aperçu du calendrier" : "Calendar snapshot"}</div>
              <h2>{isFr ? "Gardez une longueur d'avance sur les dates clés" : "Stay ahead of key dates"}</h2>
            </div>
            <Link className="btn btn-ghost" href="/calendar">
              {isFr ? "Voir le calendrier complet" : "View full calendar"}
            </Link>
          </div>
          <div className="grid grid-2">
            <div className="card glass">
              <h3>{isFr ? "À venir" : "Upcoming highlights"}</h3>
              <div className="timeline" id="timeline">
                {calendarData.slice(0, 4).map((item) => (
                  <div className="timeline-item" key={item.title}>
                    <strong>{item.title}</strong>
                    <div className="muted">{item.date}</div>
                    <div>{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3>{isFr ? "Besoin de la liste complète ?" : "Need the full list?"}</h3>
              <p className="muted">
                {isFr ? "Les bulletins, congés et dates des trimestres sont détaillés sur la page Calendrier." : "Report card days, holidays, and term dates are available in detail on the Calendar page."}
              </p>
              <Link className="btn btn-primary" href="/calendar">
                {isFr ? "Ouvrir le calendrier" : "Open calendar"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">Contact</div>
              <h2>{isFr ? "Nous sommes là pour vous guider" : "We’re here to guide your family"}</h2>
              <p>
                {isFr
                  ? "Appelez, envoyez un message WhatsApp, un email ou passez au bureau. Réponse sous un jour ouvrable."
                  : "Call, WhatsApp, email, or drop by the office. Expect a response within one business day."}
              </p>
            </div>
            <div className="link-row">
              <a className="btn btn-primary" href="tel:+237650000111">
                {isFr ? "Appeler" : "Call now"}
              </a>
              <a className="btn btn-ghost" href="https://wa.me/237650000111" target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </div>
          </div>
          <div className="grid grid-2">
            <div className="card glass">
              <h3>{isFr ? "Visitez-nous" : "Visit us"}</h3>
              <p className="muted">
                Yassa Entrée Delangué, à 800m du stade Japoma,, Douala, Cameroon
                <br />
                {isFr ? "Heures de bureau : Lun–Ven 8h00–16h00" : "Office hours: Mon–Fri 8:00–16:00"}
              </p>
              <p className="muted">
                {isFr ? "Téléphone / WhatsApp : " : "Phone / WhatsApp: "} <strong>+237 650 000 111</strong>
                <br />
                Email: <strong>contact@lagracieuse.edu</strong>
              </p>
              <Link className="btn btn-accent" href="/admissions">
                {isFr ? "S'inscrire" : "Register now"}
              </Link>
            </div>
            <div className="card">
              <h3>{isFr ? "Envoyer un message" : "Quick message"}</h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
