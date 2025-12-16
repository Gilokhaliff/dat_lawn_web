import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import founderImg from "../public/founder.jpg";
import { useRouter } from "next/router";

export default function About() {
  const { locale } = useRouter();
  const isFr = locale === "fr";

  return (
    <>
      <Head>
        <title>La Gracieuse | {isFr ? "À propos" : "About"}</title>
        <meta
          name="description"
          content={
            isFr
              ? "À propos du Groupe scolaire bilingue La Gracieuse – mission, histoire, infrastructures et identité bilingue."
              : "About Groupe scolaire bilingue La Gracieuse – mission, history, facilities, and bilingual identity."
          }
        />
      </Head>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">{isFr ? "Accueil" : "Home"}</Link> / {isFr ? "À propos" : "About"}
          </div>
          <h1>{isFr ? "À propos de La Gracieuse" : "About La Gracieuse"}</h1>
          <p>
            {isFr
              ? "Fondée en 2015 par Tembi Pierre, notre école bilingue accueille les familles en quête d’un environnement d’apprentissage joyeux, sûr et moderne."
              : "Founded in 2015 by Tembi Pierre, our bilingual school welcomes families seeking a joyful, safe, and modern learning environment."}
          </p>
        </div>
      </section>

      <section>
        <div className="container grid grid-2">
          <div className="card glass">
            <h2>{isFr ? "Histoire &amp; identité" : "History &amp; identity"}</h2>
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
              {isFr
                ? "La Gracieuse a ouvert au cœur de la ville pour offrir une immersion équilibrée anglais-français avec des enseignants bienveillants."
                : "La Gracieuse opened in the heart of the city to provide balanced English-French immersion with caring educators."}
            </p>
            <ul className="list">
              <li>{isFr ? "Classes multiculturelles avec enseignants natifs" : "Multicultural classrooms with native-speaking teachers"}</li>
              <li>{isFr ? "Campus sécurisé avec salles lumineuses et aires de jeux surveillées" : "Safe campus with bright rooms and supervised playgrounds"}</li>
              <li>{isFr ? "Bibliothèque, salle informatique et espaces créatifs" : "Library, computer room, and creative arts spaces"}</li>
            </ul>
            <div className="note" style={{ marginTop: "0.75rem" }}>
              {isFr
                ? "Nous célébrons la curiosité, la bienveillance et la communication assurée dans les deux langues."
                : "We celebrate curiosity, kindness, and confident communication in both languages."}
            </div>
          </div>
          <div className="card">
            <h2>{isFr ? "Mission &amp; valeurs" : "Mission &amp; values"}</h2>
            <div className="grid grid-2">
              <div>
                <div className="badge">{isFr ? "Apprentissage" : "Learning"}</div>
                <p className="muted">
                  {isFr ? "Activités pratiques, éveil à la lecture et au calcul avec un accompagnement bienveillant." : "Hands-on activities, early literacy, and numeracy with caring guidance."}
                </p>
              </div>
              <div>
                <div className="badge">{isFr ? "Sécurité" : "Safety"}</div>
                <p className="muted">
                  {isFr ? "Espaces adaptés aux enfants, jeux surveillés et adultes de confiance chaque jour." : "Child-safe spaces, supervised play, and trusted adults every day."}
                </p>
              </div>
              <div>
                <div className="badge">{isFr ? "Bilinguisme" : "Bilingualism"}</div>
                <p className="muted">
                  {isFr ? "Immersion équilibrée assurée par des enseignants francophones et anglophones." : "Balanced immersion led by French and English teachers."}
                </p>
              </div>
              <div>
                <div className="badge">{isFr ? "Communauté" : "Community"}</div>
                <p className="muted">
                  {isFr ? "Parents accueillis comme partenaires avec une communication transparente." : "Parents welcomed as partners with transparent communication."}
                </p>
              </div>
            </div>
            <div className="link-row" style={{ marginTop: "0.5rem" }}>
              <Link className="btn btn-primary" href="/programs">
                {isFr ? "Découvrir les programmes" : "Explore programs"}
              </Link>
              <Link className="btn btn-ghost" href="/admissions">
                {isFr ? "Commencer l'inscription" : "Start registration"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">{isFr ? "Infrastructures" : "Facilities"}</div>
              <h2>{isFr ? "Des espaces conçus pour un apprentissage joyeux" : "Spaces designed for joyful learning"}</h2>
              <p>
                {isFr
                  ? "Des salles lumineuses, des aires de jeux extérieures et une bibliothèque en développement soutiennent la curiosité de chaque enfant."
                  : "Bright classrooms, outdoor play areas, and a growing library support every child’s curiosity."}
              </p>
            </div>
          </div>
          <div className="grid grid-3">
            <div className="card hero-bubble">
              <h3>{isFr ? "Salles de classe" : "Classrooms"}</h3>
              <p className="muted">
                {isFr ? "Salles lumineuses avec coins bilingues, coins lecture et assises flexibles." : "Sunlit rooms with bilingual corners, reading nooks, and flexible seating."}
              </p>
            </div>
            <div className="card hero-bubble">
              <h3>{isFr ? "Aires de jeux" : "Playgrounds"}</h3>
              <p className="muted">
                {isFr ? "Jeux extérieurs sécurisés avec surveillance, matériel de sport et espaces verts." : "Safe outdoor play with supervision, sports equipment, and green space."}
              </p>
            </div>
            <div className="card hero-bubble">
              <h3>{isFr ? "Bibliothèque &amp; tech" : "Library &amp; tech"}</h3>
              <p className="muted">
                {isFr ? "Histoires contées, salle informatique pour les bases numériques et ateliers créatifs." : "Storytelling sessions, computer room for early tech skills, and creative labs."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container card glass">
          <div className="grid grid-2">
            <div>
              <h2>{isFr ? "Visitez-nous" : "Visit us"}</h2>
              <p className="muted">
                BP 123, Main Avenue, City Center
                <br />
                {isFr ? "Heures de bureau : Lun–Ven 8h00–16h00" : "Office hours: Mon–Fri 8:00–16:00"}
              </p>
              <p className="muted">
                {isFr ? "Téléphone / WhatsApp : " : "Phone / WhatsApp: "} <strong>+237 650 000 111</strong>
                <br />
                Email: <strong>contact@lagracieuse.edu</strong>
              </p>
              <div className="link-row">
                <a className="btn btn-ghost" href="https://www.google.com/maps" target="_blank" rel="noreferrer">
                  {isFr ? "Ouvrir la carte" : "Open map"}
                </a>
                <Link className="btn btn-accent" href="/admissions">
                  {isFr ? "S'inscrire" : "Register now"}
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
