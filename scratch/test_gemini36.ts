import fs from "fs";
import { GeminiProvider } from "../src/lib/ai/providers/gemini";
import {
  WASTE_ANALYZER_SYSTEM_PROMPT,
  buildWasteAnalyzerUserPrompt,
} from "../src/lib/ai/prompts/waste-analyzer";

// Load environment variables
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

async function testGemini36() {
  process.env.AI_MODEL = "gemini-3.6-flash";
  const imageBuffer = fs.readFileSync("scratch/test_mango_peel.jpg");
  const imageBase64 = imageBuffer.toString("base64");

  const provider = new GeminiProvider();
  const userPrompt = buildWasteAnalyzerUserPrompt({
    wasteBatchCode: "MW-2026-LIVE8",
    wasteTypeHint: "mango_peel",
  });

  console.log("Testing gemini-3.6-flash with image...");
  const start = Date.now();
  const res = await provider.analyzeImage({
    systemPrompt: WASTE_ANALYZER_SYSTEM_PROMPT,
    userPrompt,
    imageMimeType: "image/jpeg",
    imageBase64,
  });

  console.log(`Success in ${Date.now() - start}ms! Model: ${res.model}`);
  console.log("Output content:", res.rawContent);
}

testGemini36().catch(console.error);
