import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  User, 
  Video, 
  Tag, 
  CheckSquare, 
  Edit, 
  Check, 
  Search, 
  Calendar,
  HelpCircle,
  Lock,
  Unlock,
  Link,
  AlertCircle,
  ArrowRight,
  X,
  Undo,
  Redo,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { Playbook, TeamMember, ValueEngineNode, UserRole } from '../types';
import { useLanguage } from '../LanguageContext';

interface PlaybookFolderViewProps {
  playbooks: Playbook[];
  teamMembers: TeamMember[];
  nodes: ValueEngineNode[];
  onUpdatePlaybooks: (updated: Playbook[]) => void;
  selectedPlaybookId: string | null;
  setSelectedPlaybookId: (id: string | null) => void;
  userRole?: UserRole;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function PlaybookFolderView({
  playbooks,
  teamMembers,
  nodes,
  onUpdatePlaybooks,
  selectedPlaybookId,
  setSelectedPlaybookId,
  userRole = 'ceo',
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}: PlaybookFolderViewProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showManualDetails, setShowManualDetails] = useState(false);

  // Auto-select first playbook if none is selected
  useEffect(() => {
    if (!selectedPlaybookId && playbooks.length > 0) {
      setSelectedPlaybookId(playbooks[0].id);
    }
  }, [selectedPlaybookId, playbooks, setSelectedPlaybookId]);

