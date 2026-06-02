import OpenAI from "openai";

const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

export const isAiEnabled = !!(baseURL && apiKey);

export const openai = new OpenAI({
  apiKey: apiKey ?? "placeholder",
  baseURL: baseURL ?? "https://api.openai.com/v1",
});
