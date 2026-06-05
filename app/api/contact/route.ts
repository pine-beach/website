// Contact form handler — sends enquiries via Resend to Jake.
// RESEND_KEY is set in the Vercel project env. Verified sending domain:
// hello.pinebeach.com.au

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TO = "jake@pinebeach.com.au";
const FROM = "Pine Beach <enquiries@hello.pinebeach.com.au>";

const clean = (s: unknown) =>
  String(s ?? "")
    .replace(/[<>]/g, "")
    .trim();

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const name = clean(body.name);
  const email = clean(body.email);
  const company = clean(body.company);
  const brief = clean(body.brief);

  if (!name || !email || !brief) {
    return Response.json(
      { ok: false, error: "Please complete your name, email and brief." },
      { status: 400 }
    );
  }

  const key = process.env.RESEND_KEY;
  if (!key) {
    return Response.json(
      { ok: false, error: "Email is not configured." },
      { status: 500 }
    );
  }

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#0a0a0b">
      <h2 style="margin:0 0 16px;font-size:18px">New project enquiry</h2>
      <p style="margin:0 0 6px"><strong>Name:</strong> ${name}</p>
      <p style="margin:0 0 6px"><strong>Email:</strong> ${email}</p>
      ${company ? `<p style="margin:0 0 6px"><strong>Company:</strong> ${company}</p>` : ""}
      <p style="margin:16px 0 6px"><strong>What they're building:</strong></p>
      <p style="margin:0;white-space:pre-wrap">${brief}</p>
    </div>`;
  const text = `New project enquiry\n\nName: ${name}\nEmail: ${email}\n${
    company ? `Company: ${company}\n` : ""
  }\nWhat they're building:\n${brief}`;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `New project enquiry — ${name}`,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Resend error", res.status, detail);
      return Response.json(
        { ok: false, error: "Could not send right now." },
        { status: 502 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Contact route error", err);
    return Response.json({ ok: false, error: "Could not send right now." }, { status: 502 });
  }
}
