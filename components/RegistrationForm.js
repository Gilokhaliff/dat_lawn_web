import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { levelLabels } from "../lib/data";

const streamOptions = ["Francophone", "Anglophone"];

const emptyForm = {
  childName: "",
  dob: "",
  parentName: "",
  phone: "",
  email: "",
  contactMethod: "Phone",
  previousSchool: "",
  onsite: "No",
  notes: "",
  trap: "",
};

function sanitize(str = "") {
  return str.replace(/[<>]/g, "").trim();
}

export default function RegistrationForm({ showTable = false }) {
  const router = useRouter();
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (!router.isReady) return;
    const { stream, class: cls } = router.query;
    if (stream) setSelectedStream(stream.toString());
    if (cls) setSelectedClass(cls.toString());
  }, [router.isReady, router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setStatusType("info");
    if (form.trap) return;
    const phoneValid = /^\+?[0-9\s-]{6,}$/.test(form.phone);
    if (!selectedStream || !selectedClass) {
      setStatus("Please choose a stream and class.");
      setStatusType("error");
      return;
    }
    if (!phoneValid) {
      setStatus("Please enter a valid phone number.");
      setStatusType("error");
      return;
    }
    const submission = {
      stream: selectedStream,
      className: selectedClass,
      childName: sanitize(form.childName),
      dob: form.dob,
      parentName: sanitize(form.parentName),
      phone: sanitize(form.phone),
      email: sanitize(form.email),
      contactMethod: form.contactMethod,
      previousSchool: sanitize(form.previousSchool),
      onsite: form.onsite,
      notes: sanitize(form.notes),
      submittedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...submission, trap: form.trap }),
      });

      if (!response.ok) {
        let message = "Unable to submit right now. Please try again or call us.";
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch (err) {
          // ignore json errors
        }
        throw new Error(message);
      }

      setSubmissions((prev) => [...prev, submission]);
      setStatus("Registration received! We will contact you within 1 business day.");
      setStatusType("success");
      setForm(emptyForm);
      setSelectedStream("");
      setSelectedClass("");
    } catch (err) {
      setStatus(err?.message || "Unable to submit right now. Please try again or call us.");
      setStatusType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!submissions.length) {
      alert("No submissions yet.");
      return;
    }
    const headers = Object.keys(submissions[0]);
    const rows = submissions.map((row) =>
      headers.map((h) => `"${(row[h] || "").toString().replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "registrations.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusStyle =
    statusType === "error"
      ? { background: "rgba(255, 123, 66, 0.12)", borderColor: "rgba(255, 123, 66, 0.35)", color: "#c2410c" }
      : {};

  const submissionCountLabel = useMemo(
    () => (submissions.length ? `${submissions.length} submission(s)` : "0 submissions"),
    [submissions.length]
  );

  return (
    <>
      <form id="registrationForm" onSubmit={handleSubmit}>
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
          <label>Choose stream *</label>
          <div className="chip-row" id="streamChoices">
            {streamOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`pill-button ${selectedStream === option ? "active" : ""}`}
                data-stream={option}
                onClick={() => setSelectedStream(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Choose class *</label>
          <div className="chip-row" id="classChoices">
            {levelLabels.map((label) => (
              <button
                key={label}
                type="button"
                className={`pill-button ${selectedClass === label ? "active" : ""}`}
                data-class={label}
                onClick={() => setSelectedClass(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-2">
          <div>
            <label htmlFor="childName">Child’s full name *</label>
            <input
              id="childName"
              name="childName"
              required
              value={form.childName}
              onChange={(e) => setForm((f) => ({ ...f, childName: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="dob">Date of birth *</label>
            <input
              id="dob"
              name="dob"
              type="date"
              required
              value={form.dob}
              onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-2">
          <div>
            <label htmlFor="parentName">Parent / guardian name *</label>
            <input
              id="parentName"
              name="parentName"
              required
              value={form.parentName}
              onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="phone">Phone number *</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="+237 650 000 111"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-2">
          <div>
            <label htmlFor="email">Email (optional)</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="contactMethod">Preferred contact method</label>
            <select
              id="contactMethod"
              name="contactMethod"
              value={form.contactMethod}
              onChange={(e) => setForm((f) => ({ ...f, contactMethod: e.target.value }))}
            >
              <option>Phone</option>
              <option>WhatsApp</option>
              <option>Email</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="previousSchool">Previous school (optional)</label>
          <input
            id="previousSchool"
            name="previousSchool"
            value={form.previousSchool}
            onChange={(e) => setForm((f) => ({ ...f, previousSchool: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="onsite">Will complete registration on-site?</label>
          <select
            id="onsite"
            name="onsite"
            value={form.onsite}
            onChange={(e) => setForm((f) => ({ ...f, onsite: e.target.value }))}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        <div>
          <label htmlFor="notes">Additional notes / questions</label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Allergies, learning preferences, questions..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
        {status && (
          <div id="formStatus" className="alert" style={statusStyle}>
            {status}
          </div>
        )}
        <button className="btn btn-primary" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit registration"}
        </button>
      </form>

      {showTable && (
        <div className="card glass" style={{ marginTop: "1rem" }}>
          <div className="section-head" style={{ marginBottom: "0.5rem" }}>
            <div>
              <div className="pill">Admin snapshot</div>
              <h3 style={{ margin: "0.25rem 0" }}>Online submissions</h3>
            </div>
            <div className="link-row">
              <button className="btn btn-ghost" onClick={handleExport}>
                Export CSV
              </button>
              <span className="badge">{submissionCountLabel}</span>
            </div>
          </div>
          <div className="table-scroll">
            <table id="submissionTable">
              <thead>
                <tr>
                  <th>Child</th>
                  <th>Stream</th>
                  <th>Class</th>
                  <th>Parent</th>
                  <th>Phone</th>
                  <th>Contact</th>
                  <th>On-site?</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item, idx) => (
                  <tr key={`${item.childName}-${idx}`}>
                    <td>{item.childName}</td>
                    <td>{item.stream}</td>
                    <td>{item.className}</td>
                    <td>{item.parentName}</td>
                    <td>{item.phone}</td>
                    <td>{item.contactMethod}</td>
                    <td>{item.onsite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
