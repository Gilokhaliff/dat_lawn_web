import Head from "next/head";
import Link from "next/link";
import { levelLabels } from "../lib/data";

export default function Programs() {
  return (
    <>
      <Head>
        <title>La Gracieuse | Programs</title>
        <meta name="description" content="Programs and bilingual streams at Groupe scolaire bilingue La Gracieuse." />
      </Head>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / Programs
          </div>
          <h1>Bilingual programs &amp; streams</h1>
          <p>Choose Francophone or Anglophone pathways across Nursery 1–2 and Primary 1–6.</p>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">Streams</div>
              <h2>Francophone and Anglophone pathways</h2>
              <p>Balanced curricula with core subjects, enrichment, and caring native-speaking teachers.</p>
            </div>
            <Link className="btn btn-accent" href="/admissions">
              Start registration
            </Link>
          </div>
          <div className="grid grid-2">
            <div className="card glass">
              <div className="badge">Francophone Stream</div>
              <ul className="list">
                <li>French language foundations and literacy</li>
                <li>Mathematics, science, civic education</li>
                <li>Creative arts, sports, and project work</li>
              </ul>
              <Link className="btn btn-primary" href={{ pathname: "/admissions", query: { stream: "Francophone" } }}>
                Start Application
              </Link>
            </div>
            <div className="card glass">
              <div className="badge">Anglophone Stream</div>
              <ul className="list">
                <li>English literacy, reading, and writing</li>
                <li>Mathematics, science, social studies</li>
                <li>Arts, coding basics, and sports</li>
              </ul>
              <Link className="btn btn-primary" href={{ pathname: "/admissions", query: { stream: "Anglophone" } }}>
                Start Application
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">Levels</div>
              <h2>Classes available</h2>
              <p>Nursery to Primary with age-appropriate activities, bilingual exposure, and safe routines.</p>
            </div>
          </div>
          <div className="grid grid-3">
            <div className="card hero-bubble">
              <h3>Nursery 1</h3>
              <p className="muted">Early socialization, pre-literacy, motor skills, songs, and play-based learning.</p>
            </div>
            <div className="card hero-bubble">
              <h3>Nursery 2</h3>
              <p className="muted">Vocabulary growth, number sense, creative arts, and story time in two languages.</p>
            </div>
            <div className="card hero-bubble">
              <h3>Primary 1–6</h3>
              <p className="muted">Core subjects with bilingual reinforcement, projects, sports, and civic engagement.</p>
            </div>
          </div>
          <div className="level-chips" style={{ marginTop: "0.75rem" }}>
            {levelLabels.map((level) => (
              <span className="level" key={level}>
                {level}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container card glass">
          <div className="grid grid-2">
            <div>
              <h2>Bilingual identity</h2>
              <p className="muted">
                Morning routines, class projects, and assemblies are designed to use both English and French, building confidence in
                listening, speaking, reading, and writing.
              </p>
              <ul className="list">
                <li>Weekly reading circles in both languages</li>
                <li>Small group tutoring for literacy and numeracy</li>
                <li>Clubs: arts, sports, and beginner coding</li>
              </ul>
            </div>
            <div className="hero-card">
              <h3>Ready to enroll?</h3>
              <p>Start an application online or plan an in-person visit with our office team.</p>
              <div className="link-row">
                <Link className="btn btn-accent" href="/admissions">
                  Start registration
                </Link>
                <Link className="btn btn-ghost" href="/contact">
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
