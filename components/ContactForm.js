import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", trap: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.trap) return;
    setStatus("Thanks for reaching out! We will reply shortly.");
    setForm({ name: "", email: "", subject: "", message: "", trap: "" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="trap"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        value={form.trap}
        onChange={(e) => setForm((f) => ({ ...f, trap: e.target.value }))}
      />
      <div>
        <label htmlFor="contactName">Name</label>
        <input
          id="contactName"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div>
        <label htmlFor="contactEmail">Email or phone</label>
        <input
          id="contactEmail"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div>
        <label htmlFor="contactSubject">Subject</label>
        <input
          id="contactSubject"
          placeholder="Registration, visit request..."
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
        />
      </div>
      <div>
        <label htmlFor="contactMessage">Message</label>
        <textarea
          id="contactMessage"
          required
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
      </div>
      {status && <div className="alert">{status}</div>}
      <button className="btn btn-primary" type="submit">
        Send message
      </button>
    </form>
  );
}
