exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const message = body.message || body.prompt || body.question || "";
    const courses = body.courses || "None yet";
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "API key missing" }) };
    if (!message) return { statusCode: 400, body: JSON.stringify({ error: "No message" }) };
    const prompt = `You are the NAUB Study Assistant. Student question: ${message}`;

    const MODELS = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"];

    for (const model of MODELS) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      const data = await res.json();
      if (res.ok) {
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No reply";
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reply }) };
      }
      // Return the REAL Google error so we can see it
      return { statusCode: res.status, body: JSON.stringify({ error: `MODEL ${model} FAILED: ` + (data?.error?.message || JSON.stringify(data)) }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error: " + String(err) }) };
  }
};
