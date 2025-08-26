export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { fullName, email, phone, model } = req.body || {};

  if (!fullName || !email || !phone || !model) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Simulate processing and persist via a placeholder.
  await new Promise((r) => setTimeout(r, 500));

  return res.status(200).json({
    ok: true,
    message: "Prebooking successful",
    data: { id: Date.now(), fullName, email, phone, model },
  });
}


