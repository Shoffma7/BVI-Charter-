// Sends push notifications to crew devices registered in hubDevices.
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const REGION = "us-central1";

async function devices(filter) {
  const snap = await db.collection("hubDevices").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => d.token && (!filter || filter(d)));
}

// Same idea as the app's sameName(): exact match, or one side is a single first name.
function sameName(a, b) {
  a = String(a || "").trim().toLowerCase(); b = String(b || "").trim().toLowerCase();
  if (!a || !b) return false;
  if (a === b) return true;
  const ta = a.split(/\s+/), tb = b.split(/\s+/);
  return (ta.length === 1 || tb.length === 1) && ta[0] === tb[0];
}

async function send(list, title, body, tab) {
  if (!list.length) return;
  const res = await admin.messaging().sendEachForMulticast({
    tokens: list.map((d) => d.token),
    notification: { title, body },
    data: { tab: tab || "home" },
    apns: { payload: { aps: { sound: "default" } } },
  });
  // Remove tokens that are no longer valid.
  const dead = [];
  res.responses.forEach((r, i) => {
    const c = r.error && r.error.code;
    if (c === "messaging/registration-token-not-registered" || c === "messaging/invalid-registration-token") dead.push(list[i].id);
  });
  await Promise.all(dead.map((id) => db.collection("hubDevices").doc(id).delete()));
}

exports.onNewPoll = onDocumentCreated({ document: "hubPulse/{id}", region: REGION }, async (ev) => {
  const p = ev.data.data();
  await send(await devices((d) => !sameName(d.name, p.by)), "New poll", String(p.q || "Cast your vote").slice(0, 120), "polls");
});

exports.onExpenseRequest = onDocumentCreated({ document: "hubLedger/{id}", region: REGION }, async (ev) => {
  const e = ev.data.data();
  if (e.kind !== "request") return;
  const cfg = await db.collection("hubLedger").doc("config").get();
  const holder = cfg.exists ? cfg.data().holder : "";
  const amt = "$" + (Number(e.amount || 0) / 100).toFixed(2);
  await send(await devices((d) => sameName(d.name, holder)), "Expense waiting for your OK", `${e.by || "Someone"}: ${amt}${e.note ? " · " + e.note : ""}`.slice(0, 140), "money");
});

exports.onPlanChange = onDocumentUpdated({ document: "hubPassage/{id}", region: REGION }, async (ev) => {
  const id = ev.params.id;
  if (!/^day-\d+$/.test(id)) return;
  const a = ev.data.before.data(), b = ev.data.after.data();
  const changed = ["from", "to", "depart", "arrive", "moor"].filter((k) => String(a[k] || "") !== String(b[k] || ""));
  if (!changed.length) return;
  await send(await devices(), "Plan updated", `Day ${id.split("-")[1]}: ${b.from || "?"} to ${b.to || "?"}`, "plan");
});
