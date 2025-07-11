import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function categorizeContent(rawText: string): Promise<string> {
    const prompt = `
You are an expert assistant trained to analyze business website content.

TASK:
1. Summarize the entire content in your own words. The summary should be about 1000 words long and explain the key details, offerings, tone, and purpose of the website.
2. Categorize the content into the following JSON structure.

IMPORTANT:
- Output ONLY valid JSON.
- Do NOT include markdown, comments, or any explanations.
- Do NOT write "Here is the JSON" or anything before or after the JSON.
- The JSON must be directly parsable with JSON.parse()

JSON FORMAT:
{
  "Summary": "A 1000-word detailed summary.",
  "Business Overview": "...",
  "Services & Products": "...",
  "Contact Information": "...",
  "Pricing": "...",
  "FAQ": "...",
  "Policies": "...",
  "Company Overview": "..."
}

CONTENT TO ANALYZE:
"""
${rawText.length > 15000 ? rawText.slice(0, 15000) : rawText}
"""
`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
    });

    return response.choices[0].message?.content ?? '{}';
}
