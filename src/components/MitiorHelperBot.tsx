import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Brain,
  Trash2,
  Play,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Minimize2,
  Maximize2,
  Plus
} from 'lucide-react';
import {
  AssistantAction,
  AssistantChatMessage,
  AssistantRuntimeContext,
  AssistantUserMemory,
  processMitiorAssistantQuery
} from '../assistantEngine';

interface MitiorHelperBotProps {
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
  context: AssistantRuntimeContext;
  onExecuteAction: (action: AssistantAction) => void;
}

function renderInlineFormatting(text: string, isUser: boolean): React.ReactNode[] {
  // Tokenize **bold**, `code`, *italic*, and _italic_
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const inner = part.slice(2, -2);
      // Recursively parse inner in case of nested `code` or *italic* inside **bold**
      return (
        <strong
          key={idx}
          className={
            isUser
              ? 'font-bold text-white dark:text-[#1d1d1f]'
              : 'font-bold text-[#111827] dark:text-white'
          }
        >
          {renderInlineFormatting(inner, isUser)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className={
            isUser
              ? 'px-1.5 py-0.5 rounded bg-white/20 dark:bg-black/15 font-mono text-[10.5px] font-semibold'
              : 'px-1.5 py-0.5 rounded bg-[#f0f4f4] dark:bg-[#2a2f30] text-[#004b49] dark:text-[#95d1ce] font-mono text-[10.5px] font-semibold'
          }
        >
          {inner}
        </code>
      );
    }

    if (
      ((part.startsWith('*') && part.endsWith('*')) ||
        (part.startsWith('_') && part.endsWith('_'))) &&
      part.length > 2
    ) {
      const inner = part.slice(1, -1);
      return (
        <em
          key={idx}
          className={
            isUser
              ? 'italic opacity-95'
              : 'italic text-[#004b49] dark:text-[#95d1ce] font-medium'
          }
        >
          {renderInlineFormatting(inner, isUser)}
        </em>
      );
    }

    // Strip any stray leftover double-asterisks if unbalanced
    return <React.Fragment key={idx}>{part.replace(/\*\*/g, '')}</React.Fragment>;
  });
}

function renderFormattedMessage(content: string, isUser: boolean): React.ReactNode {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((rawLine, lineIdx) => {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // Blockquote (> ...)
        if (trimmed.startsWith('> ')) {
          const quoteText = trimmed.slice(2);
          return (
            <div
              key={lineIdx}
              className="pl-2.5 py-1 border-l-2 border-[#004b49] dark:border-[#76b0b1] bg-[#f5f5f7]/70 dark:bg-[#252526]/70 rounded-r-lg text-[11.5px]"
            >
              {renderInlineFormatting(quoteText, isUser)}
            </div>
          );
        }

        // Indented sub-bullet (   - ...)
        if (/^\s{2,}[-•]\s+/.test(rawLine)) {
          const bulletText = trimmed.replace(/^[-•]\s+/, '');
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-3.5">
              <span className="text-[#004b49] dark:text-[#76b0b1] font-bold select-none mt-0.5">◦</span>
              <div className="flex-1">{renderInlineFormatting(bulletText, isUser)}</div>
            </div>
          );
        }

        // Top-level bullet (- ... or • ...)
        if (/^[-•]\s+/.test(trimmed)) {
          const bulletText = trimmed.replace(/^[-•]\s+/, '');
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-1">
              <span className="text-[#004b49] dark:text-[#76b0b1] font-bold select-none">•</span>
              <div className="flex-1">{renderInlineFormatting(bulletText, isUser)}</div>
            </div>
          );
        }

        // Numbered list (1. ..., 2. ...)
        const numMatch = trimmed.match(/^(\d+\.)\s+(.+)$/);
        if (numMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-0.5">
              <span className="font-bold text-[#004b49] dark:text-[#95d1ce] select-none shrink-0">
                {numMatch[1]}
              </span>
              <div className="flex-1">{renderInlineFormatting(numMatch[2], isUser)}</div>
            </div>
          );
        }

        return (
          <div key={lineIdx} className="leading-relaxed">
            {renderInlineFormatting(rawLine, isUser)}
          </div>
        );
      })}
    </div>
  );
}

