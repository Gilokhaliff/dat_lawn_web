import Head from "next/head";
import Link from "next/link";
import ContactForm from "../components/ContactForm";
import Image from "next/image";
import headerImg from "../public/header.png";
import { calendarData, levelLabels } from "../lib/data";

export default function Home() {
  return (
    <>
      <Head>
        <title>La Gracieuse | Home</title>
        <meta
          name="description"
          content="Groupe scolaire bilingue La Gracieuse – bilingual nursery and primary school with a modern, safe, and multicultural environment."
        />
      </Head>

      <section className="hero" id="home">
        <div className="container hero-landing">
          <div className="hero-content">
            <div className="kicker">Welcome</div>
            <h1 className="headline">Welcome to La Gracieuse Primary School</h1>
            <p className="lead">Where young minds grow with care and confidence.</p>
            <div className="hero-buttons" style={{ marginTop: "1.4rem" }}>
              <Link className="btn btn-primary" href="/about">
                Learn More
              </Link>
              <Link className="btn btn-outline" href="/admissions">
                Register Now
              </Link>
            </div>
          </div>
          <div className="hero-photo">
            <Image
              src={headerImg}
              alt="Smiling primary school children in Cameroon classroom"
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">Why families choose us</div>
              <h2>Warm classrooms, bilingual growth, trusted safety</h2>
            </div>
            <Link className="btn btn-ghost" href="/programs">
              See programs
            </Link>
          </div>
          <div className="grid stats">
            <div className="stat">
              <strong>Bilingual streams</strong>
              <span>Francophone &amp; Anglophone teachers</span>
            </div>
            <div className="stat">
              <strong>Nursery 1–2 &amp; Class 1 – Class 6</strong>
              <span>Small groups, active learning</span>
            </div>
            <div className="stat">
              <strong>On-site &amp; online</strong>
              <span>Register your child the way you prefer</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">Programs</div>
              <h2>Francophone and Anglophone streams, Nursery to Primary 6</h2>
            </div>
            <Link className="btn btn-primary" href="/programs">
              Explore all programs
            </Link>
          </div>
          <div className="grid grid-2">
            <div className="card glass">
              <div className="badge">Francophone Stream</div>
              <p className="muted">French literacy, mathematics, science, civic education, arts, and sports.</p>
              <Link className="btn btn-primary" href={{ pathname: "/admissions", query: { stream: "Francophone" } }}>
                Start Application
              </Link>
            </div>
            <div className="card glass">
              <div className="badge">Anglophone Stream</div>
              <p className="muted">English literacy, mathematics, science, social studies, arts, coding basics.</p>
              <Link className="btn btn-primary" href={{ pathname: "/admissions", query: { stream: "Anglophone" } }}>
                Start Application
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
              <div className="pill">Admissions</div>
              <h2>Apply online or register on-site in three steps</h2>
              <p>Pick a stream, choose a class, and submit the form—or visit our office between 8:00–16:00.</p>
            </div>
            <Link className="btn btn-accent" href="/admissions">
              Start registration
            </Link>
          </div>
          <div className="grid grid-3">
            <div className="card hero-bubble">
              <h3>Step 1</h3>
              <p className="muted">Choose Francophone or Anglophone.</p>
            </div>
            <div className="card hero-bubble">
              <h3>Step 2</h3>
              <p className="muted">Select Nursery 1–2 or Primary 1–6.</p>
            </div>
            <div className="card hero-bubble">
              <h3>Step 3</h3>
              <p className="muted">Submit online or visit BP 123, Main Avenue, City Center.</p>
            </div>
          </div>
          <div className="banner" style={{ marginTop: "1rem" }}>
            <strong>On-site registration:</strong> Office hours Mon–Fri 8:00–16:00. Phone / WhatsApp: +237 650 000 111.
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">Calendar snapshot</div>
              <h2>Stay ahead of key dates</h2>
            </div>
            <Link className="btn btn-ghost" href="/calendar">
              View full calendar
            </Link>
          </div>
          <div className="grid grid-2">
            <div className="card glass">
              <h3>Upcoming highlights</h3>
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
              <h3>Need the full list?</h3>
              <p className="muted">Report card days, holidays, and term dates are available in detail on the Calendar page.</p>
              <Link className="btn btn-primary" href="/calendar">
                Open calendar
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
              <h2>We’re here to guide your family</h2>
              <p>Call, WhatsApp, email, or drop by the office. Expect a response within one business day.</p>
            </div>
            <div className="link-row">
              <a className="btn btn-primary" href="tel:+237650000111">
                Call now
              </a>
              <a className="btn btn-ghost" href="https://wa.me/237650000111" target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </div>
          </div>
          <div className="grid grid-2">
            <div className="card glass">
              <h3>Visit us</h3>
              <p className="muted">
                Yassa Entrée Delangué, à 800m du stade Japoma,, Douala, Cameroon
                <br />
                Office hours: Mon–Fri 8:00–16:00
              </p>
              <p className="muted">
                Phone / WhatsApp: <strong>+237 650 000 111</strong>
                <br />
                Email: <strong>contact@lagracieuse.edu</strong>
              </p>
              <Link className="btn btn-accent" href="/admissions">
                Register now
              </Link>
            </div>
            <div className="card">
              <h3>Quick message</h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
