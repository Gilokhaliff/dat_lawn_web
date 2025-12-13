import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import founderImg from "../public/founder.jpg";

export default function About() {
  return (
    <>
      <Head>
        <title>La Gracieuse | About</title>
        <meta
          name="description"
          content="About Groupe scolaire bilingue La Gracieuse – mission, history, facilities, and bilingual identity."
        />
      </Head>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / About
          </div>
          <h1>About La Gracieuse</h1>
          <p>Founded in 2015 by Tembi Pierre, our bilingual school welcomes families seeking a joyful, safe, and modern learning environment.</p>
        </div>
      </section>

      <section>
        <div className="container grid grid-2">
          <div className="card glass">
            <h2>History &amp; identity</h2>
            <div
              style={{
                margin: "0.75rem 0 1rem",
                padding: "0 50px",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <Image
                src={founderImg}
                alt="Founder of La Gracieuse"
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "420px",
                  objectFit: "contain",
                  objectPosition: "center",
                  borderRadius: "12px",
                }}
                sizes="(max-width: 768px) 100vw, 540px"
                priority
              />
            </div>
            <p className="lead">
              La Gracieuse opened in the heart of the city to provide balanced English-French immersion with caring educators.
            </p>
            <ul className="list">
              <li>Multicultural classrooms with native-speaking teachers</li>
              <li>Safe campus with bright rooms and supervised playgrounds</li>
              <li>Library, computer room, and creative arts spaces</li>
            </ul>
            <div className="note" style={{ marginTop: "0.75rem" }}>
              We celebrate curiosity, kindness, and confident communication in both languages.
            </div>
          </div>
          <div className="card">
            <h2>Mission &amp; values</h2>
            <div className="grid grid-2">
              <div>
                <div className="badge">Learning</div>
                <p className="muted">Hands-on activities, early literacy, and numeracy with caring guidance.</p>
              </div>
              <div>
                <div className="badge">Safety</div>
                <p className="muted">Child-safe spaces, supervised play, and trusted adults every day.</p>
              </div>
              <div>
                <div className="badge">Bilingualism</div>
                <p className="muted">Balanced immersion led by French and English teachers.</p>
              </div>
              <div>
                <div className="badge">Community</div>
                <p className="muted">Parents welcomed as partners with transparent communication.</p>
              </div>
            </div>
            <div className="link-row" style={{ marginTop: "0.5rem" }}>
              <Link className="btn btn-primary" href="/programs">
                Explore programs
              </Link>
              <Link className="btn btn-ghost" href="/admissions">
                Start registration
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">Facilities</div>
              <h2>Spaces designed for joyful learning</h2>
              <p>Bright classrooms, outdoor play areas, and a growing library support every child’s curiosity.</p>
            </div>
          </div>
          <div className="grid grid-3">
            <div className="card hero-bubble">
              <h3>Classrooms</h3>
              <p className="muted">Sunlit rooms with bilingual corners, reading nooks, and flexible seating.</p>
            </div>
            <div className="card hero-bubble">
              <h3>Playgrounds</h3>
              <p className="muted">Safe outdoor play with supervision, sports equipment, and green space.</p>
            </div>
            <div className="card hero-bubble">
              <h3>Library &amp; tech</h3>
              <p className="muted">Storytelling sessions, computer room for early tech skills, and creative labs.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container card glass">
          <div className="grid grid-2">
            <div>
              <h2>Visit us</h2>
              <p className="muted">
                BP 123, Main Avenue, City Center
                <br />
                Office hours: Mon–Fri 8:00–16:00
              </p>
              <p className="muted">
                Phone / WhatsApp: <strong>+237 650 000 111</strong>
                <br />
                Email: <strong>contact@lagracieuse.edu</strong>
              </p>
              <div className="link-row">
                <a className="btn btn-ghost" href="https://www.google.com/maps" target="_blank" rel="noreferrer">
                  Open map
                </a>
                <Link className="btn btn-accent" href="/admissions">
                  Register now
                </Link>
              </div>
            </div>
            <div>
              <h2>Map</h2>
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
          </div>
        </div>
      </section>
    </>
  );
}
