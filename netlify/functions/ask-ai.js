exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message, courses } = JSON.parse(event.body || "{}");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key missing" })
      };
    }

    const prompt = `You are the NAUB Study Assistant for Nigerian Army University Biu (NAUB) students. Give clear, concise, encouraging academic explanations and study advice (keep answers under 150 words unless asked for details). Student's registered courses: ${courses || "None yet"}.\n\nStudent question: ${message}`;

    const res = await fetch(
 "https://generativelanguage.googleapis.com"+
      "/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" +
      apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: "Quota or API limit reached" })
      };
    }

    const reply =
      data?.candidates?.
    [0]?.content?.parts?.[0]?.text ||
      "I couldn't generate an answer right now. Try rephrasing your question!";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};
  
