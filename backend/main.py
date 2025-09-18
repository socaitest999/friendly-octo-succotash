import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import httpx

app = FastAPI()

# Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local dev; restrict in prod!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReportRequest(BaseModel):
    company_domains: list[str]
    company_name: str
    industry: str
    gemini_api_key: str = ""
    openai_api_key: str = ""

def build_osint_prompt(company_domains, company_name, industry):
    domains = ', '.join(company_domains)
    return f"""
You are an advanced cyber threat intelligence analyst. Generate an up-to-date, detailed, and comprehensive threat intelligence report for the company '{company_name}' in the '{industry}' sector. Use the following domains as OSINT starting points: {domains}.

Your report must include:
- Employee Intelligence: Executive team (names, titles, backgrounds, tenure, social presence); Real employee count and org breakdown (technical, security, research, marketing, etc.); Exposure data (LinkedIn, GitHub, breached emails, publications, social media).
- Technical Infrastructure: Domain portfolio, subdomains, IP ranges, SSL cert details, DNS/email security, cloud provider, CDN, email stack.
- Recent Threats & Actors: At least 8 relevant threat actors, 8+ recent campaigns (year: 2025); TTPs, victim/impact info.
- MITRE ATT&CK: 15–20 techniques, frequency, actor attribution.
- Executive summary, technical findings, recommendations, strategic insights.

Output MUST be realistic, current, and actionable. Do **not** use placeholders or say 'analysis pending'. All details must reflect real, up-to-date OSINT.

Present the report as a single, comprehensive document. No dropdowns, no options—everything is always shown.
"""

async def call_gemini(prompt, api_key):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
            params={"key": api_key},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=120
        )
        resp.raise_for_status()
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]

async def call_openai(prompt, api_key):
    openai.api_key = api_key
    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are a cyber threat intelligence analyst."},
                  {"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=4096
    )
    return response.choices[0].message['content']

@app.post("/generate_report")
async def generate_report(req: ReportRequest):
    prompt = build_osint_prompt(req.company_domains, req.company_name, req.industry)
    try:
        if req.gemini_api_key:
            report = await call_gemini(prompt, req.gemini_api_key)
        elif req.openai_api_key:
            report = await call_openai(prompt, req.openai_api_key)
        else:
            return JSONResponse({"error": "No API key provided."}, status_code=400)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    return {"report": report}