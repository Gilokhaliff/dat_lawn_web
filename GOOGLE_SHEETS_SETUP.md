# Google Sheets admissions setup

1) Create a Google Sheet (example name: “Admissions Submissions”) and add a sheet/tab called “Submissions” with headers in row 1: Timestamp, Child Name, Date of Birth, Stream, Class, Parent Name, Phone, Email, Contact Method, Previous School, On-site, Notes.

2) In the Sheet, open Extensions → Apps Script and replace the default code with (this keeps only one row per child name; a new submission replaces any existing rows for that name, even if spacing/case differ):
```js
function normalizeName(name) {
  return (name || "")
    .toString()
    .normalize("NFD") // strip accents
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim()
    .toLowerCase();
}

function doPost(e) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Submissions") ||
    SpreadsheetApp.getActiveSpreadsheet().insertSheet("Submissions");

  const data = JSON.parse(e.postData.contents || "{}");
  const normalizedName = normalizeName(data.childName);
  if (!normalizedName) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: "Missing child name" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const row = [
    new Date(),
    data.childName ? data.childName.replace(/\s+/g, " ").trim() : "",
    data.dob || "",
    data.stream || "",
    data.className || "",
    data.parentName ? data.parentName.replace(/\s+/g, " ").trim() : "",
    data.phone ? data.phone.replace(/\s+/g, " ").trim() : "",
    data.email ? data.email.replace(/\s+/g, " ").trim() : "",
    data.contactMethod || "",
    data.previousSchool ? data.previousSchool.replace(/\s+/g, " ").trim() : "",
    data.onsite || "",
    data.notes ? data.notes.replace(/\s+/g, " ").trim() : "",
  ];

  const lastRow = sheet.getLastRow();
  const existingNames =
    lastRow > 1 ? sheet.getRange(2, 2, lastRow - 1, 1).getValues().map((r) => normalizeName(r[0])) : [];

  // Delete any existing rows for this child (iterate bottom-up to avoid index shifts)
  for (let i = existingNames.length - 1; i >= 0; i--) {
    if (normalizedName && existingNames[i] === normalizedName) {
      sheet.deleteRow(i + 2); // +2 accounts for header row
    }
  }

  sheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON
  );
}
```

3) Deploy as a web app: Click Deploy → New deployment → Select type “Web app”. Set “Execute as” to your account and “Who has access” to “Anyone”. Deploy and copy the “Web app” URL (it ends with `/exec`).

4) Add the URL to your environment: create or update `.env.local` with `GOOGLE_SHEETS_WEBHOOK_URL=<your_web_app_url>` and restart `npm run dev`. In production/hosting, add the same env var.

5) Test locally: submit the admissions form; confirm a new row appears in the Sheet. The Next.js API route forwards submissions to the webhook and returns success/error to the form.

Notes: If you later protect the sheet, keep the Apps Script permission as “Execute as me” so it can append rows. To pause online submissions, temporarily remove or change the env var so the API route returns an error.