export default function MitiorHelperBot({
  isOpen,
  onToggleOpen,
  context,
  onExecuteAction
}: MitiorHelperBotProps) {
  const memoryKey = context.userId || 'admin-portal-session';
  const localStorageKey = `sOS_assistant_memory_${memoryKey}`;

  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMemoryDrawer, setShowMemoryDrawer] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const [memory, setMemory] = useState<AssistantUserMemory>(() => {
    try {
      const cached = localStorage.getItem(localStorageKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return {
      userId: memoryKey,
      userName: context.userName || 'Administrator',
      userRole: String(context.userRole || 'ceo'),
      notes: [],
      messages: [],
      updatedAt: Date.now()
    };
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('sOS_session_token') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Load persisted memory for logged-in user (or admin login session) from server + localStorage
  useEffect(() => {
    let isMounted = true;

    const loadMemory = async () => {
      // 1. Read local cache first for instant zero-latency hydration
      let localMem: AssistantUserMemory | null = null;
      try {
        const cached = localStorage.getItem(localStorageKey);
        if (cached) {
          localMem = JSON.parse(cached);
          if (isMounted && localMem) {
            setMemory(localMem);
          }
        }
      } catch {}

      // 2. Sync with backend persistent user memory
      try {
        const query = `?userId=${encodeURIComponent(memoryKey)}&userName=${encodeURIComponent(context.userName || 'Administrator')}`;
        const res = await fetch(`/api/assistant/memory${query}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.memory && isMounted) {
            const serverMem: AssistantUserMemory = data.memory;
            // Use whichever has more recent messages/notes or merge notes
            const mergedNotes = Array.from(
              new Set([...(localMem?.notes || []), ...(serverMem.notes || [])])
            );
            const chosenMessages =
              (serverMem.messages?.length || 0) >= (localMem?.messages?.length || 0)
                ? serverMem.messages || []
                : localMem?.messages || [];

            const hydrated: AssistantUserMemory = {
              userId: memoryKey,
              userName: context.userName || serverMem.userName || 'Administrator',
              userRole: String(context.userRole || serverMem.userRole || 'ceo'),
              notes: mergedNotes,
              messages: chosenMessages,
              updatedAt: Date.now()
            };
            setMemory(hydrated);
            localStorage.setItem(localStorageKey, JSON.stringify(hydrated));
          }
        }
      } catch {
        // Offline-first fallback already handled via localMem
      }
    };

    loadMemory();
    return () => {
      isMounted = false;
    };
  }, [memoryKey, context.userName, context.userRole, localStorageKey]);

  // Auto-scroll to latest message when opened or updated
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [memory.messages, isOpen]);

  const triggerActionWithToast = (action: AssistantAction) => {
    onExecuteAction(action);
    setActionToast(`Executed: ${action.label}`);
    setTimeout(() => {
      setActionToast(null);
    }, 3200);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : input).trim();
    if (!textToSend || isSending) return;
    if (customText === undefined) {
      setInput('');
    }
    setIsSending(true);

    try {
      // Attempt server-backed grounded chat + memory persistence
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: textToSend,
          context
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.memory) {
          setMemory(data.memory);
          localStorage.setItem(localStorageKey, JSON.stringify(data.memory));
          if (data.executedAction) {
            triggerActionWithToast(data.executedAction);
          }
          setIsSending(false);
          return;
        }
      }
    } catch {
      // Fallback to local offline grounded engine below
    }

    // Offline-first local grounded processing + persistence
    const userTurn: AssistantChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    const result = processMitiorAssistantQuery(textToSend, context, memory);
    const updatedNotes = result.clearedNotes
      ? []
      : result.addedNote && !memory.notes.includes(result.addedNote)
        ? [...memory.notes, result.addedNote]
        : memory.notes;

    const assistantTurn: AssistantChatMessage = {
      id: `msg-a-${Date.now() + 1}`,
      role: 'assistant',
      content: result.reply,
      timestamp: new Date().toISOString(),
      executedAction: result.executedAction,
      suggestedActions: result.suggestedActions
    };

    const updatedMemory: AssistantUserMemory = {
      ...memory,
      userId: memoryKey,
      userName: context.userName || memory.userName,
      userRole: String(context.userRole || memory.userRole || 'ceo'),
      notes: updatedNotes,
      messages: [...memory.messages, userTurn, assistantTurn].slice(-100),
      updatedAt: Date.now()
    };

    setMemory(updatedMemory);
    localStorage.setItem(localStorageKey, JSON.stringify(updatedMemory));

    if (result.executedAction) {
      triggerActionWithToast(result.executedAction);
    }
    setIsSending(false);
  };

  const handleClearMemory = async () => {
    const emptyMemory: AssistantUserMemory = {
      userId: memoryKey,
      userName: context.userName || 'Administrator',
      userRole: String(context.userRole || 'ceo'),
      notes: [],
      messages: [],
      updatedAt: Date.now()
    };
    setMemory(emptyMemory);
    localStorage.setItem(localStorageKey, JSON.stringify(emptyMemory));

    try {
      await fetch(`/api/assistant/memory?userId=${encodeURIComponent(memoryKey)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch {}
  };

  const handleAddMemoryNote = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newNoteInput.trim()) return;
    const note = newNoteInput.trim();
    setNewNoteInput('');
    await handleSendMessage(`Remember that ${note}`);
  };

  const quickPrompts = context.isAdminView
    ? [
        { label: '💡 How this tool works', prompt: 'How does this tool work in simple terms?' },
        { label: '🛡️ Admin Login Guide', prompt: 'How does Admin Login work?' },
        { label: '🔑 Sharing & PIN Guide', prompt: 'How do I share with my team or lock the screen?' },
        { label: '🧭 Decision Calculator', prompt: 'How do I evaluate a new business idea?' }
      ]
    : [
        { label: '💡 How this tool works', prompt: 'How does this tool work in simple terms?' },
        { label: '🚀 Where do I start?', prompt: 'Where should I start as a new user?' },
        { label: '+ Make a Checklist', prompt: 'Make a checklist for Client Onboarding' },
        { label: '+ Track Weekly Number', prompt: 'Track Weekly Qualified Leads with target 50' },
        { label: '🧭 Evaluate an Idea', prompt: 'How do I evaluate a new business idea?' },
        { label: '💾 Save My Work', prompt: 'Save my work' }
      ];

  return (
    <>
      {/* FLOATING HELPER BOT LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          id="mitior-helper-bot-launcher"
          type="button"
          onClick={() => onToggleOpen(true)}
          className="fixed bottom-3 right-4 z-45 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#004b49] hover:bg-[#003836] text-white border border-[#76b0b1]/30 shadow-xl transition-all duration-200 cursor-pointer hover:scale-103 select-none"
          title="Open Mitior OS Grounded Helper Bot & Action Executor"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#95d1ce]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-display font-bold tracking-tight">mOS Helper Bot</span>
          {memory.notes.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-white/15 text-[9.5px] font-mono font-bold">
              {memory.notes.length}
            </span>
          )}
        </button>
      )}

      {/* HELPER BOT MODAL / DRAWER */}
      {isOpen && (
        <div
          id="mitior-helper-bot-panel"
          role="dialog"
          aria-label="Mitior OS Helper Bot"
          className={`fixed z-50 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 text-left ${
            isExpanded
              ? 'bottom-3 right-3 left-3 top-14 sm:left-auto sm:w-[560px] sm:h-[82vh] rounded-3xl'
              : 'bottom-16 right-4 w-[calc(100vw-2rem)] sm:w-[410px] h-[540px] max-h-[80vh] rounded-3xl'
          }`}
        >
          {/* TOP HEADER */}
          <div className="bg-[#004b49] text-white px-4 py-3 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#95d1ce]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-bold text-xs sm:text-sm tracking-tight truncate text-white">
                    Mitior OS Helper Bot
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-[9px] font-mono uppercase tracking-wider text-emerald-200 font-bold">
                    Grounded
                  </span>
                </div>
                <p className="text-[10px] text-[#95d1ce] truncate">
                  Memory: <strong className="text-white">{context.userName || 'Admin'}</strong> ({String(context.userRole || 'ceo').toUpperCase()}) • {memory.messages.length} turns
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowMemoryDrawer(!showMemoryDrawer)}
                className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  showMemoryDrawer ? 'bg-white text-[#004b49]' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="View or Edit Persistent User Memory Vault"
              >
                <Brain className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{memory.notes.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title={isExpanded ? 'Compact size' : 'Expand size'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => onToggleOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Close Helper Bot"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ACTION EXECUTION FEEDBACK BANNER */}
          {actionToast && (
            <div className="bg-emerald-600 text-white px-3.5 py-1.5 text-[11px] font-bold flex items-center justify-between gap-2 shrink-0">
              <span className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{actionToast}</span>
              </span>
              <button
                type="button"
                onClick={() => setActionToast(null)}
                className="text-[9px] font-mono uppercase underline cursor-pointer"
              >
                OK
              </button>
            </div>
          )}

          {/* PERSISTENT USER MEMORY VAULT DRAWER */}
          {showMemoryDrawer && (
            <div className="bg-[#f5f5f7] dark:bg-[#252526] border-b border-[#e8e8ed] dark:border-[#2d2d2f] p-3.5 space-y-2.5 text-xs shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#004b49] dark:text-[#76b0b1] flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  Persistent Memory for {context.userName || 'Administrator'}
                </span>
                <button
                  type="button"
                  onClick={handleClearMemory}
                  className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Reset Memory</span>
                </button>
              </div>

              {memory.notes.length === 0 ? (
                <p className="text-[11px] text-[#86868b] italic">
                  No custom notes saved yet. Add one below or type &ldquo;Remember that ...&rdquo; in chat.
                </p>
              ) : (
                <ul className="space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                  {memory.notes.map((note, i) => (
                    <li
                      key={i}
                      className="text-[11px] bg-white dark:bg-[#1d1d1f] px-2.5 py-1.5 rounded-lg border border-[#e8e8ed] dark:border-[#2d2d2f] text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center justify-between gap-2"
                    >
                      <span className="truncate">• {note}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddMemoryNote(e);
                    }
                  }}
                  placeholder="Save a persistent note for your account..."
                  className="flex-1 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:border-[#004b49]"
                />
                <button
                  type="button"
                  onClick={(e) => handleAddMemoryNote(e)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#004b49] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* QUICK COMMAND & HOW-TO CHIPS */}
          <div className="px-3 py-2 bg-[#fbfbfd] dark:bg-[#222224] border-b border-[#e8e8ed] dark:border-[#2d2d2f] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar shrink-0">
            {quickPrompts.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.prompt)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1d1d1f] hover:bg-[#004b49] hover:text-white dark:hover:bg-[#76b0b1] dark:hover:text-[#05161a] border border-[#e8e8ed] dark:border-[#2d2d2f] text-[10.5px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] transition cursor-pointer shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* CHAT MESSAGES STREAM */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#f5f5f7]/60 dark:bg-[#161617]/60">
            {memory.messages.length === 0 && (
              <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#004b49] dark:text-[#76b0b1] font-bold text-xs">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Welcome, {context.userName || 'Administrator'}!</span>
                </div>
                <p className="text-[11.5px] text-[#4f5e61] dark:text-[#bfc8c7] leading-relaxed">
                  Ask me anything in <strong>plain, simple language</strong> — like how this tool works, where to start, what a term means, or tell me in everyday words what to create or open for you.
                </p>
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {context.isAdminView ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          triggerActionWithToast({
                            type: 'admin_quick_login',
                            label: 'Admin Login: CEO (ryan@mitior.co)',
                            payload: { email: 'ryan@mitior.co', password: 'password123', role: 'ceo' }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#004b49] text-white text-[11px] font-bold flex items-center justify-between cursor-pointer hover:opacity-95 transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>1-Click Admin Login (CEO — ryan@mitior.co)</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          triggerActionWithToast({
                            type: 'admin_quick_login',
                            label: 'Admin Login: Fundi (zejithefundi@gmail.com)',
                            payload: { email: 'zejithefundi@gmail.com', password: 'password123', role: 'fundi' }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] text-[11px] font-bold flex items-center justify-between cursor-pointer hover:opacity-95 transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>1-Click Admin Login (Fundi — zejithefundi@gmail.com)</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSendMessage('How does this tool work in simple terms?')}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#f5f5f7] dark:bg-[#252526] hover:bg-[#e8e8ed] dark:hover:bg-neutral-800 text-[11px] font-semibold text-[#1d1d1f] dark:text-white flex items-center justify-between cursor-pointer transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#004b49] dark:text-[#76b0b1]" />
                          <span>How does this tool work in simple terms?</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage('Make a checklist for Standard Client Onboarding')}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#f5f5f7] dark:bg-[#252526] hover:bg-[#e8e8ed] dark:hover:bg-neutral-800 text-[11px] font-semibold text-[#1d1d1f] dark:text-white flex items-center justify-between cursor-pointer transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Make a checklist for &ldquo;Standard Client Onboarding&rdquo;</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {memory.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] font-medium'
                      : 'bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-2xs'
                  }`}
                >
                  {renderFormattedMessage(msg.content, msg.role === 'user')}

                  {msg.executedAction && (
                    <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{msg.executedAction.label}</span>
                    </div>
                  )}

                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#e8e8ed] dark:border-[#2d2d2f] flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((act, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => triggerActionWithToast(act)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#004b49]/10 hover:bg-[#004b49] text-[#004b49] hover:text-white dark:bg-[#76b0b1]/15 dark:text-[#95d1ce] dark:hover:bg-[#76b0b1] dark:hover:text-[#05161a] text-[10.5px] font-bold transition cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-[#86868b] mt-0.5 px-1">
                  {msg.role === 'user' ? context.userName || 'You' : 'mOS Bot'} •{' '}
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* BOTTOM INPUT BAR (Non-form container so pressing Enter never triggers browser page reload) */}
          <div className="p-3 bg-white dark:bg-[#1d1d1f] border-t border-[#e8e8ed] dark:border-[#2d2d2f] flex items-center gap-2 shrink-0">
            <input
              id="mitior-helper-bot-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSendMessage();
                }
              }}
              placeholder="Ask in plain text (e.g. 'How does this tool work?' or 'Make a checklist for...')"
              className="flex-1 bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] focus:border-[#004b49] dark:focus:border-[#76b0b1] rounded-xl px-3 py-2 text-xs text-[#1d1d1f] dark:text-white outline-none transition"
            />
            <button
              id="mitior-helper-bot-send"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSendMessage();
              }}
              disabled={!input.trim() || isSending}
              className="p-2 rounded-xl bg-[#004b49] hover:bg-[#003836] disabled:opacity-40 text-white transition cursor-pointer shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
