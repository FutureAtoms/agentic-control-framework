require('dotenv').config(); // Load environment variables from .env file
const axios = require('axios');
const fs = require('fs');

const API_KEY = process.env.GEMINI_API_KEY;
const API_ENDPOINT = process.env.GEMINI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

async function parsePrdWithGemini(prdFilePath) {
  if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY not found in environment variables.");
    console.error("Please create a .env file based on .env.example and add your key.");
    return null; // Indicate failure
  }

  let prdContent;
  try {
    prdContent = fs.readFileSync(prdFilePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading PRD file: ${prdFilePath}`, error);
    return null;
  }

  // --- Construct the prompt for Gemini --- 
  // This is crucial and needs refinement based on desired output format.
  const prompt = `
Parse the following Product Requirements Document (PRD) and generate a list of tasks in JSON format. 
Each task should have the following fields: "title" (string), "description" (string), "priority" (string, e.g., "high", "medium", "low"), and "dependsOn" (array of integers, representing the IDs of tasks it depends on within this generated list). 
Assign sequential IDs starting from 1 to the tasks you generate.
Output ONLY the JSON array of tasks, without any introductory text or explanation.

PRD Content:
\`\`\`
${prdContent}
\`\`\`

JSON Output:
`;

  console.log("Sending PRD content to Gemini API...");

  try {
    const response = await axios.post(
      `${API_ENDPOINT}?key=${API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }],
        }],
        // Optional: Add generationConfig like temperature, maxOutputTokens etc. if needed
        // generationConfig: {
        //   temperature: 0.5,
        //   maxOutputTokens: 2048,
        // },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    // --- Process the response --- 
    // Gemini response structure might vary. Adjust parsing as needed.
    // This assumes the response contains the JSON directly in the text part.
    if (response.data && response.data.candidates && response.data.candidates[0].content && response.data.candidates[0].content.parts) {
      let jsonResponse = response.data.candidates[0].content.parts[0].text;
      
      // Clean the response: Gemini might add ```json ... ``` or other text
      jsonResponse = jsonResponse.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsedTasks = JSON.parse(jsonResponse);
        if (!Array.isArray(parsedTasks)) {
          throw new Error("Gemini response is not a JSON array.");
        }
        // Optional: Add validation for task structure here
        console.log("Successfully parsed tasks from Gemini response.");
        return parsedTasks; // Return the array of generated tasks
      } catch (parseError) {
        console.error("Error parsing JSON response from Gemini:", parseError);
        console.error("Raw Gemini response text:", jsonResponse);
        return null;
      }
    } else {
      console.error("Error: Unexpected response structure from Gemini API.");
      console.error("Raw API Response:", JSON.stringify(response.data, null, 2));
      return null;
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    return null;
  }
}

module.exports = {
  parsePrdWithGemini
};
