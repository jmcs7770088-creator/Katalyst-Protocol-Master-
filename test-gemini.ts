import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({ model: "gemini-3.5-flash", contents: "test" });
    console.log("Success:", res.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
