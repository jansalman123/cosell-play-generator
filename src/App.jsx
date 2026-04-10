import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateSalesPlay } from './utils/gemini';

const INDUSTRIES = [
  "Healthcare & Life Sciences",
  "Financial Services & Banking",
  "Retail & Consumer Goods",
  "Manufacturing & Logistics",
  "Media, Entertainment & Telco",
  "Public Sector"
];

const GCP_OFFERINGS = [
  { id: "vertex", name: "Vertex AI Platform", desc: "Unified ML/AI development platform" },
  { id: "gemini", name: "Gemini Models", desc: "Multimodal foundation models" },
  { id: "automl", name: "AutoML", desc: "Train custom models with minimal code" },
  { id: "bqml", name: "BigQuery ML", desc: "Machine learning built into the data warehouse" },
  { id: "cai", name: "Conversational AI", desc: "Dialogflow and Contact Center AI" }
];

const COGNIZANT_OFFERINGS = [
  { id: "neuro_ai", name: "Cognizant Neuro® AI", desc: "Enterprise-grade agentic AI lifecycle platform" },
  { id: "multi_agent", name: "Multi-Agent Accelerator", desc: "Orchestrate complex networks of intelligent agents" },
  { id: "neuro_edge", name: "Cognizant Neuro® Edge", desc: "Bring GenAI capabilities closer to data sources" },
  { id: "data_ai", name: "Data & AI Modernization Services", desc: "Consulting & engineering for AI readiness" },
  { id: "ai_gov", name: "AI Assurance & Governance", desc: "ISO 42001:2023 certified AI compliance and security" }
];

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isConfigured, setIsConfigured] = useState(!!localStorage.getItem('gemini_api_key'));
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    industry: INDUSTRIES[0],
    painPoint: '',
    gcpOfferings: [],
    cognizantOfferings: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [error, setError] = useState(null);

  const saveApiKey = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setIsConfigured(true);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setIsConfigured(false);
  };

  const handleToggle = (type, item) => {
    setFormData(prev => {
      const list = prev[type];
      if (list.includes(item.name)) {
        return { ...prev, [type]: list.filter(i => i !== item.name) };
      } else {
        return { ...prev, [type]: [...list, item.name] };
      }
    });
  };

  const handleGenerate = async () => {
    if (formData.gcpOfferings.length === 0 || formData.cognizantOfferings.length === 0 || !formData.painPoint.trim()) {
      setError("Please ensure you have entered a pain point and selected at least one offering from both GCP and Cognizant.");
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    try {
      const result = await generateSalesPlay(apiKey, formData);
      setGeneratedResult(result);
      setStep(4); // View Result
    } catch (err) {
      setError("Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetFlow = () => {
    setGeneratedResult(null);
    setStep(1);
    setFormData({
      industry: INDUSTRIES[0],
      painPoint: '',
      gcpOfferings: [],
      cognizantOfferings: []
    });
  };

  if (!isConfigured) {
    return (
      <div className="main-container animate-fade-in" style={{ paddingTop: '10vh' }}>
        <header className="app-header">
          <h1>Cosell Sales Play Generator</h1>
          <p className="app-subtitle">Built for GCP & Cognizant Joint Go-To-Market Motions</p>
        </header>

        <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2>API Configuration</h2>
          <p>Please enter your Gemini API key to enable document generation. This runs entirely in your browser.</p>
          <form onSubmit={saveApiKey}>
            <div className="input-group">
              <label className="input-label">Gemini API Key</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                placeholder="AIzaSy..."
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save & Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container animate-fade-in">
      <header className="app-header" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>GCP + Cognizant</h1>
          <p style={{ margin: 0 }}>Sales Play Generator</p>
        </div>
        <button onClick={clearApiKey} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
          Reset API Key
        </button>
      </header>

      {error && (
        <div className="glass-panel" style={{ border: '1px solid #ff4d4f', background: 'rgba(255, 77, 79, 0.1)', marginBottom: '2rem', padding: '1rem' }}>
          <p style={{ color: '#ff4d4f', margin: 0 }}>{error}</p>
        </div>
      )}

      {step === 1 && (
        <div className="glass-panel animate-fade-in">
          <h2>Step 1: Client Context</h2>
          <div className="input-group">
            <label className="input-label">Target Industry</label>
            <select 
              value={formData.industry} 
              onChange={e => setFormData({...formData, industry: e.target.value})}
            >
              {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ marginTop: '1.5rem' }}>
            <label className="input-label">Primary Business Pain Point</label>
            <textarea 
              rows={4}
              placeholder="e.g., Struggling to unify customer data across fragmented systems, leading to poor personalization and lost sales..."
              value={formData.painPoint}
              onChange={e => setFormData({...formData, painPoint: e.target.value})}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setStep(2)}
              disabled={!formData.painPoint.trim()}
            >
              Next: Select GCP Offerings
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="glass-panel animate-fade-in">
          <h2>Step 2: GCP AI Offerings</h2>
          <p>Select the Google Cloud Platform technologies anchoring this play.</p>
          
          <div className="checkbox-grid">
            {GCP_OFFERINGS.map(item => {
              const selected = formData.gcpOfferings.includes(item.name);
              return (
                <div 
                  key={item.id} 
                  className={`checkbox-card ${selected ? 'selected' : ''}`}
                  onClick={() => handleToggle('gcpOfferings', item)}
                >
                  <div className="checkbox-label-title">{item.name}</div>
                  <div className="checkbox-label-desc">{item.desc}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Select Cognizant Offerings</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass-panel animate-fade-in">
          <h2>Step 3: Cognizant AI Offerings</h2>
          <p>Select the Cognizant services and accelerators completing the joint solution.</p>
          
          <div className="checkbox-grid">
            {COGNIZANT_OFFERINGS.map(item => {
              const selected = formData.cognizantOfferings.includes(item.name);
              return (
                <div 
                  key={item.id} 
                  className={`checkbox-card ${selected ? 'selected' : ''}`}
                  onClick={() => handleToggle('cognizantOfferings', item)}
                >
                  <div className="checkbox-label-title">{item.name}</div>
                  <div className="checkbox-label-desc">{item.desc}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)} disabled={isGenerating}>Back</button>
            <button 
              className="btn btn-primary" 
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><div className="spinner"></div> Generating Play...</>
              ) : (
                'Generate Sales Play'
              )}
            </button>
          </div>
        </div>
      )}

      {step === 4 && generatedResult && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Generated Sales Play</h2>
            <button className="btn btn-secondary" onClick={resetFlow}>Create Another</button>
          </div>
          <div className="glass-panel markdown-container">
            <ReactMarkdown>{generatedResult}</ReactMarkdown>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
