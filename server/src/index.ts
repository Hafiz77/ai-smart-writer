import * as docx from 'docx';
import fs from 'fs';
import mammoth from 'mammoth';
import multer from 'multer';


import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
console.log('OPENAI_API_KEY:  ', OPENAI_API_KEY);

let openai: OpenAI | null;
if (OPENAI_API_KEY) {
  console.log('API Hit................');
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
} else {
  openai = null;
  console.warn('OpenAI API key not set.');
}

function buildEmailPrompt(subject: string, points: string, tone: string) {
  return `You are an expert email writing assistant. Write a ${tone} email.\nSubject: ${subject}\nKey points/context: ${points}\n\nReturn only the email body, with greeting, body, and sign-off.`;
}

function buildRewritePrompt(content: string, tone: string) {
  return `Rewrite the following text in a ${tone} tone. Improve clarity and flow, preserve meaning.\n---\n${content}\n---`;
}

function buildGrammarPrompt(content: string) {
  return `Proofread and correct the following text. Fix grammar, punctuation, and style while preserving meaning. Return only the corrected text.\n---\n${content}\n---`;
}

async function callOpenAIChat(prompt: string, temperature = 0.7) {
  if (!openai) throw new Error('OpenAI not configured');
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature
  });
  return resp.choices?.[0]?.message?.content ?? '';
}

app.post('/api/generate-email', async (req, res) => {
  try {
    const { subject = '', points = '', tone = 'Professional', inputLanguage, outputLanguage } = req.body || {};
    // If no language options, use original logic
    if (!inputLanguage && !outputLanguage) {
      const prompt = buildEmailPrompt(subject, points, tone);
      const email = await callOpenAIChat(prompt, 0.7);
      return res.json({ email });
    }

    // Step 1: Generate email in input language
    const emailPrompt = buildEmailPrompt(subject, points, tone);
    let email = await callOpenAIChat(emailPrompt, 0.7);

    // Step 2: Translate to output language if needed
    if (inputLanguage && outputLanguage && inputLanguage !== outputLanguage) {
      const translatePrompt = `Translate the following email from ${inputLanguage} to ${outputLanguage}. Return only the translated email body.\n---\n${email}\n---`;
      email = await callOpenAIChat(translatePrompt, 0.7);
    }

    // Step 3: Grammar check (optional, now active)
    if (outputLanguage) {
      const grammarPrompt = buildGrammarPrompt(email);
      email = await callOpenAIChat(grammarPrompt, 0.2);
    }
    res.json({ email });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || 'Error generating email' });
  }
});

app.post('/api/rewrite-article', async (req, res) => {
  try {
    const { content = '', tone = 'Professional' } = req.body || {};
    const prompt = buildRewritePrompt(content, tone);
    const rewritten = await callOpenAIChat(prompt, 0.7);
    res.json({ rewritten });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || 'Error rewriting article' });
  }
});

app.post('/api/grammar-check', async (req, res) => {
  try {
    const { content = '' } = req.body || {};
    const prompt = buildGrammarPrompt(content);
    const corrected = await callOpenAIChat(prompt, 0.2);
    res.json({ corrected });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || 'Error checking grammar' });
  }
});

app.post('/api/generate-article', async (req, res) => {
  try {
    const { content = '', tone = 'Professional' } = req.body || {};
    // Step 1: Generate article
    const prompt = `Write a detailed article in a ${tone} tone. Content/context: ${content}\n\nReturn only the article body.`;
    let article = await callOpenAIChat(prompt, 0.7);
    // Step 2: Grammar check
    const grammarPrompt = buildGrammarPrompt(article);
    article = await callOpenAIChat(grammarPrompt, 0.2);
    res.json({ article });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || 'Error generating article' });
  }
});

const upload = multer({ dest: 'uploads/' });
app.post('/api/docx-summary', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    // AI summary
    const prompt = `Summarize the following document content in a concise paragraph:\n---\n${text}\n---`;
    const summary = await callOpenAIChat(prompt, 0.5);
    fs.unlinkSync(filePath);
    res.json({ summary });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || 'Error summarizing document' });
  }
});

const port = Number(process.env.PORT || 5050);
app.listen(port, () => console.log(`AI Smart Writer API listening on http://localhost:${port}`));
