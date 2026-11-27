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
    const prompt = `You are the NAUB Study Assistant for Nigerian Army University Biu (NAUB) students. Give clear, concise, encouraging academic explanations and study advice (keep answers under 150 words unless asked for details). Student's registered courses: ${courses}.\n\nStudent question: ${message}`;

    // Lite first = least busy, then others
    const MODELS = [
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-3.8-flash-lite",
      "gemini-3.8-flash",
      "gemini-3-flash"
    ];

    let lastError = "";

    for (const model of MODELS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: controller.signal
          }
        );
        clearTimeout(timeout);
        const data = await res.json();
        if (res.ok) {
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate an answer right now. Try rephrasing!";
          return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reply }) };
        }
        lastError = model + ": " + (data?.error?.message || res.status);
        continue; // <-- THIS is the fix, try next model instead of stopping
      } catch (e) {
        lastError = model + ": timeout";
        continue;
      }
    }

    return { statusCode: 503, body: JSON.stringify({ error: "All models busy, try again in 20 seconds. " + lastError }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error: " + String(err) }) };
  }
};
