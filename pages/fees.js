import Head from "next/head";
import Link from "next/link";

export default function Fees() {
  return (
    <>
      <Head>
        <title>La Gracieuse | Fees</title>
        <meta
          name="description"
          content="School fees for Groupe scolaire bilingue La Gracieuse. Transparent tuition and payment options."
        />
      </Head>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / Fees
          </div>
          <h1>School fees</h1>
          <p>Transparent tuition for the 2024–2025 academic year. Payment options: cash, bank transfer, or mobile money.</p>
        </div>
      </section>

      <section>
        <div className="container card glass">
          <div className="section-head" style={{ marginBottom: "0.5rem" }}>
            <div>
              <div className="pill">Tuition</div>
              <h2 style={{ margin: "0.25rem 0" }}>Annual fees by level</h2>
            </div>
            <Link className="btn btn-accent" href="/admissions">
              Start application
            </Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Annual fee</th>
                  <th>Term breakdown</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Nursery 1</td>
                  <td>100,000 FCFA</td>
                  <td>50,000 FCFA x 2 terms</td>
                  <td>Includes basic supplies</td>
                </tr>
                <tr>
                  <td>Nursery 2</td>
                  <td>100,000 FCFA</td>
                  <td>50,000 FCFA x 2 terms</td>
                  <td>Includes basic supplies</td>
                </tr>
                <tr>
                  <td>Primary 1–3</td>
                  <td>120,000 FCFA</td>
                  <td>60,000 FCFA x 2 terms</td>
                  <td>Sports & library included</td>
                </tr>
                <tr>
                  <td>Primary 4–6</td>
                  <td>140,000 FCFA</td>
                  <td>70,000 FCFA x 2 terms</td>
                  <td>Exam preparation support</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="note" style={{ marginTop: "0.75rem" }}>
            Bring proof of payment or receipt to the office when completing on-site registration. No discounts currently applied.
          </div>
        </div>
      </section>
    </>
  );
}
