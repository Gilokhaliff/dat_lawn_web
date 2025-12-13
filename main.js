const calendarData = [
  { date: "Sep 2, 2024", title: "School reopening", note: "Welcome assembly at 8:30" },
  { date: "Dec 20, 2024", title: "Christmas break", note: "Break starts at noon" },
  { date: "Mar 28, 2025", title: "Report cards", note: "Collect from class teachers" },
  { date: "Apr 14, 2025", title: "Easter break", note: "One-week holiday" },
  { date: "Jun 30, 2025", title: "End of school year", note: "Celebration and awards" },
];

const galleryData = [
  { title: "Bright classrooms", desc: "Sunlit rooms with bilingual corners and reading nooks." },
  { title: "Playgrounds", desc: "Safe outdoor play with supervision and sports equipment." },
  { title: "Library time", desc: "Storytelling in English and French every week." },
  { title: "Science moments", desc: "Hands-on experiments that spark curiosity." },
  { title: "Arts & crafts", desc: "Creative stations for drawing, painting, and music." },
  { title: "Computer room", desc: "Early tech skills with guided activities." },
];

const STORAGE_KEY = "registrations";
const SELECTION_KEY = "pendingSelection";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function initNav() {
  const toggle = $(".nav-toggle");
  const navLinks = $("#navLinks");
  if (!toggle || !navLinks) return;
  toggle.addEventListener("click", () => navLinks.classList.toggle("open"));
  $$("nav a").forEach((link) =>
    link.addEventListener("click", () => navLinks.classList.remove("open"))
  );
}

function setActive(buttons, attr, value) {
  buttons.forEach((btn) => btn.classList.toggle("active", btn.dataset[attr] === value));
}

function getRegistrations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveRegistrations(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function addRegistration(entry) {
  const current = getRegistrations();
  current.push(entry);
  saveRegistrations(current);
}

function renderSubmissions() {
  const tableBody = $("#submissionTable tbody");
  const counter = $("#submissionCount");
  if (!tableBody || !counter) return;
  const submissions = getRegistrations();
  tableBody.innerHTML = submissions
    .map(
      (item) => `
      <tr>
        <td>${item.childName}</td>
        <td>${item.stream}</td>
        <td>${item.className}</td>
        <td>${item.parentName}</td>
        <td>${item.phone}</td>
        <td>${item.contactMethod}</td>
        <td>${item.onsite}</td>
      </tr>
    `
    )
    .join("");
  counter.textContent = submissions.length
    ? `${submissions.length} submission(s)`
    : "0 submissions";
}

function preloadSelection(stream, className) {
  localStorage.setItem(SELECTION_KEY, JSON.stringify({ stream, className }));
}

function consumeSelection() {
  const raw = localStorage.getItem(SELECTION_KEY);
  if (!raw) return {};
  localStorage.removeItem(SELECTION_KEY);
  try {
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function initStartApplication() {
  $$(".start-application").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stream = btn.dataset.stream || "";
      preloadSelection(stream, "");
      window.location.href = "admissions.html";
    });
  });
}

function sanitize(str = "") {
  return str.replace(/[<>]/g, "");
}

function initRegistration() {
  const form = $("#registrationForm");
  if (!form) return;
  const streamButtons = $$("#streamChoices .pill-button");
  const classButtons = $$("#classChoices .pill-button");
  const formStatus = $("#formStatus");
  const exportCsvBtn = $("#exportCsv");
  let selectedStream = "";
  let selectedClass = "";

  const pending = consumeSelection();
  if (pending.stream) {
    selectedStream = pending.stream;
    setActive(streamButtons, "stream", selectedStream);
  }
  if (pending.className) {
    selectedClass = pending.className;
    setActive(classButtons, "class", selectedClass);
  }

  streamButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      selectedStream = btn.dataset.stream;
      setActive(streamButtons, "stream", selectedStream);
    })
  );
  classButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      selectedClass = btn.dataset.class;
      setActive(classButtons, "class", selectedClass);
    })
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (data.get("trap")) return;
    const childName = sanitize(data.get("childName") || "");
    const dob = data.get("dob");
    const parentName = sanitize(data.get("parentName") || "");
    const phone = sanitize(data.get("phone") || "");
    const email = sanitize(data.get("email") || "");
    const contactMethod = data.get("contactMethod");
    const previousSchool = sanitize(data.get("previousSchool") || "");
    const onsite = data.get("onsite");
    const notes = sanitize(data.get("notes") || "");

    const phoneValid = /^\+?[0-9\s-]{6,}$/.test(phone);
    if (!selectedStream || !selectedClass) {
      formStatus.textContent = "Please choose a stream and class.";
      formStatus.classList.remove("hidden");
      return;
    }
    if (!phoneValid) {
      formStatus.textContent = "Please enter a valid phone number.";
      formStatus.classList.remove("hidden");
      return;
    }

    const submission = {
      stream: selectedStream,
      className: selectedClass,
      childName,
      dob,
      parentName,
      phone,
      email,
      contactMethod,
      previousSchool,
      onsite,
      notes,
      submittedAt: new Date().toISOString(),
    };
    addRegistration(submission);
    renderSubmissions();
    formStatus.textContent = "Registration received! We will contact you within 1 business day.";
    formStatus.classList.remove("hidden");
    form.reset();
    selectedStream = "";
    selectedClass = "";
    setActive(streamButtons, "stream", selectedStream);
    setActive(classButtons, "class", selectedClass);
  });

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      const submissions = getRegistrations();
      if (!submissions.length) return alert("No submissions yet.");
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
    });
  }

  renderSubmissions();
}

function initCalendar() {
  const timeline = $("#timeline");
  const table = $("#calendarTable tbody");
  if (!timeline && !table) return;
  if (timeline) {
    timeline.innerHTML = calendarData
      .map(
        (item) => `
        <div class="timeline-item">
          <strong>${item.title}</strong>
          <div class="muted">${item.date}</div>
          <div>${item.note}</div>
        </div>
      `
      )
      .join("");
  }
  if (table) {
    table.innerHTML = calendarData
      .map((item) => `<tr><td>${item.date}</td><td>${item.title}</td><td>${item.note}</td></tr>`)
      .join("");
  }
}

function initGallery() {
  const grid = $("#galleryGrid");
  const lightbox = $("#lightbox");
  if (!grid) return;
  const lbTitle = $("#lightboxTitle");
  const lbDesc = $("#lightboxDesc");
  const lbClose = $("#closeLightbox");

  grid.innerHTML = galleryData
    .map(
      (item, idx) => `
      <div class="tile" data-index="${idx}">
        <strong>${item.title}</strong>
        <small>${item.desc}</small>
      </div>
    `
    )
    .join("");

  grid.addEventListener("click", (e) => {
    const tile = e.target.closest(".tile");
    if (!tile || !lightbox) return;
    const item = galleryData[Number(tile.dataset.index)];
    lbTitle.textContent = item.title;
    lbDesc.textContent = `${item.desc} Replace this tile with your own photo.`;
    lightbox.classList.add("active");
  });

  if (lbClose) lbClose.addEventListener("click", () => lightbox.classList.remove("active"));
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) lightbox.classList.remove("active");
    });
  }
}

function initContact() {
  const form = $("#contactForm");
  const status = $("#contactStatus");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (data.get("trap")) return;
    if (status) {
      status.textContent = "Thanks for reaching out! We will reply shortly.";
      status.classList.remove("hidden");
    }
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initStartApplication();
  initRegistration();
  initCalendar();
  initGallery();
  initContact();
});
