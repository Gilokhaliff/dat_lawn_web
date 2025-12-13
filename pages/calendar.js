import Head from "next/head";
import Link from "next/link";
import { calendarData } from "../lib/data";

export default function CalendarPage() {
  return (
    <>
      <Head>
        <title>La Gracieuse | Calendar</title>
        <meta name="description" content="Academic calendar for Groupe scolaire bilingue La Gracieuse. Key dates and events." />
      </Head>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / Calendar
          </div>
          <h1>Academic calendar</h1>
          <p>Key dates for the 2024–2025 school year: reopening, holidays, report cards, and closing ceremonies.</p>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">Timeline</div>
              <h2>Important dates</h2>
            </div>
            <a className="btn btn-ghost" href="#" aria-disabled="true">
              Download PDF (coming soon)
            </a>
          </div>
          <div className="grid grid-2">
            <div className="card glass">
              <h3>Timeline view</h3>
              <div className="timeline" id="timeline">
                {calendarData.map((item) => (
                  <div className="timeline-item" key={item.title}>
                    <strong>{item.title}</strong>
                    <div className="muted">{item.date}</div>
                    <div>{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3>Table view</h3>
              <div className="table-scroll">
                <table id="calendarTable">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Event</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarData.map((item) => (
                      <tr key={item.title}>
                        <td>{item.date}</td>
                        <td>{item.title}</td>
                        <td>{item.note}</td>
                      </tr>
                    ))}
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
