
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const findMatchingCandidates = async (query: string, availableStudents: UserProfile[]): Promise<string[]> => {
  if (!query || availableStudents.length === 0) {
    return [];
  }

  const studentDataForPrompt = availableStudents.map(({ id, fullName, year, bio, skills }) => ({
    id,
    fullName,
    year,
    bio,
    skills,
  }));

  const prompt = `
    Based on the following query: "${query}", analyze the list of students provided below.
    Return a JSON array containing the IDs of the students who are the best match, sorted from most to least relevant.
    Do not include any students who are a poor match. Only return the student IDs.

    Student Data:
    ${JSON.stringify(studentDataForPrompt, null, 2)}

    Your response must be a valid JSON array of strings, like this: ["studentId1", "studentId2", "studentId3"]
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING
                }
            }
        }
    });
    
    const responseText = response.text.trim();
    const result = JSON.parse(responseText);
    
    if (Array.isArray(result) && result.every(item => typeof item === 'string')) {
      return result;
    }
    
    console.error("Gemini API returned an unexpected format:", result);
    return [];
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get AI-powered results. Please try again.");
  }
};
