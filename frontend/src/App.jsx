import React, { useState } from "react";
import { TextField, Button, Box, Typography, Paper, CircularProgress } from "@mui/material";
import axios from "axios";

function App() {
  const [companyDomains, setCompanyDomains] = useState([""]);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");

  const handleDomainChange = (idx, value) => {
    const newDomains = [...companyDomains];
    newDomains[idx] = value;
    setCompanyDomains(newDomains);
  };
  const addDomain = () => setCompanyDomains([...companyDomains, ""]);
  const removeDomain = (idx) => setCompanyDomains(companyDomains.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setReport("");
    setLoading(true);
    try {
      const resp = await axios.post(
        import.meta.env.VITE_API_URL + "/generate_report",
        {
          company_domains: companyDomains.filter(x => x.trim()),
          company_name: companyName,
          industry,
          gemini_api_key: geminiApiKey,
          openai_api_key: openaiApiKey
        }
      );
      setReport(resp.data.report);
    } catch (e) {
      setReport(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1100, margin: "auto" }}>
      <Typography variant="h4" mb={2}>Threat Intelligence Report Generator (PaaS)</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Company Information</Typography>
        {companyDomains.map((domain, idx) => (
          <Box key={idx} display="flex" alignItems="center" mb={1}>
            <TextField
              label={`Domain/Website #${idx + 1}`}
              value={domain}
              onChange={e => handleDomainChange(idx, e.target.value)}
              sx={{ mr: 1, flex: 1 }}
            />
            {companyDomains.length > 1 && (
              <Button color="error" onClick={() => removeDomain(idx)}>Remove</Button>
            )}
          </Box>
        ))}
        <Button onClick={addDomain} sx={{ mb: 2 }}>Add Another Domain</Button>
        <TextField
          fullWidth label="Company Name" value={companyName}
          onChange={e => setCompanyName(e.target.value)} sx={{ mb: 2 }}
        />
        <TextField
          fullWidth label="Industry" value={industry}
          onChange={e => setIndustry(e.target.value)} sx={{ mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary" mb={1}>
          (Optional) Provide Gemini API key for enhanced OSINT data gathering:
        </Typography>
        <TextField
          fullWidth label="Gemini API Key" value={geminiApiKey}
          onChange={e => setGeminiApiKey(e.target.value)} sx={{ mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary" mb={1}>
          (Optional) Provide OpenAI API key as fallback:
        </Typography>
        <TextField
          fullWidth label="OpenAI API Key" value={openaiApiKey}
          onChange={e => setOpenaiApiKey(e.target.value)} sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !companyName || !industry || !companyDomains.some(x => x.trim())}
        >
          Generate Threat Intelligence Report
        </Button>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>Report Output</Typography>
        {loading && <CircularProgress />}
        {report && (
          <Box sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
            {report}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default App;