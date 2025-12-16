import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { calendarData } from "../lib/data";

export default function CalendarPage() {
  const { locale } = useRouter();
  const isFr = locale === "fr";

  const pick = (value) => (typeof value === "string" ? value : value[isFr ? "fr" : "en"]);

  return (
    <>
      <Head>
        <title>La Gracieuse | {isFr ? "Calendrier" : "Calendar"}</title>
        <meta
          name="description"
          content={
            isFr
              ? "Calendrier académique du Groupe scolaire bilingue La Gracieuse. Dates clés et événements."
              : "Academic calendar for Groupe scolaire bilingue La Gracieuse. Key dates and events."
          }
        />
      </Head>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">{isFr ? "Accueil" : "Home"}</Link> / {isFr ? "Calendrier" : "Calendar"}
          </div>
          <h1>{isFr ? "Calendrier académique" : "Academic calendar"}</h1>
          <p>
            {isFr
              ? "Dates clés de l'année scolaire 2024–2025 : rentrée, vacances, bulletins et cérémonies de fin d'année."
              : "Key dates for the 2024–2025 school year: reopening, holidays, report cards, and closing ceremonies."}
          </p>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">{isFr ? "Chronologie" : "Timeline"}</div>
              <h2>{isFr ? "Dates importantes" : "Important dates"}</h2>
            </div>
            <a className="btn btn-ghost" href="#" aria-disabled="true">
              {isFr ? "Télécharger le PDF (bientôt disponible)" : "Download PDF (coming soon)"}
            </a>
          </div>
          <div className="grid grid-2">
            <div className="card glass">
              <h3>{isFr ? "Vue chronologique" : "Timeline view"}</h3>
              <div className="timeline" id="timeline">
                {calendarData.map((item, idx) => {
                  const title = pick(item.title);
                  const date = pick(item.date);
                  const note = pick(item.note);
                  return (
                    <div className="timeline-item" key={`${title}-${idx}`}>
                      <strong>{title}</strong>
                      <div className="muted">{date}</div>
                      <div>{note}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <h3>{isFr ? "Vue tableau" : "Table view"}</h3>
              <div className="table-scroll">
                <table id="calendarTable">
                  <thead>
                    <tr>
                      <th>{isFr ? "Date" : "Date"}</th>
                      <th>{isFr ? "Événement" : "Event"}</th>
                      <th>{isFr ? "Notes" : "Notes"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarData.map((item, idx) => {
                      const title = pick(item.title);
                      const date = pick(item.date);
                      const note = pick(item.note);
                      return (
                        <tr key={`${title}-${idx}`}>
                          <td>{date}</td>
                          <td>{title}</td>
                          <td>{note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
