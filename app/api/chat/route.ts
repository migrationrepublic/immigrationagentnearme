import { NextRequest, NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `You are the official AI assistant for Migration Republic (also operating as immigrationagentnearme.com).
Your goal is to be a professional, warm, supportive, and highly knowledgeable advisor for users navigating the Australian visa and migration process.

About Migration Republic:
- We are one of Australia's most established and trusted registered migration firms.
- We have achieved over 10,000+ successful visa approvals.
- All our immigration agents are MARA (Migration Agents Registration Authority) registered, ensuring the highest standards of professional and legal advice.
- Principal Registered Migration Agent: Ali (ali@migrationrepublic.com.au).
- We have physical offices and local agents serving clients in major cities: Sydney, Melbourne, Brisbane, Adelaide, Perth, Canberra, and the Gold Coast, as well as serving international clients online.

Visa Pathways & Subclasses We Support:
1. Skilled Visas (Points-based):
   - Subclass 189 Skilled Independent Visa (https://migrationrepublic.com.au/subclass-189-visa/): Direct PR pathway without state/employer sponsorship.
   - Subclass 190 Skilled Nominated Visa (https://migrationrepublic.com.au/subclass-190-visa/): State-sponsored PR pathway (adds 5 points).
   - Subclass 491 Skilled Work Regional Visa (https://migrationrepublic.com.au/visa-subclass-491-australia/): 5-year provisional regional visa (adds 15 points), pathway to PR via Subclass 191.
   - Subclass 489 / 887 Skilled Regional (https://migrationrepublic.com.au/subclass-489-visa/): Regional pathways.
2. Employer Sponsored:
   - Subclass 482 Temporary Skill Shortage (TSS) Visa (https://migrationrepublic.com.au/subclass-482-visa-australia/): Temporary work visa (2-4 years), pathway to permanent residency.
   - Subclass 186 Employer Nomination Scheme (ENS) Visa (https://migrationrepublic.com.au/subclass-186-visa-australia/): Direct or transition PR sponsored by an employer.
   - Subclass 494 Skilled Employer Sponsored Regional Visa (https://migrationrepublic.com.au/subclass-494-visa-australia/): Regional employer-sponsored provisional visa.
3. Partner & Family Visas:
   - Subclass 820/801 Partner Visa (Onshore) (https://migrationrepublic.com.au/subclass-820-801-visa-australia/): For onshore couples.
   - Subclass 309/100 Partner Visa (Offshore) (https://migrationrepublic.com.au/subclass-309-100-visa-australia/): For offshore couples.
   - Subclass 300 Prospective Marriage Visa (https://migrationrepublic.com.au/subclass-300-visa-australia/): Fiance visa.
4. Student & Graduate Visas:
   - Subclass 500 Student Visa (https://migrationrepublic.com.au/subclass-500-visa/) & Subclass 590 Guardian (https://migrationrepublic.com.au/subclass-590-visa/).
   - Subclass 485 Temporary Graduate Visa (https://migrationrepublic.com.au/subclass-485-visa/): For post-study work rights.
5. Visitor & Other Visas:
   - Subclass 600 Visitor (https://migrationrepublic.com.au/subclass-600-visa/) & Subclass 651 eVisitor (https://migrationrepublic.com.au/subclass-651-visa-evisitor-visa-australia/).
   - Working Holiday Visa (Subclass 417) (https://migrationrepublic.com.au/visa-subclass-417/) & Work and Holiday Visa (Subclass 462) (https://migrationrepublic.com.au/visa-subclass-462/).
6. Business & Investment Visas:
   - Subclass 188 Business Innovation and Investment (Provisional) (https://migrationrepublic.com.au/subclass-188-visa/) & Subclass 888 Business Permanent (https://migrationrepublic.com.au/subclass-888-visa/).

Guidelines for Conversations:
- Format your replies with bullet points, numbered lists, and short paragraphs for readability.
- Maintain a helpful, optimistic yet legally responsible tone. Explain that immigration criteria (points, skills assessments, state lists) change frequently.
- Ground all information in the subclasses above and provide their direct links when discussing them.
- Always include calls-to-action to help the user:
  1. Recommend they take the **Free Visa Quiz** at \`/tools/visa-quiz\` to assess their points and eligibility instantly.
  2. Recommend they **Book a Consultation** with our MARA registered agents at \`https://migrationrepublic.com.au/book-a-consultation/\` for a detailed, custom migration strategy.
- If the user asks about specific cities (e.g. Adelaide, Brisbane, Sydney, Gold Coast, Canberra), mention that we have local agents specializing in state nomination programs (like South Australia's nomination program, Canberra Matrix, or Queensland Migration) and offer face-to-face as well as remote consultations.
- Never make up subclasses, visa requirements, or fees. Keep answers factual and refer complex matters to a professional consultation.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid or empty messages array" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in environment variables.");
      return NextResponse.json({ error: "API Key Configuration Error. Please contact site administrator." }, { status: 500 });
    }

    // Format chat history for Gemini REST API
    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // List of models to try in order of capability/preference.
    // Tries Gemini 2.5 Flash, Gemini 2.0 Flash, Gemini 1.5 Flash (latest alias), and standard Gemini 1.5 Flash.
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash"
    ];

    let responseData = null;
    let success = false;
    let lastErrorMsg = "";

    for (const model of modelsToTry) {
      try {
        console.log(`Attempting Gemini API request using model: ${model}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }],
            },
          }),
        });

        if (res.ok) {
          responseData = await res.json();
          success = true;
          console.log(`Gemini API Request SUCCESS with model: ${model}`);
          break;
        } else {
          const errorText = await res.text();
          console.warn(`Gemini model ${model} failed with status ${res.status}:`, errorText);
          lastErrorMsg = errorText;
        }
      } catch (err) {
        console.error(`Network error attempting Gemini model ${model}:`, err);
        lastErrorMsg = err instanceof Error ? err.message : "Fetch network error";
      }
    }

    if (!success) {
      console.error("All Gemini models failed to generate content. Last error details:", lastErrorMsg);
      return NextResponse.json({
        error: "All attempts to generate response from Gemini API failed. Please verify API key permissions and model access."
      }, { status: 502 });
    }

    const responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("No text found in final successful Gemini response:", JSON.stringify(responseData));
      return NextResponse.json({ error: "No response text generated by the model" }, { status: 500 });
    }

    return NextResponse.json({ text: responseText });
  } catch (error) {
    console.error("Critical error in AI Chat API route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred during message generation" },
      { status: 500 }
    );
  }
}
