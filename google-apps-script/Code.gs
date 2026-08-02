/**
 * Nano Fly InfoTech — Contact Form Backend
 * -----------------------------------------
 * Deployed as a Google Apps Script Web App.
 *
 * What it does, on every form submission from contact.html:
 *   1. Appends a new row to the "Submissions" sheet of the Google Sheet
 *      this script is bound to.
 *   2. Sends a notification email to works@nanoflyinfotech.com, from the
 *      Gmail account that owns/deploys this script (nanofly.projects@gmail.com).
 *   3. Sends the visitor a short auto-reply confirming we received their
 *      message (optional — safe to delete if you don't want this).
 *
 * SETUP — see APPS_SCRIPT_SETUP.md in this folder for full step-by-step
 * instructions with screenshoted-style guidance.
 */

// ─── CONFIGURE THESE ──────────────────────────────────────────────
const NOTIFY_EMAIL = "works@nanoflyinfotech.com";   // where the lead notification is sent
const SHEET_NAME = "Submissions";                    // tab name inside the Google Sheet
const SEND_AUTO_REPLY = true;                        // set to false to skip the visitor auto-reply
// ────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data = parseRequest(e);

    // Honeypot — if this hidden field is filled, it's almost certainly a bot.
    if (data.botcheck) {
      return jsonResponse({ result: "success" }); // pretend success, drop silently
    }

    var sheet = getOrCreateSheet();
    var timestamp = new Date();

    sheet.appendRow([
      timestamp,
      data.name || "",
      data.email || "",
      data.phone || "",
      data.user_subject || "",
      data.message || "",
      data.page_url || "",
    ]);

    sendNotificationEmail(data, timestamp);

    if (SEND_AUTO_REPLY && data.email) {
      sendAutoReply(data);
    }

    return jsonResponse({ result: "success" });
  } catch (err) {
    return jsonResponse({ result: "error", message: err.message });
  }
}

// Apps Script web apps also need to answer plain GET pings gracefully
// (useful for a quick "is this deployed?" check in the browser).
function doGet(e) {
  return jsonResponse({ result: "success", message: "Nano Fly InfoTech contact endpoint is live." });
}

function parseRequest(e) {
  // The site posts JSON as text/plain (see contact.html) to avoid CORS
  // pre-flight issues, so we parse e.postData.contents ourselves.
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  // Fallback: standard form-encoded POST (e.parameter)
  return (e && e.parameter) || {};
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Name", "Email", "Phone", "Inquiry Type", "Message", "Page URL"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sendNotificationEmail(data, timestamp) {
  var subject = "New Website Lead — " + (data.name || "Unknown") +
    (data.user_subject ? " (" + data.user_subject + ")" : "");

  var body =
    "You've received a new enquiry from the Nano Fly InfoTech website.\n\n" +
    "Name: " + (data.name || "-") + "\n" +
    "Email: " + (data.email || "-") + "\n" +
    "Phone: " + (data.phone || "-") + "\n" +
    "Inquiry Type: " + (data.user_subject || "-") + "\n" +
    "Message:\n" + (data.message || "-") + "\n\n" +
    "Submitted: " + timestamp.toLocaleString() + "\n" +
    "Page: " + (data.page_url || "-");

  // Sent from the Gmail account that deployed this script
  // (nanofly.projects@gmail.com) to works@nanoflyinfotech.com.
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    body: body,
    replyTo: data.email || NOTIFY_EMAIL
  });
}

function sendAutoReply(data) {
  var subject = "Thanks for reaching out to Nano Fly InfoTech!";
  var body =
    "Hi " + (data.name || "there") + ",\n\n" +
    "Thanks for contacting Nano Fly InfoTech. We've received your message and " +
    "our team will get back to you shortly.\n\n" +
    "Here's a copy of what you sent us:\n" +
    "Inquiry Type: " + (data.user_subject || "-") + "\n" +
    "Message: " + (data.message || "-") + "\n\n" +
    "If it's urgent, you can also reach us on WhatsApp at +91 94877 72786 / +91 93442 29558.\n\n" +
    "Best regards,\n" +
    "Nano Fly InfoTech";

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: body
  });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
