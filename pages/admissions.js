import Head from "next/head";
import Link from "next/link";
import RegistrationForm from "../components/RegistrationForm";

export default function Admissions() {
  return (
    <>
      <Head>
        <title>La Gracieuse | Admissions</title>
        <meta
          name="description"
          content="Admissions and registration for Groupe scolaire bilingue La Gracieuse. Apply online or on-site."
        />
      </Head>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / Admissions
          </div>
          <h1>Admissions &amp; Registration</h1>
          <p>Complete the three steps below. Apply online or visit our school office—whichever you prefer.</p>
        </div>
      </section>

      <section>
        <div className="container grid grid-3">
          <div className="card hero-bubble">
            <h3>Step 1</h3>
            <p className="muted">Choose a stream: Francophone or Anglophone.</p>
          </div>
          <div className="card hero-bubble">
            <h3>Step 2</h3>
            <p className="muted">Pick a class: Nursery 1–2 or Primary 1–6.</p>
          </div>
          <div className="card hero-bubble">
            <h3>Step 3</h3>
            <p className="muted">Submit the online form or register in person at the office.</p>
          </div>
        </div>
      </section>

      <section>
        <div className="container grid grid-2">
          <div className="card glass">
            <h2>On-site registration</h2>
            <p className="muted">
              You can also register directly at our school office. Bring: birth certificate, previous report (if applicable), two
              passport photos.
            </p>
            <p className="muted">
              Address: BP 123, Main Avenue, City Center
              <br />
              Office hours: Mon–Fri 8:00–16:00
            </p>
            <p className="muted">
              Phone / WhatsApp: <strong>+237 650 000 111</strong>
              <br />
              Email: <strong>contact@lagracieuse.edu</strong>
            </p>
            <div className="link-row">
              <a className="btn btn-accent" href="https://www.google.com/maps" target="_blank" rel="noreferrer">
                Get directions
              </a>
              <a className="btn btn-ghost" href="tel:+237650000111">
                Call now
              </a>
            </div>
          </div>
          <div className="card">
            <h2>Online registration form</h2>
            <RegistrationForm />
          </div>
        </div>
      </section>
    </>
  );
}
