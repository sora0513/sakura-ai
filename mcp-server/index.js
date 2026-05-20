import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import OpenAI from "openai";

if (!process.env.SAKURA_API_KEY) {
  process.stderr.write("ERROR: SAKURA_API_KEY is not set\n");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: process.env.SAKURA_API_KEY,
  baseURL: process.env.SAKURA_API_URL || "https://api.ai.sakura.ad.jp/v1",
});

const MODELS = {
  kimi: "preview/Kimi-K2.6",
  coder: "Qwen3-Coder-480B-A35B-Instruct-FP8",
  "coder-light": "Qwen3-Coder-30B-A3B-Instruct",
  "gpt-oss": "gpt-oss-120b",
  "llm-jp": "llm-jp-3.1-8x13b-instruct4",
};

const server = new McpServer({
  name: "sakura-ai",
  version: "1.0.0",
});

server.tool(
  "sakura_chat",
  "Send a prompt to Sakura AI Engine. Models: kimi (best), coder (code generation), coder-light (fast code), gpt-oss (general), llm-jp (Japanese)",
  {
    prompt: z.string().describe("The prompt to send"),
    model: z
      .enum(["kimi", "coder", "coder-light", "gpt-oss", "llm-jp"])
      .default("kimi")
      .describe("Model alias"),
    system: z
      .string()
      .default("You are a helpful assistant.")
      .describe("System prompt"),
  },
  async ({ prompt, model, system }) => {
    try {
      const response = await client.chat.completions.create({
        model: MODELS[model] || MODELS["kimi"],
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      });
      return {
        content: [
          { type: "text", text: response.choices[0]?.message?.content || "No response" },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

server.tool(
  "sakura_code_review",
  "Review code diff against a spec using Sakura AI Engine",
  {
    diff: z.string().describe("Git diff to review"),
    spec: z.string().describe("Implementation spec to review against"),
  },
  async ({ diff, spec }) => {
    try {
      const response = await client.chat.completions.create({
        model: MODELS["gpt-oss"],
        messages: [
          {
            role: "system",
            content:
              "You are a senior code reviewer. Review the diff against the spec. Reply with APPROVE, REQUEST_CHANGES, or REJECT followed by your reasoning.",
          },
          {
            role: "user",
            content: `## Spec\n${spec}\n\n## Diff\n${diff}`,
          },
        ],
        temperature: 0.2,
      });
      return {
        content: [
          { type: "text", text: response.choices[0]?.message?.content || "No response" },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

server.tool(
  "sakura_generate_spec",
  "Generate implementation spec from a GitHub issue description",
  {
    issue_title: z.string().describe("Issue title"),
    issue_body: z.string().describe("Issue body/description"),
    context: z
      .string()
      .default("")
      .describe("Additional context (file structure, related code)"),
  },
  async ({ issue_title, issue_body, context }) => {
    try {
      const response = await client.chat.completions.create({
        model: MODELS["coder"],
        messages: [
          {
            role: "system",
            content: `You are a senior software architect. Generate a detailed implementation spec.
Include:
- Target files (new/modified)
- Implementation approach
- Completion criteria (checklist)
- Suggested PR title
- Estimated PR size`,
          },
          {
            role: "user",
            content: `## Issue: ${issue_title}\n\n${issue_body}\n\n## Context\n${context || "None"}`,
          },
        ],
        temperature: 0.3,
      });
      return {
        content: [
          { type: "text", text: response.choices[0]?.message?.content || "No response" },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

server.tool(
  "sakura_generate_code",
  "Generate code implementation from a spec using Qwen3-Coder",
  {
    spec: z.string().describe("Implementation spec"),
    existing_code: z
      .string()
      .default("")
      .describe("Existing code to modify"),
    language: z
      .string()
      .default("typescript")
      .describe("Programming language"),
  },
  async ({ spec, existing_code, language }) => {
    try {
      const response = await client.chat.completions.create({
        model: MODELS["coder"],
        messages: [
          {
            role: "system",
            content: `You are a senior ${language} developer. Generate clean, production-ready code based on the spec.`,
          },
          {
            role: "user",
            content: `## Spec\n${spec}\n\n## Existing Code\n${existing_code || "New file"}`,
          },
        ],
        temperature: 0.2,
      });
      return {
        content: [
          { type: "text", text: response.choices[0]?.message?.content || "No response" },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

server.tool(
  "sakura_sales_email",
  "Generate personalized outreach email using Sakura AI Engine",
  {
    company_name: z.string().describe("Target company name"),
    contact_name: z.string().describe("Contact person name"),
    your_product: z.string().describe("Your product/service description (1-2 sentences)"),
    signal_info: z
      .string()
      .default("")
      .describe("Signal/research info about the target company"),
    sender_name: z
      .string()
      .default("")
      .describe("Your name and title for the email signature"),
  },
  async ({ company_name, contact_name, your_product, signal_info, sender_name }) => {
    try {
      const response = await client.chat.completions.create({
        model: MODELS["gpt-oss"],
        messages: [
          {
            role: "system",
            content: `Write a brief, genuine outreach email about: ${your_product}. Keep it under 150 words. Be direct, not salesy.${sender_name ? ` Sign as ${sender_name}.` : ""}`,
          },
          {
            role: "user",
            content: `Company: ${company_name}\nContact: ${contact_name}\nSignal: ${signal_info || "No specific signal"}`,
          },
        ],
        temperature: 0.5,
      });
      return {
        content: [
          { type: "text", text: response.choices[0]?.message?.content || "No response" },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
