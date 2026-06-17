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
  Redo
} from 'lucide-react';
import { Playbook, TeamMember, ValueEngineNode } from '../types';

interface PlaybookFolderViewProps {
  playbooks: Playbook[];
  teamMembers: TeamMember[];
  nodes: ValueEngineNode[];
  onUpdatePlaybooks: (updated: Playbook[]) => void;
  selectedPlaybookId: string | null;
  setSelectedPlaybookId: (id: string | null) => void;
  userRole?: 'ceo' | 'employee';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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
    const stepObj = activePlaybook.steps.find(s => s.id === stepId);
    if (stepObj && !stepObj.done && stepObj.dependsOnStepId) {
      const blockerObj = activePlaybook.steps.find(s => s.id === stepObj.dependsOnStepId);
      if (blockerObj && !blockerObj.done) {
        return; // Blocked!
      }
    }

    const updated = playbooks.map(p => {
      if (p.id === activePlaybook.id) {
        return {
          ...p,
          steps: p.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s)
        };
      }
      return p;
    });
    onUpdatePlaybooks(updated);
  };

  const handleAddChecklistStep = () => {
    if (!newStepText.trim() || !activePlaybook) return;
    const newStep = {
      id: `step-inline-${Date.now()}`,
      text: newStepText.trim(),
      done: false,
      dependsOnStepId: newStepDependsOnId || undefined
    };

    const updated = playbooks.map(p => {
      if (p.id === activePlaybook.id) {
        return {
          ...p,
          steps: [...p.steps, newStep]
        };
      }
      return p;
    });

    onUpdatePlaybooks(updated);
    setNewStepText('');
    setNewStepDependsOnId('');
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

              {/* Grid: Instructions vs Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Column 1: Verification Checklist Steps */}
                <div className="space-y-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#86868b] flex items-center gap-1">
                    <CheckSquare className="w-4 h-4 text-[#1d1d1f]" />
                    Procedural checklist
                  </h4>

                  <div className="space-y-3">
                    {activePlaybook.steps.length === 0 ? (
                      <p className="text-[#86868b] text-center py-6 text-xs bg-[#fbfbfd] border border-[#e8e8ed] border-dashed rounded-2xl">
                        No verification checklist items mapped yet.
                      </p>
                    ) : (
                      activePlaybook.steps.map(s => {
                        const blocker = s.dependsOnStepId ? activePlaybook.steps.find(other => other.id === s.dependsOnStepId) : null;
                        const isBlocked = blocker ? !blocker.done : false;
                        const dependents = activePlaybook.steps.filter(other => other.dependsOnStepId === s.id);
                        const isEditingThisStep = editingStepId === s.id;

                        return (
                          <div 
                            key={s.id} 
                            className={`p-3.5 bg-[#fbfbfd] dark:bg-[#1d1d1f] rounded-xl border transition space-y-2.5 ${
                              isBlocked 
                                ? 'bg-neutral-50/70 border-neutral-200/50 opacity-80' 
                                : s.done 
                                  ? 'border-emerald-100 bg-emerald-50/10' 
                                  : 'border-[#e8e8ed] hover:border-neutral-400'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* Left: Input Checkbox / Lock icon & text */}
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                {isBlocked ? (
                                  <div className="p-0.5 mt-0.5 text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded shadow-2xs shrink-0" title={`Locked! Complete pre-requisite first.`}>
                                    <Lock className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={s.done}
                                    onChange={() => handleToggleChecklistStep(s.id)}
                                    className="w-4 h-4 text-[#1d1d1f] border-[#e8e8ed] rounded cursor-pointer mt-0.5 focus:ring-0 shrink-0"
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
                                        className="bg-white border border-[#e8e8ed] focus:border-[#1d1d1f] rounded-lg px-2.5 py-1 text-xs outline-none flex-1 font-semibold text-[#1d1d1f] dark:text-white"
                                        autoFocus
                                      />
                                      <button 
                                        onClick={() => handleSaveStepText(s.id)}
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 p-1.5 rounded-lg hover:opacity-85 transition cursor-pointer"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button 
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
                                        s.done ? "line-through text-[#86868b] decoration-[#86868b]" : "text-[#1d1d1f] dark:text-neutral-200"
                                      } ${isBlocked ? 'text-[#86868b] font-medium' : ''}`}
                                      title={!isEmployee ? "Double click to edit step text" : ""}
                                    >
                                      {s.text}
                                    </span>
                                  )}

                                  {/* Dynamic Relationship Badge displays */}
                                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    {isBlocked && blocker && (
                                      <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100/60 px-2 py-0.5 rounded-md text-[9px] font-bold leading-none shrink-0 uppercase tracking-wider">
                                        <AlertCircle className="w-2.5 h-2.5" />
                                        Blocked By: <strong className="underline decoration-dotted">{blocker.text}</strong>
                                      </span>
                                    )}

                                    {!isBlocked && s.dependsOnStepId && blocker && (
                                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-[9px] font-bold leading-none shrink-0 uppercase tracking-wider">
                                        <Unlock className="w-2.5 h-2.5" />
                                        Prerequisite Clear
                                      </span>
                                    )}

                                    {dependents.length > 0 && (
                                      <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md text-[9px] font-bold leading-none shrink-0 uppercase tracking-wider">
                                        <Link className="w-2.5 h-2.5" />
                                        Blocks downstream tasks ({dependents.length})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Inline Step settings controls */}
                              {!isEmployee && (
                                <div className="flex items-center gap-1 shrink-0 animate-fade-in opacity-0 group-hover:opacity-100">
                                  <button
                                    onClick={() => startEditStepText(s.id, s.text)}
                                    className="text-[#86868b] hover:text-neutral-900 p-1 rounded hover:bg-neutral-100 transition cursor-pointer"
                                    title="Edit description"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteChecklistStep(s.id)}
                                    className="text-[#86868b] hover:text-red-500 p-1 rounded hover:bg-neutral-100 transition cursor-pointer"
                                    title="Remove step"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Blocking relation dropdown controller */}
                            {!isEmployee && !isEditingThisStep && activePlaybook.steps.length > 1 && (
                              <div className="pt-2 border-t border-dashed border-[#e8e8ed] dark:border-neutral-800 flex items-center justify-between text-[10px] gap-2">
                                <span className="text-[#86868b] font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                                  <Link className="w-3 h-3 text-[#86868b]" />
                                  Unlock condition:
                                </span>
                                <select
                                  value={s.dependsOnStepId || ''}
                                  onChange={(e) => handleUpdateStepDependency(s.id, e.target.value)}
                                  className="bg-[#f5f5f7] border border-[#e8e8ed] text-[10px] rounded-lg px-2 py-1 outline-none font-bold cursor-pointer text-[#1d1d1f] focus:outline-none focus:border-neutral-500"
                                >
                                  <option value="">-- No blocker step --</option>
                                  {activePlaybook.steps
                                    .filter(other => other.id !== s.id) // Filter self to prevent self loops
                                    .map(other => (
                                      <option key={other.id} value={other.id}>
                                        Depends on completion of: {other.text}
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

                  {/* Add Checklist Step Inline Block */}
                  {!isEmployee && (
                    <div className="bg-[#fbfbfd] border border-[#e8e8ed] rounded-xl p-3.5 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add compliance verification step..."
                          value={newStepText}
                          onChange={(e) => setNewStepText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddChecklistStep();
                            }
                          }}
                          className="bg-white border border-[#e8e8ed] focus:border-[#1d1d1f] text-xs rounded-xl px-3 py-2.5 outline-none transition flex-1"
                        />
                        <button
                          onClick={handleAddChecklistStep}
                          className="bg-[#1d1d1f] hover:bg-neutral-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center cursor-pointer transition shrink-0"
                        >
                          Add Step
                        </button>
                      </div>

                      {activePlaybook.steps.length > 0 && (
                        <div className="flex flex-col gap-1 px-0.5">
                          <label className="text-[9px] uppercase font-bold text-[#86868b] flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Blocker condition (Pre-requisite step to complete first)
                          </label>
                          <select
                            value={newStepDependsOnId}
                            onChange={(e) => setNewStepDependsOnId(e.target.value)}
                            className="bg-white border border-[#e8e8ed] text-[11px] rounded-xl px-2 py-1.5 outline-none transition focus:border-[#1d1d1f] w-full text-[#1d1d1f] cursor-pointer"
                          >
                            <option value="">-- Start immediately (No dependency blocker) --</option>
                            {activePlaybook.steps.map(other => (
                              <option key={other.id} value={other.id}>Requires completion of: {other.text}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loom Video Capture box resembling Apple Guides style */}
                  <div className="bg-[#f5f5f7] rounded-2xl p-5 border border-[#e8e8ed] text-[#1d1d1f] space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-[#1d1d1f]" />
                        <span className="text-[10px] font-semibold tracking-wider text-[#1d1d1f] uppercase">SCREEN PROTOCOL RECORD</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#86868b]">SOP VIDEO</span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-[#86868b] block font-semibold">Loom/Video Share URL</label>
                        <input
                          type="text"
                          placeholder="e.g. https://www.loom.com/share/..."
                          value={editVideoUrl}
                          onChange={(e) => setEditVideoUrl(e.target.value)}
                          className="bg-white border border-[#e8e8ed] text-xs rounded-xl p-2.5 text-[#1d1d1f] outline-none w-full"
                        />
                      </div>
                    ) : (
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-5 flex flex-col items-center justify-center text-center gap-1.5 h-28 relative overflow-hidden group">
                        <Video className="w-7 h-7 text-[#86868b] group-hover:scale-105 transition duration-150" />
                        <span className="text-xs font-semibold text-[#1d1d1f]">
                          {activePlaybook.videoUrl ? "Captured session playable" : "No Walkthrough Video Linked"}
                        </span>
                        <p className="text-[10px] text-[#86868b] max-w-[200px] leading-tight line-clamp-1">
                          {activePlaybook.videoUrl 
                            ? activePlaybook.videoUrl
                            : "Provide screen shares using Loom to document while doing."
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Detailed Text Instructions */}
                <div className="space-y-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#86868b] flex items-center gap-1">
                    <FileText className="w-4 h-4 text-[#1d1d1f]" />
                    Sop manual details
                  </h4>

                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5 items-center bg-[#f5f5f7] p-2 rounded-xl border border-[#e8e8ed]">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Templates:</span>
                        <button
                          type="button"
                          onClick={() => setEditInstructions("### Executive Objective\nTo systematically pre-qualify and triage inbound lead enquiries.\n\n### Required Tools\n- Shared CRM Panel\n- Outbound Booking link\n\n### Step Protocols\n1. Inspect email address verification validity.\n2. Cross-reference lead brief parameters.\n3. Send custom booking sequence.")}
                          className="px-2.5 py-1 rounded bg-white text-[10px] border border-neutral-200 text-neutral-700 hover:border-neutral-400 font-medium transition cursor-pointer"
                        >
                          SDR Outreach
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditInstructions("### Executive Objective\nProvide a flawless, automated post-checkout setup for commercial contracts.\n\n### Required Tools\n- Setup Portal\n- Onboarding Folder Template\n\n### Step Protocols\n1. Confirm subscription registration parameters.\n2. Email setup access logs.\n3. Deploy initial welcome roadmap package.")}
                          className="px-2.5 py-1 rounded bg-white text-[10px] border border-neutral-200 text-neutral-700 hover:border-neutral-400 font-medium transition cursor-pointer"
                        >
                          Client Onboarding
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditInstructions("### Executive Objective\nPerform standard audits on deliverable materials before shipping to client.\n\n### Required Tools\n- Specs document\n- QA checklist matrix\n\n### Step Protocols\n1. Validate client spec requirements match.\n2. Perform functional cross-device test checks.\n3. Secure engineering design sign-off.")}
                          className="px-2.5 py-1 rounded bg-white text-[10px] border border-neutral-200 text-neutral-700 hover:border-neutral-400 font-medium transition cursor-pointer"
                        >
                          QA & Delivery
                        </button>
                      </div>
                      <textarea
                        value={editInstructions}
                        onChange={(e) => setEditInstructions(e.target.value)}
                        rows={14}
                        className="w-full bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] rounded-xl p-3.5 outline-none font-mono text-xs leading-relaxed"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#fbfbfd] rounded-2xl p-5 border border-[#e8e8ed] max-h-[460px] overflow-y-auto">
                      {renderSimpleFormatting(activePlaybook.instructions)}
                    </div>
                  )}
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
