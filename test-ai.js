require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    console.log('Testing genai SDK...');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'hello',
    });
    console.log(response.text);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
