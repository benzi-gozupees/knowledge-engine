import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function chunkText(text: string, chunkSize: number = 12000): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        console.log(`🔹 Chunking text: ${i} to ${i + chunkSize}`);
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}

function cleanJSON(raw: string): string {
    return raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, '$1').trim();
}

export async function categorizeContent(rawText: string): Promise<string> {
    const chunks = chunkText(rawText, 12000);
    const startTotal = Date.now();

    const chunkPromises = chunks.map(async (chunk, idx) => {
        const prompt = `
You are an expert assistant trained to analyze business website content.

TASK:
1. Read the website content provided below.
2. Extract all relevant content exactly as it appears (do NOT summarize).
3. Return this in the following JSON format. If a field is not found in this chunk, return an empty string for it.

IMPORTANT:
- Output ONLY valid JSON.
- Do NOT include markdown, comments, or any explanations.
- The JSON must be directly parsable using JSON.parse()

FORMAT:
{
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
${chunk}
"""
`;

        const chunkStart = Date.now();

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4-1106-preview',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.4,
            });

            const duration = ((Date.now() - chunkStart) / 1000).toFixed(2);
            console.log(`✅ Chunk ${idx + 1}/${chunks.length} processed in ${duration} seconds`);

            const cleaned = cleanJSON(response.choices[0].message?.content ?? '{}');
            const parsed = JSON.parse(cleaned);
            return parsed;
        } catch (err) {
            const duration = ((Date.now() - chunkStart) / 1000).toFixed(2);
            console.warn(`❌ Chunk ${idx + 1} failed after ${duration} seconds:`, err);
            return {
                "Business Overview": "",
                "Services & Products": "",
                "Contact Information": "",
                "Pricing": "",
                "FAQ": "",
                "Policies": "",
                "Company Overview": ""
            };
        }
    });

    const results = await Promise.all(chunkPromises);

    const merged: Record<string, string> = {
        "Business Overview": "",
        "Services & Products": "",
        "Contact Information": "",
        "Pricing": "",
        "FAQ": "",
        "Policies": "",
        "Company Overview": ""
    };

    for (const r of results) {
        for (const key in merged) {
            if (r[key]) {
                merged[key] += r[key] + '\n\n';
            }
        }
    }

    const summaryPrompt = `
You are an expert assistant trained to analyze business website content.

TASK:
Write a 1000-word summary of the content below. This summary should capture the key points, offerings, structure, and tone of the website.

Only output a JSON object with this format:
{
  "Summary": "1000-word summary goes here"
}

CONTENT:
"""
${rawText.length > 30000 ? rawText.slice(0, 30000) : rawText}
"""
`;

    let summaryText = "";
    const summaryStart = Date.now();

    try {
        const summaryResponse = await openai.chat.completions.create({
            model: 'gpt-4-1106-preview',
            messages: [{ role: 'user', content: summaryPrompt }],
            temperature: 0.4,
        });

        const cleanedSummary = cleanJSON(summaryResponse.choices[0].message?.content ?? '{}');
        const summaryParsed = JSON.parse(cleanedSummary);
        summaryText = summaryParsed.Summary || "";

        const summaryDuration = ((Date.now() - summaryStart) / 1000).toFixed(2);
        console.log(`📝 Summary generated in ${summaryDuration} seconds`);
    } catch (err) {
        const summaryDuration = ((Date.now() - summaryStart) / 1000).toFixed(2);
        console.warn(`⚠️ Failed to parse summary after ${summaryDuration} seconds:`, err);
    }

    const totalDuration = ((Date.now() - startTotal) / 1000).toFixed(2);
    console.log(`🚀 Total processing time: ${totalDuration} seconds`);

    return JSON.stringify({
        Summary: summaryText,
        ...merged
    }, null, 2);
}
