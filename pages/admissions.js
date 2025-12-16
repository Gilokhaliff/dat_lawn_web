import Head from "next/head";
import Link from "next/link";
import RegistrationForm from "../components/RegistrationForm";
import { useRouter } from "next/router";

export default function Admissions() {
  const { locale } = useRouter();
  const isFr = locale === "fr";

  return (
    <>
      <Head>
        <title>La Gracieuse | {isFr ? "Admissions" : "Admissions"}</title>
        <meta
          name="description"
          content={
            isFr
              ? "Admissions et inscription pour le Groupe scolaire bilingue La Gracieuse. En ligne ou sur place."
              : "Admissions and registration for Groupe scolaire bilingue La Gracieuse. Apply online or on-site."
          }
        />
      </Head>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">{isFr ? "Accueil" : "Home"}</Link> / {isFr ? "Admissions" : "Admissions"}
          </div>
          <h1>{isFr ? "Admissions et inscription" : "Admissions & Registration"}</h1>
          <p>
            {isFr
              ? "Suivez les trois étapes ci-dessous. Inscrivez-vous en ligne ou passez à notre bureau, comme vous préférez."
              : "Complete the three steps below. Apply online or visit our school office—whichever you prefer."}
          </p>
        </div>
      </section>

      <section>
        <div className="container grid grid-3">
          <div className="card hero-bubble">
            <h3>{isFr ? "Étape 1" : "Step 1"}</h3>
            <p className="muted">{isFr ? "Choisissez un parcours : francophone ou anglophone." : "Choose a stream: Francophone or Anglophone."}</p>
          </div>
          <div className="card hero-bubble">
            <h3>{isFr ? "Étape 2" : "Step 2"}</h3>
            <p className="muted">{isFr ? "Choisissez une classe : Maternelle 1–2 ou Primaire 1–6." : "Pick a class: Nursery 1–2 or Primary 1–6."}</p>
          </div>
          <div className="card hero-bubble">
            <h3>{isFr ? "Étape 3" : "Step 3"}</h3>
            <p className="muted">
              {isFr ? "Envoyez le formulaire en ligne ou inscrivez-vous en personne au bureau." : "Submit the online form or register in person at the office."}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="container grid grid-2">
          <div className="card glass">
            <h2>{isFr ? "Inscription sur place" : "On-site registration"}</h2>
            <p className="muted">
              {isFr
                ? "Vous pouvez aussi vous inscrire directement au bureau de l'école. À apporter : acte de naissance, bulletin précédent (si applicable), deux photos passeport."
                : "You can also register directly at our school office. Bring: birth certificate, previous report (if applicable), two passport photos."}
            </p>
            <p className="muted">
              {isFr ? "Adresse : BP 123, Main Avenue, City Center" : "Address: BP 123, Main Avenue, City Center"}
              <br />
              {isFr ? "Heures : Lun–Ven 8:00–16:00" : "Office hours: Mon–Fri 8:00–16:00"}
            </p>
            <p className="muted">
              {isFr ? "Téléphone / WhatsApp : " : "Phone / WhatsApp: "} <strong>+237 650 000 111</strong>
              <br />
              Email: <strong>contact@lagracieuse.edu</strong>
            </p>
            <div className="link-row">
              <a className="btn btn-accent" href="https://www.google.com/maps" target="_blank" rel="noreferrer">
                {isFr ? "Itinéraire" : "Get directions"}
              </a>
              <a className="btn btn-ghost" href="tel:+237650000111">
                {isFr ? "Appeler" : "Call now"}
              </a>
            </div>
          </div>
          <div className="card">
            <h2>{isFr ? "Formulaire d'inscription en ligne" : "Online registration form"}</h2>
            <RegistrationForm />
          </div>
        </div>
      </section>
    </>
  );
}
