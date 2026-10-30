import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Key,
  Cpu,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Loader2,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

interface OpenRouterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Default)', provider: 'Google' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', provider: 'Meta' },
];

export const OpenRouterConfigModal: React.FC<OpenRouterConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    openRouterKey,
    openRouterModel,
    isOpenRouterConfigured,
    saveOpenRouterConfig,
    clearOpenRouterConfig,
    testOpenRouterConnection,
  } = useAuth();

  const [keyInput, setKeyInput] = useState(openRouterKey);
  const [modelInput, setModelInput] = useState(openRouterModel);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    sampleResponse?: string;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!keyInput.trim()) {
      setTestResult({ success: false, error: 'Please enter your OpenRouter API key first.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testOpenRouterConnection(keyInput.trim(), modelInput.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!keyInput.trim()) {
      clearOpenRouterConfig();
      onClose();
      return;
    }
    saveOpenRouterConfig(keyInput.trim(), modelInput.trim() || 'google/gemini-2.5-flash');
    onClose();
  };

  const handleDisconnect = () => {
    clearOpenRouterConfig();
    setKeyInput('');
    setModelInput('google/gemini-2.5-flash');
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                AI Engine & OpenRouter Models
              </h2>
              <p className="text-xs text-slate-500">
                Connect any frontier model via OpenRouter API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status banner */}
          <div
            className={`rounded-xl p-3.5 border text-xs flex items-center justify-between ${
              isOpenRouterConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isOpenRouterConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="font-semibold">
                {isOpenRouterConfigured
                  ? `Active OpenRouter Model: ${openRouterModel}`
                  : 'Default AI Model Active: Google Gemini (gemini-3.8-flash)'}
              </span>
            </div>
            {isOpenRouterConfigured && (
              <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                CONNECTED
              </span>
            )}
          </div>

          {/* API Key field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-slate-500" />
                <span>OpenRouter API Key</span>
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors underline"
              >
                Get API key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Your key stays locally secure and is forwarded directly to OpenRouter endpoints.
            </p>
          </div>

          {/* Model input field */}
          <div>
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Cpu className="h-3.5 w-3.5 text-slate-500" />
              <span>Model Identifier (Any model from OpenRouter)</span>
            </label>
            <input
              type="text"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              placeholder="e.g. anthropic/claude-3.5-sonnet or deepseek/deepseek-chat"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Popular Presets (1-Click Select)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_MODELS.map((item) => {
                const isSelected = modelInput === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModelInput(item.id)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="font-semibold truncate">{item.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {item.provider}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test results banner */}
          {testResult && (
            <div
              className={`rounded-xl p-3 border text-xs space-y-1 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                )}
                <span>
                  {testResult.success ? 'Connection Verified' : 'Authentication Failed'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {testResult.message || testResult.error}
              </p>
              {testResult.sampleResponse && (
                <div className="mt-1 text-[10px] font-mono bg-white/70 p-2 rounded border border-emerald-200/50">
                  {testResult.sampleResponse}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <div>
            {isOpenRouterConfigured && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 transition-colors cursor-pointer font-medium"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Disconnect</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                  <span>Test Key</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
