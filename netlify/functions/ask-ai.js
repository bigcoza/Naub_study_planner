exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const message = body.message || body.prompt || body.question || "";
    const courses = body.courses || "None yet";
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "API key missing" }) };
    }
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: "No message" }) };
    }
    const prompt = `You are the NAUB Study Assistant for Nigerian Army University Biu (NAUB) students. Give clear, concise, encouraging academic explanations and study advice (keep answers under 150 words unless asked for details). Student's registered courses: ${courses}.\n\nStudent question: ${message}`;
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: data?.error?.message || "Gemini error" }) };
    }
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate an answer right now. Try rephrasing!";
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reply }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error: " + String(err) }) };
  }
};
