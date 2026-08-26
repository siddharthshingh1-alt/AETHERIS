import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Brain,
  Check,
  Edit3,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Bookmark,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { ChatMessage, UserFriendlyMemoryItem, UserProfile } from '../types/userState';

interface ChatViewProps {
  userProfile: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSaveProposedMemory: (messageId: string, memoryText: string) => void;
  onCorrectProposedMemory: (messageId: string, correctedText: string) => void;
  onOpenWhyModal: (traceId?: string, query?: string) => void;
  onOpenMemoryDetailById: (memoryId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  userProfile,
  messages,
  onSendMessage,
  onSaveProposedMemory,
  onCorrectProposedMemory,
  onOpenWhyModal,
  onOpenMemoryDetailById,
}) => {
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const promptSuggestions = [
    'Remember that Supplier Alpha has delays during high port congestion',
    'Help me decide which freight option to choose right now',
    'What have you learned from your recent experiences?',
    'Teach me: how do cash reserves protect against demand volatility?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleStartCorrection = (msgId: string, currentVal: string) => {
    setEditingMessageId(msgId);
    setCorrectionText(currentVal);
  };

  const handleConfirmCorrection = (msgId: string) => {
    if (correctionText.trim()) {
      onCorrectProposedMemory(msgId, correctionText.trim());
    }
    setEditingMessageId(null);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      {/* Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Chat with {userProfile.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-xs text-slate-400">
              Teach new rules, ask for decisions, or explore learned patterns
            </div>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60 border-x border-slate-800 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                How can {userProfile.name} help you today?
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You can teach {userProfile.name} new operational facts, request decision evaluations, or ask why it chose an action.
              </p>
            </div>

            {/* Starter Prompts */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto text-left">
              {promptSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 rounded-xl transition-all flex items-start justify-between gap-2 group"
                >
                  <span className="leading-snug">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
            >
              {/* Sender Name & Time */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
                <span>{msg.sender === 'user' ? 'You' : userProfile.name}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>

              {/* Teaching Card (when user taught something) */}
              {msg.teachingCard && (
                <div className="w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 bg-indigo-500/20 text-indigo-400 rounded-md">
                        <Bookmark className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-semibold text-white">MEMORY RECORD</span>
                      {msg.teachingCard.memoryType && (
                        <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono rounded">
                          {msg.teachingCard.memoryType}
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold rounded-md">
                      SOURCE: TAUGHT BY YOU
                    </span>
                  </div>

                  {editingMessageId === msg.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={correctionText}
                        onChange={(e) => setCorrectionText(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingMessageId(null)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmCorrection(msg.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg"
                        >
                          Save Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
                          <span>Structured Experience:</span>
                          {msg.teachingCard.confidence && (
                            <span className="text-indigo-300 font-mono">Conf: {Math.round(msg.teachingCard.confidence * 100)}%</span>
                          )}
                        </div>
                        <div className="text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                          "{msg.teachingCard.proposedFact}"
                        </div>
                      </div>

                      {msg.teachingCard.status === 'PENDING' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              onSaveProposedMemory(msg.id, msg.teachingCard!.proposedFact)
                            }
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Save into ExperienceStore
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleStartCorrection(msg.id, msg.teachingCard!.proposedFact)
                            }
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit / Refine
                          </button>
                        </div>
                      )}

                      {msg.teachingCard.status === 'SAVED' && (
                        <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-lg">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Stored in persistent ExperienceStore — ready to inform future decisions.</span>
                        </div>
                      )}

                      {msg.teachingCard.status === 'CORRECTED' && (
                        <div className="flex items-center gap-1 text-xs text-indigo-400 font-medium bg-indigo-950/30 border border-indigo-500/20 p-2 rounded-lg">
                          <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>Updated in ExperienceStore with your corrections.</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Decision Card (when Aetheris evaluated a decision) */}
              {msg.decisionCard && (
                <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Recommended Decision
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 font-mono">
                      {Math.round(msg.decisionCard.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-sm font-bold text-white">
                      {msg.decisionCard.recommendedAction}
                    </div>
                    <div className="text-xs text-slate-400">
                      Expected outcome: {msg.decisionCard.expectedOutcome}
                    </div>
                  </div>

                  {/* Retrieved Memories Section */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-indigo-400" />
                      Retrieved Memories & Evidence
                    </div>

                    {(!msg.decisionCard.retrievedMemories || msg.decisionCard.retrievedMemories.length === 0) ? (
                      <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs text-slate-400 italic">
                        No relevant previous experience was retrieved.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {msg.decisionCard.retrievedMemories.map((mem, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[10px] text-indigo-300 font-semibold truncate">
                                #{mem.id}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-1.5 py-0.2 bg-slate-800 text-[10px] text-slate-300 rounded border border-slate-700 font-mono">
                                  Rel: {Math.round(mem.relevance * 100)}%
                                </span>
                                <span className="px-1.5 py-0.2 bg-indigo-500/20 text-[10px] text-indigo-300 rounded font-mono">
                                  Conf: {Math.round(mem.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-slate-200 leading-snug">
                              {mem.lesson}
                            </div>
                            <div className="flex items-center justify-between text-[10px] pt-0.5 text-slate-400">
                              <span>
                                Source: {mem.source}
                                {mem.supportingCount !== undefined && ` (${mem.supportingCount} supp, ${mem.contradictingCount || 0} cont)`}
                              </span>
                              <span className={mem.influencedPrediction ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                                {mem.influencedPrediction ? (
                                  mem.influenceMagnitude && Math.abs(mem.influenceMagnitude) > 0 ? (
                                    `✓ Shifted Delay (+${mem.influenceMagnitude}d)`
                                  ) : (
                                    '✓ Influenced Prediction'
                                  )
                                ) : (
                                  'Observed (No Threshold Trigger)'
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Causal Delta Summary (if available) */}
                  {msg.decisionCard.causalSummary && (
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 font-mono">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Causal Memory Impact</span>
                        <span className={msg.decisionCard.causalSummary.decisionChanged ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                          {msg.decisionCard.causalSummary.decisionChanged ? 'Decision Changed' : 'Decision Unchanged'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Memory OFF Winner</span>
                          <span className="text-slate-300 truncate block">{msg.decisionCard.causalSummary.baselineAction.split('(')[0]}</span>
                          <span className="text-slate-500 text-[10px]">Util: {msg.decisionCard.causalSummary.baselineUtility}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Memory ON Winner</span>
                          <span className="text-emerald-400 font-semibold truncate block">{msg.decisionCard.causalSummary.chosenAction.split('(')[0]}</span>
                          <span className="text-emerald-500 text-[10px]">Util: {msg.decisionCard.causalSummary.chosenUtility}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenWhyModal(
                          msg.decisionCard?.decisionTraceId,
                          msg.decisionCard?.query
                        )
                      }
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      Why did you choose that?
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form & Suggestions */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-b-2xl space-y-3">
        {/* Quick prompt tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider shrink-0">
            Quick Ask:
          </span>
          {[
            'Remember that...',
            'Help me decide...',
            'What have you learned about suppliers?',
            'Why did you choose that?',
          ].map((tag, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInputText(tag)}
              className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-750 whitespace-nowrap transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            id="input-chat-message"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Teach me something, ask me something, or give ${userProfile.name} a problem to think about...`}
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            id="btn-chat-send"
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
