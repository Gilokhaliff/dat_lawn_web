import Head from "next/head";
import Link from "next/link";
import { levelLabels } from "../lib/data";
import { useRouter } from "next/router";

export default function Programs() {
  const { locale } = useRouter();
  const isFr = locale === "fr";

  return (
    <>
      <Head>
        <title>La Gracieuse | {isFr ? "Programmes" : "Programs"}</title>
        <meta
          name="description"
          content={
            isFr
              ? "Programmes et parcours bilingues du Groupe scolaire bilingue La Gracieuse."
              : "Programs and bilingual streams at Groupe scolaire bilingue La Gracieuse."
          }
        />
      </Head>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">{isFr ? "Accueil" : "Home"}</Link> / {isFr ? "Programmes" : "Programs"}
          </div>
          <h1>{isFr ? "Programmes et parcours bilingues" : "Bilingual programs & streams"}</h1>
          <p>
            {isFr
              ? "Choisissez le parcours francophone ou anglophone de la Maternelle 1–2 au Primaire 1–6."
              : "Choose Francophone or Anglophone pathways across Nursery 1–2 and Primary 1–6."}
          </p>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">{isFr ? "Parcours" : "Streams"}</div>
              <h2>{isFr ? "Parcours francophone et anglophone" : "Francophone and Anglophone pathways"}</h2>
              <p>
                {isFr
                  ? "Des programmes équilibrés avec matières principales, enrichissement et enseignants natifs bienveillants."
                  : "Balanced curricula with core subjects, enrichment, and caring native-speaking teachers."}
              </p>
            </div>
            <Link className="btn btn-accent" href="/admissions">
              {isFr ? "Commencer l'inscription" : "Start registration"}
            </Link>
          </div>
          <div className="grid grid-2">
            <div className="card glass">
              <div className="badge">{isFr ? "Parcours francophone" : "Francophone Stream"}</div>
              <ul className="list">
                <li>{isFr ? "Fondamentaux du français et de la lecture" : "French language foundations and literacy"}</li>
                <li>{isFr ? "Mathématiques, sciences, éducation civique" : "Mathematics, science, civic education"}</li>
                <li>{isFr ? "Arts créatifs, sport et projets" : "Creative arts, sports, and project work"}</li>
              </ul>
              <Link className="btn btn-primary" href={{ pathname: "/admissions", query: { stream: "Francophone" } }}>
                {isFr ? "Commencer l'inscription" : "Start Application"}
              </Link>
            </div>
            <div className="card glass">
              <div className="badge">{isFr ? "Parcours anglophone" : "Anglophone Stream"}</div>
              <ul className="list">
                <li>{isFr ? "Lecture/écriture en anglais" : "English literacy, reading, and writing"}</li>
                <li>{isFr ? "Mathématiques, sciences, sciences sociales" : "Mathematics, science, social studies"}</li>
                <li>{isFr ? "Arts, bases du code et sport" : "Arts, coding basics, and sports"}</li>
              </ul>
              <Link className="btn btn-primary" href={{ pathname: "/admissions", query: { stream: "Anglophone" } }}>
                {isFr ? "Commencer l'inscription" : "Start Application"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">{isFr ? "Niveaux" : "Levels"}</div>
              <h2>{isFr ? "Classes disponibles" : "Classes available"}</h2>
              <p>
                {isFr
                  ? "De la Maternelle au Primaire avec des activités adaptées à l'âge, une exposition bilingue et des routines sécurisées."
                  : "Nursery to Primary with age-appropriate activities, bilingual exposure, and safe routines."}
              </p>
            </div>
          </div>
          <div className="grid grid-3">
            <div className="card hero-bubble">
              <h3>{isFr ? "Maternelle 1" : "Nursery 1"}</h3>
              <p className="muted">
                {isFr ? "Socialisation, pré-lecture, motricité, chansons et apprentissage par le jeu." : "Early socialization, pre-literacy, motor skills, songs, and play-based learning."}
              </p>
            </div>
            <div className="card hero-bubble">
              <h3>{isFr ? "Maternelle 2" : "Nursery 2"}</h3>
              <p className="muted">
                {isFr ? "Développement du vocabulaire, sens du nombre, arts créatifs, histoires en deux langues." : "Vocabulary growth, number sense, creative arts, and story time in two languages."}
              </p>
            </div>
            <div className="card hero-bubble">
              <h3>{isFr ? "Primaire 1–6" : "Primary 1–6"}</h3>
              <p className="muted">
                {isFr ? "Matières principales avec renforcement bilingue, projets, sport et citoyenneté." : "Core subjects with bilingual reinforcement, projects, sports, and civic engagement."}
              </p>
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
              <h2>{isFr ? "Identité bilingue" : "Bilingual identity"}</h2>
              <p className="muted">
                {isFr
                  ? "Les routines du matin, les projets de classe et les rassemblements utilisent l’anglais et le français pour renforcer l’écoute, l’expression, la lecture et l’écriture."
                  : "Morning routines, class projects, and assemblies are designed to use both English and French, building confidence in listening, speaking, reading, and writing."}
              </p>
              <ul className="list">
                <li>{isFr ? "Cercles de lecture hebdomadaires dans les deux langues" : "Weekly reading circles in both languages"}</li>
                <li>{isFr ? "Soutien en petits groupes pour lecture/numératie" : "Small group tutoring for literacy and numeracy"}</li>
                <li>{isFr ? "Clubs : arts, sport et initiation au code" : "Clubs: arts, sports, and beginner coding"}</li>
              </ul>
            </div>
            <div className="hero-card">
              <h3>{isFr ? "Prêt à vous inscrire ?" : "Ready to enroll?"}</h3>
              <p>{isFr ? "Commencez une inscription en ligne ou planifiez une visite au bureau." : "Start an application online or plan an in-person visit with our office team."}</p>
              <div className="link-row">
                <Link className="btn btn-accent" href="/admissions">
                  {isFr ? "Commencer l'inscription" : "Start registration"}
                </Link>
                <Link className="btn btn-ghost" href="/contact">
                  {isFr ? "Nous contacter" : "Contact us"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
