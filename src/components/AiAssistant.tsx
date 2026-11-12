'use client';

import React, { useState, useRef, useEffect } from 'react';
import { InvoiceData } from '@/types/invoice';
import {
  Sparkles,
  Send,
  Paperclip,
  RotateCcw,
  Cpu,
  Car,
  ShieldCheck,
  FileText,
  Trash2,
} from 'lucide-react';

interface AiAssistantProps {
  currentInvoice: InvoiceData;
  onApplyInvoiceData: (updated: Partial<InvoiceData> & { customerName?: string }) => void;
  onResetInvoice: () => void;
}

interface AttachedDoc {
  name: string;
  text: string;
  charCount: number;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  details?: {
    itemsCount?: number;
    hasRot?: boolean;
    projectTitle?: string;
    model?: string;
    durationMs?: number;
  };
  timestamp: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  currentInvoice,
  onApplyInvoiceData,
  onResetInvoice,
}) => {
  const [promptText, setPromptText] = useState('');
  const [attachedDocs, setAttachedDocs] = useState<AttachedDoc[]>([]);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Ollama status
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5:7b');
  const [vramInfo, setVramInfo] = useState<string>('');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hej Karl! Jag är din lokala AI-assistent kopplad till Ollama på din dator.\n\nKlistra in vad du gjort, släpp in en PDF-faktura från en kollega eller Beijer Bygg, så plockar jag fram alla rader, milersättning, material och räknar 30% ROT direkt!',
      timestamp: 'Redo',
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check Ollama status on mount and every 15s
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/ai/status');
        const data = await res.json();
        if (data.online) {
          setOllamaOnline(true);
          setAvailableModels(data.models || []);
          if (data.activeModel) {
            setSelectedModel(data.activeModel);
          }
          if (data.vramUsed) {
            setVramInfo(data.vramUsed);
          }
        } else {
          setOllamaOnline(false);
        }
      } catch {
        setOllamaOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle file upload and PDF extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtractingFile(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/ai/extract-pdf', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.text) {
          setAttachedDocs((prev) => [
            ...prev,
            {
              name: data.filename || file.name,
              text: data.text,
              charCount: data.charCount || data.text.length,
            },
          ]);
        } else {
          alert(`Kunde inte läsa ${file.name}: ${data.error || 'Okänt fel'}`);
        }
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      alert('Kunde inte läsa in filen.');
    } finally {
      setIsExtractingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendPrompt = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : promptText).trim();
    if (!text && attachedDocs.length === 0) return;

    const attachedSummary = attachedDocs.map((d) => `📄 ${d.name}`).join(', ');
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text
        ? attachedDocs.length > 0
          ? `${text}\n\n[Bifogade underlag: ${attachedSummary}]`
          : text
        : `[Bifogade underlag: ${attachedSummary}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPromptText('');
    setIsLoading(true);

    try {
      const combinedAttachedText = attachedDocs
        .map((f) => `=== BIFOGAD FIL: ${f.name} ===\n${f.text}`)
        .join('\n\n');

      // Build conversation history (last 8 messages)
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-8)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }));

      const res = await fetch('/api/ai/parse-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          attachedText: combinedAttachedText,
          currentInvoice: {
            invoiceNumber: currentInvoice.invoiceNumber,
            projectTitle: currentInvoice.projectTitle,
            projectDates: currentInvoice.projectDates,
            enableRot: currentInvoice.enableRot,
            rotPercent: currentInvoice.rotPercent,
            customerNumber: currentInvoice.customerNumber,
            recipient: currentInvoice.recipient,
            items: (currentInvoice.items || []).map((it) => ({
              description: it.description,
              subDescription: it.subDescription || '',
              quantity: it.quantity,
              unit: it.unit,
              unitPrice: it.unitPrice,
              vatRate: it.vatRate,
              isRotRut: it.isRotRut,
            })),
          },
          history,
          model: selectedModel,
        }),
      });

      const result = await res.json();

      if (result.success && result.data) {
        const parsed = result.data;

        // Apply changes to invoice (including customerName if mentioned)
        onApplyInvoiceData({
          customerName: parsed.customerName || undefined,
          invoiceNumber: parsed.invoiceNumber || undefined,
          projectTitle: parsed.projectTitle || currentInvoice.projectTitle,
          projectDates: parsed.projectDates || currentInvoice.projectDates,
          enableRot: parsed.enableRot !== undefined ? parsed.enableRot : currentInvoice.enableRot,
          rotPercent: parsed.rotPercent || currentInvoice.rotPercent || 30,
          items: parsed.items && parsed.items.length > 0 ? parsed.items : currentInvoice.items,
        });

        const assistantMessage: Message = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: parsed.summaryMessage || 'Fakturan har uppdaterats!',
          details: {
            itemsCount: parsed.items?.length,
            hasRot: parsed.enableRot,
            projectTitle: parsed.projectTitle,
            model: result.source === 'ollama' ? result.model || selectedModel : 'Lokal regelmotor',
            durationMs: result.durationMs,
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || 'Kunde inte tolka');
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'system',
          text: `Ett fel uppstod: ${err.message || 'Kunde inte nå AI-motorn'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
      setAttachedDocs([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const setPromptClean = (text: string) => {
    setPromptText(text);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-[780px] overflow-hidden">
      {/* Header */}
      <div className="p-3 px-4 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold tracking-tight">AI Faktura-Assistent</h2>
              {ollamaOnline ? (
                <span className="inline-flex items-center gap-1 text-[9.5px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ollama: {selectedModel} {vramInfo ? `(${vramInfo})` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9.5px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Lokal AI redo
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Körs 100% lokalt och privat på din laptop
            </p>
          </div>
        </div>

        {/* Model dropdown / clear button */}
        <div className="flex items-center gap-1.5">
          {availableModels.length > 1 && (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-[10.5px] bg-slate-800 text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              setMessages([
                {
                  id: 'welcome',
                  sender: 'assistant',
                  text: 'Chatten rensades. Vad vill du fakturera?',
                  timestamp: 'Nu',
                },
              ]);
            }}
            title="Rensa konversation"
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                m.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-xs'
                  : m.sender === 'assistant'
                  ? 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>

              {/* Parsed details badge */}
              {m.details && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                  {m.details.projectTitle && (
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                      Projekt: {m.details.projectTitle}
                    </span>
                  )}
                  {m.details.itemsCount !== undefined && (
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                      {m.details.itemsCount} rader
                    </span>
                  )}
                  {m.details.hasRot && (
                    <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                      30% ROT aktivt
                    </span>
                  )}
                  {m.details.model && (
                    <span className="text-[9.5px] text-slate-400 font-mono ml-auto">
                      ⚡ {m.details.model} {m.details.durationMs ? `(${(m.details.durationMs / 1000).toFixed(1)}s)` : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
            <span className="text-[9.5px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-xs max-w-[85%] shadow-xs animate-pulse">
            <Cpu className="w-4 h-4 text-red-600 animate-spin shrink-0" />
            <div>
              <div className="font-semibold text-slate-800">Qwen 2.5 körs i Ollama...</div>
              <div className="text-[10.5px] text-slate-400">Uppdaterar fakturarader, ROT och totaler</div>
            </div>
          </div>
        )}
      </div>

      {/* Attached documents pill bar */}
      {attachedDocs.length > 0 && (
        <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[10.5px] font-semibold text-slate-500">Inläst underlag:</span>
          {attachedDocs.map((doc, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 px-2.5 py-1 rounded-lg text-[11px] text-slate-700 shadow-2xs font-medium"
            >
              <FileText className="w-3.5 h-3.5 text-red-600" />
              <span className="truncate max-w-[150px]">{doc.name}</span>
              <span className="text-[9.5px] text-slate-400">({doc.charCount} tecken)</span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-slate-400 hover:text-red-600 ml-0.5 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Quick Action Chips */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
        <button
          type="button"
          onClick={() =>
            setPromptClean(
              'Fönsterrenovering hos Andreas Modig. 49 timmars snickeriarbete á 550 kr, material Beijer 1000 kr, Hägglunds Plåt 2538 kr, servicebil 2 st á 250 kr. 30% ROT. Fakturanummer 6002.'
            )
          }
          className="shrink-0 px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-2xs font-medium cursor-pointer transition-colors"
        >
          Fönster (Andreas)
        </button>
        <button
          type="button"
          onClick={() =>
            setPromptClean(
              'Dörrbyte hos Jerry van Kooten. 10 timmar snickeri á 550 kr, 13 mil milersättning och 50 kr material. 30% ROT. Fakturanummer 6101.'
            )
          }
          className="shrink-0 px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-2xs font-medium cursor-pointer transition-colors"
        >
          Dörrbyte (Jerry)
        </button>
        <button
          type="button"
          onClick={() => handleSendPrompt('Lägg till en post för Servicebil på 500 kr.')}
          className="shrink-0 px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-2xs font-medium cursor-pointer transition-colors flex items-center gap-1"
        >
          <Car className="w-3 h-3 text-slate-500" />
          + Servicebil (500 kr)
        </button>
        <button
          type="button"
          onClick={onResetInvoice}
          className="shrink-0 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg shadow-2xs font-medium cursor-pointer transition-colors flex items-center gap-1 ml-auto"
        >
          <Trash2 className="w-3 h-3" />
          Töm fakturan
        </button>
      </div>

      {/* ROT Toggle Bar with Checkbox */}
      <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={currentInvoice.enableRot}
            onChange={(e) => onApplyInvoiceData({ enableRot: e.target.checked })}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
          />
          <span
            className={`font-bold flex items-center gap-1.5 ${
              currentInvoice.enableRot ? 'text-emerald-900' : 'text-slate-700'
            }`}
          >
            <ShieldCheck
              className={`w-3.5 h-3.5 ${currentInvoice.enableRot ? 'text-emerald-600' : 'text-slate-400'}`}
            />
            <span>ROT-faktura (30% avdrag på arbetskostnad)</span>
          </span>
        </label>

        <span
          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border transition-all ${
            currentInvoice.enableRot
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-slate-200/60 text-slate-500 border-slate-300'
          }`}
        >
          {currentInvoice.enableRot ? '✓ ROT AKTIVT' : 'EJ ROT'}
        </span>
      </div>

      {/* Input Box (Cursor IDE Style) */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="relative border border-slate-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 rounded-xl bg-white shadow-xs transition-all">
          <textarea
            ref={textareaRef}
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv vad du vill ändra eller klistra in underlag... (t.ex: Ta bort Nils Westergren, eller Ändra timmarna till 20)"
            className="w-full p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none bg-transparent leading-relaxed"
          />

          <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.txt,.csv,.json"
                className="hidden"
              />
              <button
                type="button"
                disabled={isExtractingFile}
                onClick={() => fileInputRef.current?.click()}
                title="Bifoga PDF-faktura eller underlagsfil"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <Paperclip className="w-3.5 h-3.5 text-red-600" />
                <span>{isExtractingFile ? 'Läser PDF...' : 'Bifoga PDF / fil'}</span>
              </button>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Ctrl + Enter för att köra
              </span>
            </div>

            <button
              type="button"
              disabled={isLoading || (!promptText.trim() && attachedDocs.length === 0)}
              onClick={() => handleSendPrompt()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Skicka instruktion</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
