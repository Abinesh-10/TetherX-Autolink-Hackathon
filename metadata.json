
import React, { useState, useEffect } from 'react';
import { AnalysisResult, AnalysisMode, DataIssue } from './types';
import { runAnalysis } from './services/analysisEngine';
import { getHistory, saveAnalysis } from './services/historyService';
import { generateExecutiveSummary } from './services/geminiService';
import { FileText, Search, InfoIcon, CheckIcon, AlertCircle } from './components/Icons';

declare const Papa: any;
declare const window: any;

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'new-analysis' | 'results'>('landing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'columns' | 'quality' | 'predictive'>('summary');
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);
  
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [mode, setMode] = useState<AnalysisMode>('Auto');

  useEffect(() => {
    setHistory(getHistory());
    
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(selected);
      }
    };
    checkKey();

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setIsKeySelected(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setView('new-analysis');
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    if (!isKeySelected) {
      handleConnectKey();
      return;
    }

    setIsProcessing(true);
    setAiSummary(''); 
    
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        try {
          const analysis = await runAnalysis(results.data, file.name, targetColumn, mode);
          setCurrentResult(analysis);
          saveAnalysis(analysis);
          setHistory(getHistory());
          setView('results');

          try {
            const summary = await generateExecutiveSummary(analysis);
            setAiSummary(summary);
          } catch (aiError: any) {
            console.error("AI Insight Error:", aiError);
            if (aiError.message?.includes("Requested entity was not found")) {
              setIsKeySelected(false);
              setAiSummary("AI connection lost. Please reconnect.");
            } else {
              setAiSummary("#### Summary Unavailable\nStatistical data is ready. AI failed to generate the summary.");
            }
          }
        } catch (error) {
          alert("Analysis failed.");
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const renderLanding = () => (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 font-medium text-sm mb-6 border border-indigo-100">
          ✨ Powered by Gemini 3 Flash
        </div>
        <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
          AIDA <span className="text-indigo-600">Autonomous Analyst</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          The world's first AI-driven browser-side data scientist. Get executive insights, health scores, and predictive models in seconds.
        </p>
        
        {!isKeySelected && (
          <div className="mb-10 p-6 bg-amber-50 border border-amber-200 rounded-2xl max-w-lg mx-auto text-amber-800">
            <h3 className="font-bold mb-2 flex items-center justify-center gap-2">
              <AlertCircle /> Connection Required
            </h3>
            <p className="text-sm mb-4">To enable AI insights and Gemini-powered summaries, you must connect your Google AI Studio key.</p>
            <button onClick={handleConnectKey} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md">
              Connect to AI Studio
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl shadow-indigo-200 transition-all flex items-center gap-2">
            <FileText />
            Upload CSV to Start
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-20">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Search /> Recent Analyses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {history.map((h) => (
              <button 
                key={h.id} 
                onClick={() => { setCurrentResult(h); setView('results'); }}
                className="bg-white p-6 rounded-2xl border border-slate-200 text-left hover:border-indigo-300 hover:shadow-lg transition-all"
              >
                <div className="text-sm font-medium text-indigo-600 mb-1">{h.fileName}</div>
                <div className="text-xl font-bold text-slate-900 mb-2">{h.rowCount.toLocaleString()} Rows</div>
                <div className="flex gap-4 text-sm text-slate-500">
                  <span>{h.columnCount} Cols</span>
                  <span>{new Date(h.timestamp).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderConfig = () => (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200 border border-slate-100">
        <h2 className="text-3xl font-bold mb-8">Analysis Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Selected File</label>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><FileText /></div>
              <span className="font-medium truncate">{file?.name || 'Selected CSV'}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Target Column (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. 'Survived' or 'Price'"
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Analysis Mode</label>
            <div className="grid grid-cols-2 gap-4">
              {['Auto', 'Regression', 'Classification', 'Just Explore'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m as AnalysisMode)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${mode === m ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <div className={`font-bold ${mode === m ? 'text-indigo-700' : 'text-slate-700'}`}>{m}</div>
                </button>
              ))}
            </div>
          </div>
          <button 
            disabled={isProcessing}
            onClick={startAnalysis}
            className={`w-full text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 ${isKeySelected ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-100'}`}
          >
            {isProcessing ? "Processing..." : isKeySelected ? 'Run Analysis' : 'Connect & Run'}
          </button>
        </div>
      </div>
    </div>
  );

  const formatMarkdown = (text: string) => {
    // Basic Markdown formatting to HTML
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 text-indigo-300">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 text-white">$1</h2>')
      .replace(/^\*\* (.*$)/gim, '<div class="font-bold text-indigo-200 mt-4">$1</div>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 mb-2">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const renderResults = () => {
    if (!currentResult) return null;
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button onClick={() => setView('landing')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2">
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold text-slate-900">{currentResult.fileName} Analysis</h1>
          </div>
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            {(['summary', 'columns', 'quality', 'predictive'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap ${activeTab === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider">Total Samples</div>
                <div className="text-4xl font-extrabold text-slate-900">{currentResult.rowCount.toLocaleString()}</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider">Features</div>
                <div className="text-4xl font-extrabold text-slate-900">{currentResult.columnCount}</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider">Quality Issues</div>
                <div className={`text-4xl font-extrabold ${currentResult.issues.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {currentResult.issues.length}
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider">Target</div>
                <div className="text-xl font-bold text-slate-900 truncate">{targetColumn || 'N/A'}</div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-600 rounded-lg"><InfoIcon /></div>
                <h3 className="text-2xl font-bold tracking-tight">Executive Insight Report</h3>
              </div>
              <div className="max-w-4xl">
                {aiSummary ? (
                   <div 
                    className="space-y-4 text-slate-300 text-lg leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(aiSummary) }} 
                   />
                ) : (
                  <div className="flex flex-col gap-4 animate-pulse">
                    <div className="h-6 bg-slate-800 rounded w-full"></div>
                    <div className="h-6 bg-slate-800 rounded w-5/6"></div>
                    <div className="h-6 bg-slate-800 rounded w-2/3"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Automated Insights</h3>
                <div className="space-y-4">
                  {currentResult.hypotheses.slice(0, 3).map((h, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                      <div className={`shrink-0 w-2 h-2 mt-2 rounded-full ${h.strength === 'strong' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{h.title}</div>
                        <div className="text-sm text-slate-600">{h.conclusion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Data Quality Alert</h3>
                <div className="space-y-4">
                  {currentResult.issues.length === 0 ? (
                    <div className="p-6 text-center">
                       <CheckIcon />
                       <p className="mt-2 text-slate-500 text-sm font-medium">Clean dataset detected.</p>
                    </div>
                  ) : (
                    currentResult.issues.slice(0, 3).map((issue, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-100">
                        <div className={`p-2 rounded-lg shrink-0 ${issue.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}><AlertCircle /></div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{issue.column}</div>
                          <div className="text-sm text-slate-600">{issue.description}</div>
                        </div>
                      </div>
                    ))
                  )}
                  {currentResult.issues.length > 3 && (
                    <button onClick={() => setActiveTab('quality')} className="w-full text-center text-indigo-600 font-bold text-sm py-2 bg-slate-50 rounded-xl hover:bg-slate-100">
                      Show {currentResult.issues.length - 3} more issues
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">Data Quality Deep-Dive</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentResult.issues.length === 0 ? (
                <div className="md:col-span-2 bg-white p-20 rounded-3xl text-center border border-slate-100">
                  <div className="text-emerald-500 mb-4 flex justify-center scale-150"><CheckIcon /></div>
                  <h4 className="text-xl font-bold">Perfect Health!</h4>
                  <p className="text-slate-500">No data quality issues detected.</p>
                </div>
              ) : (
                currentResult.issues.map((issue, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-start gap-6">
                    <div className={`p-4 rounded-2xl ${issue.severity === 'high' ? 'bg-red-50 text-red-600' : issue.severity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      <AlertCircle />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-black text-slate-900 text-lg uppercase tracking-tight">{issue.column}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${issue.severity === 'high' ? 'bg-red-600 text-white' : issue.severity === 'medium' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-slate-700 mb-1 font-semibold">{issue.type.split('_').join(' ').toUpperCase()}</p>
                      <p className="text-slate-500 text-sm">{issue.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'columns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentResult.columns.map((col, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-lg text-slate-900 truncate pr-2">{col.name}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${col.type === 'numeric' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {col.type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Missing</div>
                    <div className="text-lg font-bold">{col.missingPercentage.toFixed(1)}%</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Unique</div>
                    <div className="text-lg font-bold">{col.uniqueCount}</div>
                  </div>
                </div>
                {col.type === 'numeric' && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-slate-50 pt-4">
                    <span className="text-slate-500">Mean:</span><span className="font-bold text-right">{col.mean?.toFixed(2)}</span>
                    <span className="text-slate-500">Median:</span><span className="font-bold text-right">{col.median?.toFixed(2)}</span>
                    <span className="text-slate-500">Min:</span><span className="font-bold text-right">{col.min}</span>
                    <span className="text-slate-500">Max:</span><span className="font-bold text-right">{col.max}</span>
                  </div>
                )}
                {col.topValues && (
                  <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                    {col.topValues.slice(0, 3).map((v, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 truncate mr-2">{String(v.value || '(Null)')}</span>
                        <span className="font-bold text-slate-900">{v.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'predictive' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Predictive Intelligence</h3>
              
              {currentResult.model ? (
                <>
                  <div className="flex items-center gap-6 mb-10 p-6 bg-slate-50 rounded-3xl">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex flex-col items-center justify-center border border-emerald-200 shadow-sm">
                      <span className="text-2xl font-black">{(currentResult.model.metricValue * 100).toFixed(0)}%</span>
                      <span className="text-[10px] uppercase font-bold">Accuracy</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">Target Driver: {currentResult.model.targetName}</h4>
                      <p className="text-slate-500 text-sm">Automated {currentResult.model.problemType} model trained on current sample.</p>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Primary Decision Drivers</h4>
                  <div className="space-y-8">
                    {currentResult.model.featureImportance.map((f, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-slate-800 uppercase tracking-tight">{f.column}</span>
                          <span className="text-indigo-600 font-bold">Impact: {(f.score * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${f.score * 100}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6"><Search /></div>
                  <h4 className="text-xl font-bold mb-2">Target Variable Required</h4>
                  <p className="text-slate-500 mb-6">Specify a column (e.g., Sales, Target, Survived) during setup to generate predictive drivers.</p>
                </div>
              )}
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Discovered Statistical Relationships</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentResult.hypotheses.map((h, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{h.title}</h4>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${h.strength === 'strong' ? 'bg-emerald-500 text-white' : h.strength === 'moderate' ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
                        {h.strength}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{h.conclusion}</p>
                    <div className="pt-4 border-t border-slate-200/50 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      <span>{h.metricLabel}</span>
                      <span>{Math.abs(h.metricValue).toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <span className="font-black text-xl">A</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">AIDA</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleConnectKey}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${isKeySelected ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100'}`}
            >
              <div className={`w-2 h-2 rounded-full ${isKeySelected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {isKeySelected ? 'Studio Active' : 'Connect Studio'}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {view === 'landing' && renderLanding()}
        {view === 'new-analysis' && renderConfig()}
        {view === 'results' && renderResults()}
      </main>

      <footer className="border-t border-slate-200 py-12 px-6 bg-white mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <span className="font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-lg tracking-tight">AIDA Analyst</span>
            </div>
            <p className="text-slate-500 leading-relaxed max-w-sm mx-auto md:mx-0">
              Your autonomous AI-native data analyst. No servers, no data leaves your browser.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Resources</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="hover:text-indigo-600 underline">Billing Support</a></li>
              <li><a href="#" className="hover:text-indigo-600">Privacy Guide</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Legal</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#" className="hover:text-indigo-600">Terms of Use</a></li>
              <li><a href="#" className="hover:text-indigo-600">Compliance</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