  // Hotkey support for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === 'INPUT' || 
        target?.tagName === 'TEXTAREA' || 
        target?.isContentEditable
      ) {
        // Let standard input fields handle local transient text undos natively
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isUndo = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey;
      const isRedo = ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'y') ||
                     ((isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z');

      if (isUndo) {
        if (canUndo && onUndo) {
          e.preventDefault();
          onUndo();
        }
      } else if (isRedo) {
        if (canRedo && onRedo) {
          e.preventDefault();
          onRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  const isEmployee = userRole === 'employee';

  // Buffer state for edits
  const [editTitle, setEditTitle] = useState('');
  const [editPowerStageId, setEditPowerStageId] = useState('');
  const [editOwnerId, setEditOwnerId] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');

  // Checklist Step Creator
  const [newStepText, setNewStepText] = useState('');
  const [newStepDependsOnId, setNewStepDependsOnId] = useState('');

  // Inline step editing state
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepText, setEditingStepText] = useState('');

  const activePlaybook = playbooks.find(p => p.id === selectedPlaybookId) || playbooks[0];
  const powerStagesList = nodes.filter(n => n.isPowerStage);

  const startEdit = (playbook: Playbook) => {
    setEditTitle(playbook.title);
    setEditPowerStageId(playbook.powerStageId || '');
    setEditOwnerId(playbook.ownerId || '');
    setEditInstructions(playbook.instructions || '');
    setEditVideoUrl(playbook.videoUrl || '');
    setIsEditing(true);
    setShowManualDetails(true);
  };

  const saveEdit = () => {
    if (!activePlaybook) return;
    
    const linkedNode = nodes.find(n => n.id === editPowerStageId);
    const powerStageLabel = linkedNode ? linkedNode.label : '-- Unlinked --';

    const updated = playbooks.map(p => {
      if (p.id === activePlaybook.id) {
        return {
          ...p,
          title: editTitle,
          powerStageId: editPowerStageId,
          powerStageLabel: powerStageLabel,
          ownerId: editOwnerId,
          instructions: editInstructions,
          videoUrl: editVideoUrl,
          lastUpdated: new Date().toISOString().slice(0, 10)
        };
      }
      return p;
    });

    onUpdatePlaybooks(updated);
    setIsEditing(false);
  };

  const handleCreatePlaybook = () => {
    const newId = `pb-custom-${Date.now()}`;
    const defaultOwner = teamMembers[0]?.id || 'tm-1';
    const firstPowerNode = powerStagesList[0];

    const newPlaybook: Playbook = {
      id: newId,
      title: `SOP-10${playbooks.length + 1}: Custom Operational Protocol`,
      powerStageId: firstPowerNode?.id || '',
      powerStageLabel: firstPowerNode?.label || 'General Operations',
      ownerId: defaultOwner,
      instructions: "### Executive Overview\nProvide a high level description of the task requirements...\n\n### Required Tools\n- Shared CRM\n\n### Sequence Protocol\n1. Step description one\n2. Step description two",
      steps: [
        { id: "s-1", text: "Receive and verify inbound parameters.", done: false },
        { id: "s-2", text: "Update tracking metrics manually.", done: false },
      ],
      videoUrl: "",
      lastUpdated: new Date().toISOString().slice(0, 10)
    };

    onUpdatePlaybooks([...playbooks, newPlaybook]);
    setSelectedPlaybookId(newId);
    startEdit(newPlaybook);
  };

  const handleDeletePlaybook = (id: string) => {
    const updated = playbooks.filter(p => p.id !== id);
    onUpdatePlaybooks(updated);
    if (selectedPlaybookId === id) {
      setSelectedPlaybookId(updated[0]?.id || null);
    }
  };

  const handleToggleChecklistStep = (stepId: string) => {
    if (!activePlaybook) return;
    
    // Blocking check: If step is NOT done and has a blocker that is also NOT done, prevent checking.
    const stepObj = (activePlaybook.steps || []).find(s => s.id === stepId);
    if (stepObj && !stepObj.done && stepObj.dependsOnStepId) {
      const blockerObj = (activePlaybook.steps || []).find(s => s.id === stepObj.dependsOnStepId);
      if (blockerObj && !blockerObj.done) {
        return; // Blocked!
      }
    }

    const updated = playbooks.map(p => {
      if (p.id === activePlaybook.id) {
        return {
          ...p,
          steps: (p.steps || []).map(s => s.id === stepId ? { ...s, done: !s.done } : s)
        };
      }
      return p;
    });
    onUpdatePlaybooks(updated);
  };

  const handleAddChecklistStep = (explicitText?: string) => {
    if (!activePlaybook) return;
    const trimmed = (explicitText !== undefined ? explicitText : newStepText).trim();
    const currentSteps = Array.isArray(activePlaybook.steps) ? activePlaybook.steps : [];
    const stepLabel = trimmed || `Step ${currentSteps.length + 1}: ${t('sop.step_placeholder', 'Perform standard action')}`;
    const newStepId = `step-inline-${Date.now()}`;
    const newStep = {
      id: newStepId,
      text: stepLabel,
      done: false,
      dependsOnStepId: newStepDependsOnId || undefined
    };

    const updated = playbooks.map(p => {
      if (p.id === activePlaybook.id) {
        return {
          ...p,
          steps: [...(p.steps || []), newStep]
        };
      }
      return p;
    });

    onUpdatePlaybooks(updated);
    setNewStepText('');
    setNewStepDependsOnId('');

    // If step was created without initial text, open inline editing so user can type right away!
    if (!trimmed) {
      setEditingStepId(newStepId);
      setEditingStepText(stepLabel);
    }
  };

  const handleUpdateStepDependency = (stepId: string, dependsOnId: string) => {
    if (!activePlaybook) return;
    const updated = playbooks.map(p => {
      if (p.id === activePlaybook.id) {
        return {
          ...p,
          steps: p.steps.map(s => s.id === stepId ? { ...s, dependsOnStepId: dependsOnId || undefined } : s)
        };
      }
      return p;
    });
    onUpdatePlaybooks(updated);
  };

  const startEditStepText = (stepId: string, text: string) => {
    setEditingStepId(stepId);
    setEditingStepText(text);
  };

  const handleSaveStepText = (stepId: string) => {
    if (!activePlaybook || !editingStepText.trim()) return;
    const updated = playbooks.map(p => {
      if (p.id === activePlaybook.id) {
        return {
          ...p,
          steps: p.steps.map(s => s.id === stepId ? { ...s, text: editingStepText.trim() } : s)
        };
      }
      return p;
    });
    onUpdatePlaybooks(updated);
    setEditingStepId(null);
    setEditingStepText('');
  };

  const handleDeleteChecklistStep = (stepId: string) => {
    if (!activePlaybook) return;
    const updated = playbooks.map(p => {
      if (p.id === activePlaybook.id) {
        return {
          ...p,
          steps: p.steps.filter(s => s.id !== stepId).map(s => {
            // Clean up any stale dependencies on the deleted step
            if (s.dependsOnStepId === stepId) {
              const { dependsOnStepId, ...rest } = s;
              return rest;
            }
            return s;
          })
        };
      }
      return p;
    });
    onUpdatePlaybooks(updated);
  };

  const filteredPlaybooks = playbooks.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.title.toLowerCase().includes(query) ||
      p.powerStageLabel.toLowerCase().includes(query) ||
      p.instructions.toLowerCase().includes(query) ||
      (p.steps && p.steps.some(s => s.text.toLowerCase().includes(query)))
    );
  });

  const renderSimpleFormatting = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('###')) {
        return <h4 key={i} className="text-xs font-semibold text-[#1d1d1f] mt-4 mb-1.5 uppercase tracking-wider">{line.replace('###', '')}</h4>;
      }
      if (line.startsWith('##')) {
        return <h3 key={i} className="text-sm font-semibold text-[#1d1d1f] mt-5 mb-2">{line.replace('##', '')}</h3>;
      }
      if (line.startsWith('#')) {
        return <h2 key={i} className="text-base font-semibold text-[#1d1d1f] mt-6 mb-3 border-b border-[#f5f5f7] pb-1">{line.replace('#', '')}</h2>;
      }
      if (line.startsWith('-') || line.startsWith('*')) {
        return <li key={i} className="list-disc ml-4 text-[#86868b] my-1 text-xs">{line.substring(2)}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <li key={i} className="list-decimal ml-4 text-[#86868b] my-1 text-xs">{line.replace(/^\d+\./, '')}</li>;
      }
      return <p key={i} className="text-[#86868b] text-xs leading-relaxed my-2">{line}</p>;
    });
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      
      {/* Header Banner - Simple Apple style */}
      <div className="bg-white border border-[#e8e8ed] p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[#1d1d1f]">
            Playbooks & SOP manuals
          </h2>
          <p className="text-[#86868b] text-xs">
            Maintain precise checklists for critical organizational stages. Document each process to build zero-friction execution.
          </p>
        </div>

        {/* Undo/Redo Safety controls */}
        {(onUndo || onRedo) && (
          <div className="inline-flex rounded-full bg-[#f5f5f7] p-1 border border-[#e8e8ed] items-center gap-1 self-start md:self-auto">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded-full transition ${
                canUndo
                  ? 'text-neutral-800 hover:bg-[#e8e8ed] hover:scale-105 active:scale-95 cursor-pointer'
                  : 'text-neutral-300 cursor-not-allowed opacity-30 font-sans'
              }`}
              title="Undo Change (Ctrl+Z)"
              id="pb-undo-btn"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-neutral-200" />
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded-full transition ${
                canRedo
                  ? 'text-neutral-800 hover:bg-[#e8e8ed] hover:scale-105 active:scale-95 cursor-pointer'
                  : 'text-neutral-300 cursor-not-allowed opacity-30 font-sans'
              }`}
              title="Redo Change (Ctrl+Y)"
              id="pb-redo-btn"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Playbooks Directory - Left Column */}
        <div className="lg:col-span-4 bg-white border border-[#e8e8ed] rounded-2xl p-4 shadow-sm space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-[#86868b]" />
              <input
                type="text"
                placeholder="Search SOP vault (title, keywords, steps)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f5f5f7] dark:bg-neutral-900 border border-[#e8e8ed] dark:border-[#2d2d2f] focus:border-[#1d1d1f] dark:focus:border-[#e8e8ed] rounded-xl pl-9 pr-8 py-2.5 text-xs outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-[#86868b] hover:text-[#1d1d1f] transition cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Keyword/Tag Pills */}
            <div className="flex flex-wrap gap-1 pt-1">
              {['All', 'SDR', 'Onboarding', 'Research', 'Delivery', 'Protocol'].map((kw) => {
                const isActive = kw === 'All' ? searchQuery === '' : searchQuery.toLowerCase() === kw.toLowerCase();
                return (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setSearchQuery(kw === 'All' ? '' : kw)}
                    className={`text-[9.5px] px-2.5 py-1 rounded-md transition font-semibold border cursor-pointer select-none ${
                      isActive
                        ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] dark:bg-white dark:text-[#1d1d1f] dark:border-white font-bold'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-[#86868b] border-[#e8e8ed] dark:border-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    {kw}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {filteredPlaybooks.length === 0 ? (
              <p className="text-[#86868b] text-center py-8 text-xs">No matching procedures found.</p>
            ) : (
              filteredPlaybooks.map(p => {
                const isActive = activePlaybook?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPlaybookId(p.id);
                      setIsEditing(false);
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex justify-between items-start gap-2 ${
                      isActive
                        ? 'border-[#1d1d1f] bg-[#fbfbfd] text-[#1d1d1f]'
                        : 'border-[#e8e8ed] bg-white text-[#86868b] hover:border-[#1d1d1f]'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-semibold text-xs leading-snug line-clamp-1">{p.title}</h4>
                      <p className="text-[10px] text-[#86868b] flex items-center gap-1 font-mono uppercase tracking-tight">
                        <Tag className="w-3 h-3" /> {p.powerStageLabel}
                      </p>
                      
                      {/* Integrated progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[9px] font-mono text-[#86868b]">
                          <span>Progress</span>
                          <span>
                            {p.steps ? p.steps.filter(s => s.done).length : 0}/{p.steps ? p.steps.length : 0} ({p.steps && p.steps.length > 0 ? Math.round((p.steps.filter(s => s.done).length / p.steps.length) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#f5f5f7] rounded-full h-1 overflow-hidden border border-[#e8e8ed]">
                          <div 
                            className="bg-[#1d1d1f] h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${p.steps && p.steps.length > 0 ? (p.steps.filter(s => s.done).length / p.steps.length) * 100 : 0}%`,
                              backgroundColor: 'var(--bg-accent)'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    {!isEmployee && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaybook(p.id);
                        }}
                        className="text-[#86868b] hover:text-red-500 p-1 rounded transition duration-100 cursor-pointer animate-fade-in"
                        title="Delete SOP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {!isEmployee && (
            <button
              onClick={handleCreatePlaybook}
              className="w-full bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white rounded-xl py-2.5 text-xs font-semibold tracking-tight transition duration-150 cursor-pointer flex items-center justify-center gap-1 mt-2"
            >
              <Plus className="w-4 h-4" /> Create Playbook SOP
            </button>
          )}
        </div>

        {/* Playbook Detailed Panel - Right Column */}
        <div className="lg:col-span-8 bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm min-h-[440px]">
          {activePlaybook ? (
            <div className="space-y-6">
              
              {/* Card Header controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#f5f5f7] pb-4">
                <div className="space-y-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-base font-semibold text-[#1d1d1f] border-b border-[#1d1d1f] bg-transparent py-0.5 outline-none max-w-lg"
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-[#1d1d1f]">
                      {activePlaybook.title}
                    </h3>
                  )}
                  
                  <div className="flex flex-wrap gap-3.5 text-[11px] text-[#86868b]">
                    <span className="flex items-center gap-1 bg-[#f5f5f7] px-2.5 py-0.5 rounded-full border border-[#e8e8ed]">
                      <Tag className="w-3 h-3 text-[#1d1d1f]" />
                      {isEditing ? (
                        <select
                          value={editPowerStageId}
                          onChange={(e) => setEditPowerStageId(e.target.value)}
                          className="bg-transparent border-none outline-none text-[#1d1d1f] text-xs p-0 m-0 cursor-pointer"
                        >
                          <option value="">-- General Operations --</option>
                          {powerStagesList.map(n => (
                            <option key={n.id} value={n.id}>{n.label}</option>
                          ))}
                        </select>
                      ) : (
                        activePlaybook.powerStageLabel
                      )}
                    </span>
                    
                    <span className="flex items-center gap-1 bg-[#f5f5f7] px-2.5 py-0.5 rounded-full border border-[#e8e8ed]">
                      <User className="w-3 h-3 text-[#1d1d1f]" />
                      {isEditing ? (
                        <select
                          value={editOwnerId}
                          onChange={(e) => setEditOwnerId(e.target.value)}
                          className="bg-transparent border-none outline-none text-[#1d1d1f] text-xs p-0 m-0 cursor-pointer"
                        >
                          {teamMembers.map(tm => (
                            <option key={tm.id} value={tm.id}>{tm.name}</option>
                          ))}
                        </select>
                      ) : (
                        teamMembers.find(t => t.id === activePlaybook.ownerId)?.name || 'Unassigned'
                      )}
                    </span>

                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Updated {activePlaybook.lastUpdated}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEmployee ? (
                    <span className="text-[10px] font-mono font-bold bg-[#f5f5f7] dark:bg-[#252526] text-[#86868b] dark:text-neutral-400 px-2.5 py-1 rounded-full border border-[#e8e8ed] dark:border-neutral-800 uppercase">
                      Teammate Execution Mode
                    </span>
                  ) : isEditing ? (
                    <button
                      onClick={saveEdit}
                      className="bg-[#1d1d1f] hover:bg-neutral-800 text-white font-semibold px-4 py-2 rounded-full text-xs flex items-center gap-1 shadow-sm transition duration-150 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Changes
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(activePlaybook)}
                      className="bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] border border-[#e8e8ed] font-semibold px-4 py-2 rounded-full text-xs flex items-center gap-1 transition duration-150 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Manual
                    </button>
                  )}
                </div>
              </div>

              {/* Detailed Progress Bar */}
              {activePlaybook.steps && activePlaybook.steps.length > 0 && (
                <div className="bg-[#fbfbfd] border border-[#e8e8ed] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="space-y-1 flex-1 w-full">
                    <div className="flex justify-between items-center text-xs text-[#86868b] font-medium">
                      <span>Procedure Completion Benchmark</span>
                      <span className="font-mono font-bold text-[#1d1d1f]">
                        {activePlaybook.steps.filter(s => s.done).length} of {activePlaybook.steps.length} Steps Done ({Math.round((activePlaybook.steps.filter(s => s.done).length / activePlaybook.steps.length) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#f5f5f7] rounded-full h-1.5 overflow-hidden border border-[#e8e8ed]">
                      <div 
                        className="bg-[#1d1d1f] h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(activePlaybook.steps.filter(s => s.done).length / activePlaybook.steps.length) * 100}%`,
                          backgroundColor: 'var(--bg-accent)'
                        }}
                      />
                    </div>
                  </div>
                  {activePlaybook.steps.filter(s => s.done).length === activePlaybook.steps.length ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 uppercase tracking-wider shrink-0">
                      Standardized
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 uppercase tracking-wider shrink-0">
                      In Progress
                    </span>
                  )}
                </div>
              )}

              {/* SOP Manual Details Inside a Collapsible Toggle Menu */}
              <div className="border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl bg-[#fbfbfd] dark:bg-[#1d1d1f]/60 overflow-hidden transition-all duration-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowManualDetails(!showManualDetails)}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-[#f5f5f7] dark:hover:bg-[#252526] transition text-left cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#004b49]/10 dark:bg-[#95d1ce]/20 text-[#004b49] dark:text-[#95d1ce] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#1d1d1f] dark:text-white leading-tight">
                          SOP Manual Details & Written Protocols
                        </h4>
                        {isEditing && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded uppercase">
                            Editing Manual
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-[#86868b] dark:text-[#8e8e93] leading-tight truncate mt-0.5">
                        {activePlaybook.instructions ? 'View documentation guidelines, required tools & protocol steps' : 'No written manual documentation provided yet'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold text-[#86868b] dark:text-[#8e8e93] hidden sm:inline">
                      {showManualDetails ? 'Collapse Manual' : 'Expand Manual'}
                    </span>
                    <div className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showManualDetails ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {showManualDetails && (
                  <div className="p-4 sm:p-5 border-t border-[#e8e8ed] dark:border-[#2d2d2f] bg-white dark:bg-[#1d1d1f] space-y-3.5 animate-fade-in">
                    {isEditing ? (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap gap-1.5 items-center bg-[#f5f5f7] dark:bg-[#252526] p-2 rounded-xl border border-[#e8e8ed] dark:border-[#2d2d2f]">
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Templates:</span>
                          <button
                            type="button"
                            onClick={() => setEditInstructions("### Executive Objective\nTo systematically pre-qualify and triage inbound lead enquiries.\n\n### Required Tools\n- Shared CRM Panel\n- Outbound Booking link\n\n### Step Protocols\n1. Inspect email address verification validity.\n2. Cross-reference lead brief parameters.\n3. Send custom booking sequence.")}
                            className="px-2.5 py-1 rounded-md bg-white dark:bg-neutral-800 text-[10px] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 font-medium transition cursor-pointer"
                          >
                            SDR Outreach
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditInstructions("### Executive Objective\nProvide a flawless, automated post-checkout setup for commercial contracts.\n\n### Required Tools\n- Setup Portal\n- Onboarding Folder Template\n\n### Step Protocols\n1. Confirm subscription registration parameters.\n2. Email setup access logs.\n3. Deploy initial welcome roadmap package.")}
                            className="px-2.5 py-1 rounded-md bg-white dark:bg-neutral-800 text-[10px] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 font-medium transition cursor-pointer"
                          >
                            Client Onboarding
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditInstructions("### Executive Objective\nPerform standard audits on deliverable materials before shipping to client.\n\n### Required Tools\n- Specs document\n- QA checklist matrix\n\n### Step Protocols\n1. Validate client spec requirements match.\n2. Perform functional cross-device test checks.\n3. Secure engineering design sign-off.")}
                            className="px-2.5 py-1 rounded-md bg-white dark:bg-neutral-800 text-[10px] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 font-medium transition cursor-pointer"
                          >
                            QA & Delivery
                          </button>
                        </div>
                        <textarea
                          value={editInstructions}
                          onChange={(e) => setEditInstructions(e.target.value)}
                          rows={10}
                          className="w-full bg-[#f5f5f7] dark:bg-[#252526] text-[#1d1d1f] dark:text-white border border-[#e8e8ed] dark:border-[#2d2d2f] focus:border-[#1d1d1f] dark:focus:border-neutral-400 rounded-xl p-3.5 outline-none font-mono text-xs leading-relaxed"
                          placeholder="Document step protocols, tools, and executive guidelines..."
                        />
                      </div>
                    ) : (
                      <div className="bg-[#fbfbfd] dark:bg-[#252526]/40 rounded-xl p-4 border border-[#e8e8ed] dark:border-[#2d2d2f] max-h-[320px] overflow-y-auto no-scrollbar">
                        {activePlaybook.instructions ? (
                          renderSimpleFormatting(activePlaybook.instructions)
                        ) : (
                          <p className="text-xs text-[#86868b] dark:text-[#8e8e93] italic">
                            No instructions documented yet. Click 'Edit Manual' above to add detailed protocols.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Procedural Checklist with Compact Unlock Condition Pickers */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#86868b] dark:text-[#8e8e93] flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-[#004b49] dark:text-[#95d1ce]" />
                    {t('sop.checklist_title', 'Step-by-Step Checklist')}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-[#86868b] bg-[#f5f5f7] dark:bg-[#252526] px-2 py-0.5 rounded-md border border-[#e8e8ed] dark:border-[#2d2d2f]">
                    {(activePlaybook.steps || []).filter(s => s.done).length} of {(activePlaybook.steps || []).length} Completed
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(activePlaybook.steps || []).length === 0 ? (
                    <div className="p-6 text-center rounded-xl border border-dashed border-[#e8e8ed] dark:border-[#2d2d2f] bg-[#fbfbfd] dark:bg-[#252526]/30 space-y-2">
                      <p className="text-xs text-[#86868b] dark:text-[#8e8e93]">
                        No checklist steps created yet for this SOP.
                      </p>
                      {!isEmployee && (
                        <button
                          type="button"
                          onClick={() => handleAddChecklistStep()}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#004b49] dark:text-[#95d1ce] hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> {t('action.add_step_quick', '+ Add Next Step')}
                        </button>
                      )}
                    </div>
                  ) : (
                    (activePlaybook.steps || []).map((s, index) => {
                      const blocker = s.dependsOnStepId ? (activePlaybook.steps || []).find(other => other.id === s.dependsOnStepId) : null;
                      const isBlocked = blocker ? !blocker.done : false;
                      const dependents = (activePlaybook.steps || []).filter(other => other.dependsOnStepId === s.id);
                      const isEditingThisStep = editingStepId === s.id;

                      return (
                        <div 
                          key={s.id} 
                          className={`p-3 bg-[#fbfbfd] dark:bg-[#1d1d1f] rounded-xl border transition space-y-2 group ${
                            isBlocked 
                              ? 'bg-neutral-50/70 dark:bg-neutral-900/40 border-neutral-200/50 dark:border-neutral-800 opacity-80' 
                              : s.done 
                                ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20' 
                                : 'border-[#e8e8ed] dark:border-[#2d2d2f] hover:border-neutral-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Left: Input Checkbox / Lock icon & text */}
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              {isBlocked ? (
                                <div className="p-0.5 mt-0.5 text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded shadow-2xs shrink-0" title="Locked! Complete prerequisite step first.">
                                  <Lock className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={s.done}
                                  onChange={() => handleToggleChecklistStep(s.id)}
                                  className="w-4 h-4 text-[#004b49] dark:text-[#95d1ce] border-[#e8e8ed] dark:border-neutral-700 rounded cursor-pointer mt-0.5 focus:ring-0 shrink-0"
                                />
                              )}

                              <div className="flex-1 min-w-0">
                                {isEditingThisStep ? (
                                  <div className="flex gap-1.5 items-center">
                                    <input
                                      type="text"
                                      value={editingStepText}
                                      onChange={(e) => setEditingStepText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveStepText(s.id);
                                        if (e.key === 'Escape') setEditingStepId(null);
                                      }}
                                      className="bg-white dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] focus:border-[#1d1d1f] dark:focus:border-white rounded-lg px-2.5 py-1 text-xs outline-none flex-1 font-semibold text-[#1d1d1f] dark:text-white"
                                      autoFocus
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => handleSaveStepText(s.id)}
                                      className="bg-[#004b49] text-white dark:bg-[#95d1ce] dark:text-[#003735] p-1.5 rounded-lg hover:opacity-90 transition cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => setEditingStepId(null)}
                                      className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 p-1 rounded-lg text-[9px] font-bold px-1.5 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <span 
                                    onDoubleClick={() => !isEmployee && startEditStepText(s.id, s.text)}
                                    className={`text-xs font-semibold block leading-relaxed break-words cursor-pointer ${
                                      s.done ? "line-through text-[#86868b] dark:text-[#8e8e93] decoration-[#86868b]" : "text-[#1d1d1f] dark:text-neutral-100"
                                    } ${isBlocked ? 'text-[#86868b] font-medium' : ''}`}
                                    title={!isEmployee ? "Double click to edit step text" : ""}
                                  >
                                    <span className="font-mono text-[#86868b] mr-1.5 text-[11px]">{index + 1}.</span>
                                    {s.text}
                                  </span>
                                )}

                                {/* Dynamic Relationship Badges */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {isBlocked && blocker && (
                                    <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 px-2 py-0.5 rounded-md text-[9px] font-bold leading-none shrink-0 uppercase tracking-wider">
                                      <AlertCircle className="w-2.5 h-2.5" />
                                      {t('sop.blocked_by', 'Wait for:')} <strong className="underline decoration-dotted truncate max-w-[150px]">{blocker.text}</strong>
                                    </span>
                                  )}

                                  {!isBlocked && s.dependsOnStepId && blocker && (
                                    <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-md text-[9px] font-bold leading-none shrink-0 uppercase tracking-wider">
                                      <Unlock className="w-2.5 h-2.5" />
                                      {t('sop.unlocked', 'Ready to start')}
                                    </span>
                                  )}

                                  {dependents.length > 0 && (
                                    <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40 px-2 py-0.5 rounded-md text-[9px] font-bold leading-none shrink-0 uppercase tracking-wider">
                                      <Link className="w-2.5 h-2.5" />
                                      Blocks ({dependents.length})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Step edit/delete buttons */}
                            {!isEmployee && (
                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition duration-150">
                                <button
                                  type="button"
                                  onClick={() => startEditStepText(s.id, s.text)}
                                  className="text-[#86868b] hover:text-neutral-900 dark:hover:text-white p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                                  title="Edit description"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChecklistStep(s.id)}
                                  className="text-[#86868b] hover:text-red-500 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                                  title="Remove step"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Compact, Spatial-Optimized Unlock Condition Picker */}
                          {!isEmployee && !isEditingThisStep && (activePlaybook.steps || []).length > 1 && (
                            <div className="pt-2 border-t border-dashed border-[#e8e8ed] dark:border-[#2d2d2f] flex flex-wrap items-center justify-between text-[10.5px] gap-2">
                              <span className="text-[#86868b] dark:text-[#8e8e93] font-medium flex items-center gap-1 shrink-0 text-[10px]">
                                <Link className="w-3 h-3 text-[#004b49] dark:text-[#95d1ce]" />
                                {t('sop.unlock_condition', 'Must complete first:')}
                              </span>
                              <select
                                value={s.dependsOnStepId || ''}
                                onChange={(e) => handleUpdateStepDependency(s.id, e.target.value)}
                                className="bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] text-[10px] rounded-lg px-2 py-0.5 outline-none font-semibold cursor-pointer text-[#1d1d1f] dark:text-neutral-200 max-w-[200px] sm:max-w-[280px] truncate"
                                title="Select prerequisite step that must be completed first"
                              >
                                <option value="">{t('sop.none_always_open', 'None (Start anytime)')}</option>
                                {(activePlaybook.steps || [])
                                  .filter(other => other.id !== s.id)
                                  .map((other) => (
                                    <option key={other.id} value={other.id}>
                                      {t('sop.requires', 'Requires:')} {other.text.length > 36 ? `${other.text.slice(0, 36)}…` : other.text}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Compact Add Step Block */}
                {!isEmployee && (
                  <div className="bg-[#fbfbfd] dark:bg-[#1d1d1f]/60 border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-xl p-2.5 sm:p-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t('sop.step_placeholder', 'Type what to do in this step...')}
                        value={newStepText}
                        onChange={(e) => setNewStepText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChecklistStep();
                          }
                        }}
                        className="bg-white dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] focus:border-[#1d1d1f] dark:focus:border-neutral-400 text-xs text-[#1d1d1f] dark:text-white rounded-lg px-3 py-1.5 outline-none transition flex-1 font-medium"
                      />
                      <button
                        type="button"
                        id="sop-add-step-btn"
                        onClick={() => handleAddChecklistStep()}
                        className="bg-[#004b49] dark:bg-[#95d1ce] hover:opacity-90 text-white dark:text-[#003735] font-bold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center cursor-pointer transition shrink-0 shadow-xs"
                        title="Add this step (or click to create new step)"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {t('action.add_step', 'Add Step')}
                      </button>
                    </div>

                    {(activePlaybook.steps || []).length > 0 && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-neutral-800 text-[10.5px]">
                        <label className="text-[10px] font-medium text-[#86868b] dark:text-[#8e8e93] flex items-center gap-1 shrink-0">
                          <Link className="w-3 h-3 text-[#004b49] dark:text-[#95d1ce]" />
                          {t('sop.unlock_condition', 'Must complete first:')}
                        </label>
                        <select
                          value={newStepDependsOnId}
                          onChange={(e) => setNewStepDependsOnId(e.target.value)}
                          className="bg-white dark:bg-[#252526] border border-[#e8e8ed] dark:border-[#2d2d2f] text-[10px] rounded-md px-2 py-0.5 outline-none transition focus:border-[#1d1d1f] text-[#1d1d1f] dark:text-neutral-200 cursor-pointer max-w-[220px] sm:max-w-[280px] truncate"
                        >
                          <option value="">{t('sop.none_always_open', 'None (Start anytime)')}</option>
                          {(activePlaybook.steps || []).map(other => (
                            <option key={other.id} value={other.id}>
                              {t('sop.requires', 'Requires:')} {other.text.length > 36 ? `${other.text.slice(0, 36)}…` : other.text}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Compact Walkthrough Video Box */}
                <div className="bg-[#f5f5f7] dark:bg-[#252526]/50 rounded-xl p-3 border border-[#e8e8ed] dark:border-[#2d2d2f] text-[#1d1d1f] dark:text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-[#004b49]/10 dark:bg-[#95d1ce]/20 text-[#004b49] dark:text-[#95d1ce] flex items-center justify-center shrink-0">
                      <Video className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold tracking-wider uppercase block text-[#1d1d1f] dark:text-white leading-tight">
                        Screen Protocol Walkthrough
                      </span>
                      <span className="text-[10px] text-[#86868b] dark:text-[#8e8e93] block truncate">
                        {activePlaybook.videoUrl ? activePlaybook.videoUrl : "No walkthrough recording linked yet"}
                      </span>
                    </div>
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="Loom / video URL (e.g. https://www.loom.com/share/...)"
                      value={editVideoUrl}
                      onChange={(e) => setEditVideoUrl(e.target.value)}
                      className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] text-xs rounded-lg px-2.5 py-1 text-[#1d1d1f] dark:text-white outline-none w-full sm:w-64 shrink-0"
                    />
                  ) : activePlaybook.videoUrl ? (
                    <a
                      href={activePlaybook.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10.5px] font-bold text-[#004b49] dark:text-[#95d1ce] hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>Watch Walkthrough</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                </div>

              </div>

            </div>
          ) : (
            <div className="text-center text-[#86868b] py-24">
              <HelpCircle className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-sm font-semibold">No active manual select.</p>
              <p className="text-xs">Create a new playbook first in the sidebar directory.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
