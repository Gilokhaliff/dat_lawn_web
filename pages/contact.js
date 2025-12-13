import Head from "next/head";
import Link from "next/link";
import ContactForm from "../components/ContactForm";

export default function Contact() {
  return (
    <>
      <Head>
        <title>La Gracieuse | Contact</title>
        <meta
          name="description"
          content="Contact Groupe scolaire bilingue La Gracieuse. Phone, WhatsApp, email, and visit information."
        />
      </Head>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / Contact
          </div>
          <h1>Contact us</h1>
          <p>Reach our team by phone, WhatsApp, email, or visit the office. We respond within one business day.</p>
        </div>
      </section>

      <section>
        <div className="container grid grid-2">
          <div className="card glass">
            <h2>School office</h2>
            <p className="muted">BP 123, Main Avenue, City Center</p>
            <p className="muted">Office hours: Mon–Fri 8:00–16:00</p>
            <p className="muted">
              Phone / WhatsApp: <strong>+237 650 000 111</strong>
            </p>
            <p className="muted">
              Email: <strong>contact@lagracieuse.edu</strong>
            </p>
            <div className="link-row">
              <a className="btn btn-primary" href="tel:+237650000111">
                Call now
              </a>
              <a className="btn btn-ghost" href="https://wa.me/237650000111" target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <Link className="btn btn-accent" href="/admissions">
                Register now
              </Link>
            </div>
          </div>
          <div className="card">
            <h2>Contact form</h2>
            <ContactForm />
          </div>
        </div>
      </section>

      <section>
        <div className="container card glass">
          <h2>Find us on Maps</h2>
          <div style={{ aspectRatio: "16 / 9", borderRadius: "14px", overflow: "hidden", background: "#e2e8f0" }}>
            <iframe
              title="School location"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2686.4134879785765!2d9.824807920591947!3d3.9928759598206933!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1061757308721a2f%3A0xf45dcc05b9ac6acd!2sGroupe%20Scolaire%20La%20Gracieuse!5e1!3m2!1sen!2sde!4v1764623333583!5m2!1sen!2sde"
            ></iframe>
          </div>
        </div>
      </section>
    </>
  );
}
