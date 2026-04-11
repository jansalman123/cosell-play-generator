import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { extractSlidesFromPlaybook } from './utils/gemini';
import { runAutonomousArchitectLoop } from './utils/agentEngine';
import { generateAndDownloadPPTX } from './utils/pptExport';

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
  const ENV_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
  const [apiKey, setApiKey] = useState(() => ENV_KEY || localStorage.getItem('gemini_api_key') || '');
  const [isConfigured, setIsConfigured] = useState(() => !!ENV_KEY || !!localStorage.getItem('gemini_api_key'));
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    industry: INDUSTRIES[0],
    painPoint: '',
    gcpOfferings: [],
    cognizantOfferings: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  
  const [execPlaybook, setExecPlaybook] = useState(null);
  const [techPlaybook, setTechPlaybook] = useState(null);
  const [activeTab, setActiveTab] = useState('executive'); // 'executive' or 'technical'
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

  const handleGeneratePlaybook = async () => {
    if (formData.gcpOfferings.length === 0 || formData.cognizantOfferings.length === 0 || !formData.painPoint.trim()) {
      setError("Please ensure you have entered a pain point and selected at least one offering from both GCP and Cognizant.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setAgentLogs(["[System] Initializing Dual Engine Protocol..."]); 
    
    try {
      const executiveDocs = await runAutonomousArchitectLoop(apiKey, formData, (msg) => {
        setAgentLogs(prev => [...prev, msg]);
      }, true);
      setExecPlaybook(executiveDocs);

      setAgentLogs(prev => [...prev, "\n============================================\n", "[System] C-Suite Framework Generated. Pivoting Engine State to Deep Architectural Integration..."]);

      const technicalDocs = await runAutonomousArchitectLoop(apiKey, formData, (msg) => {
        setAgentLogs(prev => [...prev, msg]);
      }, false);
      setTechPlaybook(technicalDocs);

      setStep(4); // View Playbook Document Tab
    } catch (err) {
      setError("Playbook autonomous engine failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMarkdown = (content, title) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '_')}_Playbook.md`;
    document.body.appendChild(element);
    element.click();
  };

  const handleSummarizeToPPT = async () => {
    setError(null);
    setIsSummarizing(true);
    try {
      const activeContent = activeTab === 'executive' ? execPlaybook : techPlaybook;
      const result = await extractSlidesFromPlaybook(apiKey, activeContent, activeTab);
      setGeneratedResult(result);
      setStep(5); // View Slide Previews
    } catch (err) {
      setError("PPT summarization failed: " + err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  const resetFlow = () => {
    setExecPlaybook(null);
    setTechPlaybook(null);
    setAgentLogs([]);
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
              onClick={handleGeneratePlaybook}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><div className="spinner"></div> Agents Iterating...</>
              ) : (
                'Launch Dual-Autonomous Engine'
              )}
            </button>
          </div>

          {isGenerating && (
            <div className="agent-terminal animate-fade-in" style={{
              background: '#0a0a0a', 
              color: '#00ff41', 
              fontFamily: 'monospace', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              marginTop: '2rem', 
              minHeight: '150px',
              maxHeight: '300px',
              overflowY: 'auto',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,1)'
            }}>
              <div style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#888' }}>
                -- Autonomous Orchestration Engine --
              </div>
              {agentLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: '0.4rem', lineHeight: '1.4' }}>
                  <span style={{ color: '#fff' }}>&gt;</span> {log}
                </div>
              ))}
              <div className="pulsing-cursor" style={{ animation: 'blink 1s step-end infinite', display: 'inline-block', width: '8px', height: '15px', background: '#00ff41', marginTop: '0.5rem' }}></div>
            </div>
          )}
        </div>
      )}

      {step === 4 && execPlaybook && techPlaybook && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className={`btn ${activeTab === 'executive' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setActiveTab('executive')}
                style={activeTab === 'executive' ? { background: '#10b981', borderColor: '#10b981', color: '#ffffff' } : {}}
              >
                Executive Strategy View
              </button>
              <button 
                className={`btn ${activeTab === 'technical' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setActiveTab('technical')}
              >
                Technical Architecture View
              </button>
            </div>
            <div>
               <button className="btn btn-secondary" style={{ marginRight: '1rem' }} onClick={resetFlow} disabled={isSummarizing}>
                 Start Over
               </button>
               <button className="btn btn-primary" onClick={handleSummarizeToPPT} disabled={isSummarizing}>
                  {isSummarizing ? (
                    <><div className="spinner"></div> Summarizing...</>
                  ) : (
                    `Summarize into ${activeTab === 'executive' ? 'Executive' : 'Technical'} PPT`
                  )}
               </button>
            </div>
          </div>
          
          <div className="glass-panel markdown-body" style={{ background: '#f8f9fa', color: '#1f2937', padding: '2.5rem', borderRadius: '12px', textAlign: 'left', overflowY: 'auto', maxHeight: '65vh', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.8rem', padding: '0.5rem' }} 
                onClick={() => activeTab === 'executive' ? downloadMarkdown(execPlaybook, 'GTM_Executive') : downloadMarkdown(techPlaybook, 'Technical_Architecture')}
              >
                📥 Download {activeTab === 'executive' ? 'Executive' : 'Technical'} Document (.md)
              </button>
            </div>
            <ReactMarkdown>{activeTab === 'executive' ? execPlaybook : techPlaybook}</ReactMarkdown>
          </div>
        </div>
      )}

      {step === 5 && generatedResult && generatedResult.slides && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>2. {activeTab === 'executive' ? 'Executive' : 'Technical'} Slide Preview</h2>
            <div>
               <button className="btn btn-secondary" style={{ marginRight: '1rem' }} onClick={() => setStep(4)}>Back to Playbook</button>
               <button className="btn btn-primary" onClick={() => generateAndDownloadPPTX(generatedResult, formData)}>
                  ⇩ Download Full Presentation
               </button>
            </div>
          </div>
          
          <div className="slides-preview-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {generatedResult.slides.map((slide, index) => (
               <div key={index} className="glass-panel" style={{ borderLeft: '4px solid #4285F4', padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.5rem', color: '#fff', marginTop: 0 }}>{slide.title}</h3>
                  {slide.subtitle && <p style={{ color: '#4285F4', fontStyle: 'italic', fontWeight: 'bold' }}>{slide.subtitle}</p>}
                  
                  <ul style={{ listStyleType: 'none', paddingLeft: 0, marginTop: '1.5rem' }}>
                    {slide.bulletPoints && slide.bulletPoints.map((point, i) => (
                      <li key={i} style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#f0f6fc', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
               </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
