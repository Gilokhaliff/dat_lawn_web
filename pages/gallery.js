import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { galleryData } from "../lib/data";

export default function GalleryPage() {
  const [active, setActive] = useState(null);

  return (
    <>
      <Head>
        <title>La Gracieuse | Gallery</title>
        <meta
          name="description"
          content="Gallery for Groupe scolaire bilingue La Gracieuse. Explore classrooms, playgrounds, and events."
        />
      </Head>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / Gallery
          </div>
          <h1>Gallery</h1>
          <p>Spaces filled with curiosity and care. Swap in your own photos to showcase your school community.</p>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="pill">Photos</div>
              <h2>Click any tile to preview</h2>
            </div>
            <Link className="btn btn-accent" href="/contact">
              Book a visit
            </Link>
          </div>
          <div className="gallery" id="galleryGrid">
            {galleryData.map((item, idx) => (
              <div className="tile" key={item.title} data-index={idx} onClick={() => setActive(item)}>
                <strong>{item.title}</strong>
                <small>{item.desc}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={`lightbox ${active ? "active" : ""}`} id="lightbox" onClick={() => setActive(null)}>
        {active && (
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <h3 id="lightboxTitle">{active.title}</h3>
            <p id="lightboxDesc">{active.desc} Replace this tile with your own photo.</p>
            <button className="btn btn-ghost" id="closeLightbox" onClick={() => setActive(null)}>
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}
