import { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  FileText, 
  ArrowRight, 
  CheckCircle,
  HelpCircle,
  GitCommit,
  Sparkles,
  Lock,
  Unlock,
  X,
  Undo,
  Redo
} from 'lucide-react';
import { ValueEngineNode, Playbook } from '../types';

interface ValueEngineViewProps {
  nodes: ValueEngineNode[];
  playbooks: Playbook[];
  onUpdateNodes: (updatedNodes: ValueEngineNode[]) => void;
  onNavigateToPlaybook: (playbookId: string, title?: string, powerStageId?: string, powerStageLabel?: string) => void;
  userRole?: 'ceo' | 'employee';
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function ValueEngineView({
  nodes,
  playbooks,
  onUpdateNodes,
  onNavigateToPlaybook,
  userRole = 'ceo',
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}: ValueEngineViewProps) {
  const [activeEngine, setActiveEngine] = useState<'growth' | 'fulfillment'>('growth');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes[0]?.id || null);
  const [isAddingNode, setIsAddingNode] = useState(false);

  const isEmployee = userRole === 'employee';

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

  // New Node Form fields
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [newNodeType, setNewNodeType] = useState<'start' | 'process' | 'decision' | 'outcome'>('process');
  const [isNewPowerStage, setIsNewPowerStage] = useState(false);

  // Filter nodes for active track
  const filteredNodes = nodes.filter(n => n.engineType === activeEngine);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const handleUpdateNodeField = (nodeId: string, field: keyof ValueEngineNode, value: any) => {
    const updated = nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, [field]: value };
      }
      return n;
    });
    onUpdateNodes(updated);
  };

  const handleCreateNode = () => {
    if (!newNodeLabel.trim()) return;

    const newId = `ve-custom-${Date.now()}`;
    const xPositions = filteredNodes.map(n => n.x);
    const maxX = xPositions.length > 0 ? Math.max(...xPositions) : 100;

    const newNode: ValueEngineNode = {
      id: newId,
      label: newNodeLabel,
      type: newNodeType,
      x: maxX + 180,
      y: 155,
      engineType: activeEngine,
      description: newNodeDesc,
      isPowerStage: isNewPowerStage,
      playbookId: ''
    };

    onUpdateNodes([...nodes, newNode]);
    setSelectedNodeId(newId);

    // Reset Form
    setNewNodeLabel('');
    setNewNodeDesc('');
    setNewNodeType('process');
    setIsNewPowerStage(false);
    setIsAddingNode(false);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updated = nodes.filter(n => n.id !== nodeId);
    onUpdateNodes(updated);
    if (selectedNodeId === nodeId) {
      const remainingOfTrack = updated.filter(n => n.engineType === activeEngine);
      setSelectedNodeId(remainingOfTrack[0]?.id || null);
    }
  };

  const moveNodeSequence = (direction: 'left' | 'right') => {
    if (!selectedNodeId) return;
    const idx = filteredNodes.findIndex(n => n.id === selectedNodeId);
    if (idx === -1) return;

    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= filteredNodes.length) return;

    const nodeA = filteredNodes[idx];
    const nodeB = filteredNodes[targetIdx];

    const finalNodes = [...nodes];
    const posA = finalNodes.findIndex(n => n.id === nodeA.id);
    const posB = finalNodes.findIndex(n => n.id === nodeB.id);

    if (posA !== -1 && posB !== -1) {
      const temp = finalNodes[posA];
      finalNodes[posA] = finalNodes[posB];
      finalNodes[posB] = temp;
      onUpdateNodes(finalNodes);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      
      {/* Introduction Banner & Tab Switcher - Simple Apple Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-[#e8e8ed] p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[#1d1d1f] flex items-center gap-2">
            Company Operating Pipelines
          </h2>
          <p className="text-[#86868b] text-xs max-w-xl">
            Visualize your core channels. Every scalable team maps these two basic functions: acquiring and sourcing leads (Growth Pipeline) and delivering high-fidelity operations to customers (Fulfillment Pipeline).
          </p>
        </div>

        {/* Action Controls & Apple Style Segmented Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Undo / Redo controls */}
          {(onUndo || onRedo) && (
            <div className="inline-flex rounded-full bg-[#f5f5f7] p-1 border border-[#e8e8ed] items-center gap-1">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-2 rounded-full transition ${
                  canUndo
                    ? 'text-neutral-800 hover:bg-[#e8e8ed] hover:scale-105 active:scale-95 cursor-pointer'
                    : 'text-neutral-300 cursor-not-allowed opacity-30 font-sans'
                }`}
                title="Undo (Ctrl+Z)"
                id="ve-undo-btn"
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
                title="Redo (Ctrl+Y)"
                id="ve-redo-btn"
              >
                <Redo className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="inline-flex rounded-full bg-[#f5f5f7] p-1 border border-[#e8e8ed]">
            <button
              onClick={() => {
                setActiveEngine('growth');
                const growth = nodes.filter(n => n.engineType === 'growth');
                setSelectedNodeId(growth[0]?.id || null);
              }}
              className={`px-5 py-2 text-xs font-semibold rounded-full transition cursor-pointer ${
                activeEngine === 'growth' 
                  ? 'bg-[#1d1d1f] text-white shadow-sm' 
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Growth & Lead Sourcing
            </button>
            <button
              onClick={() => {
                setActiveEngine('fulfillment');
                const fulfill = nodes.filter(n => n.engineType === 'fulfillment');
                setSelectedNodeId(fulfill[0]?.id || null);
              }}
              className={`px-5 py-2 text-xs font-semibold rounded-full transition cursor-pointer ${
                activeEngine === 'fulfillment' 
                  ? 'bg-[#1d1d1f] text-white shadow-sm' 
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Fulfillment & Delivery Flow
            </button>
          </div>
        </div>
      </div>

      {/* Visual Canvas View */}
      <div className="bg-white border border-[#e8e8ed] rounded-2xl p-8 overflow-x-auto shadow-sm min-h-[260px] flex items-center relative">
        <div className="flex items-center gap-6 min-w-max mx-auto py-4">
          {filteredNodes.length === 0 ? (
            <div className="text-center text-[#86868b] p-12 max-w-md mx-auto">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-sm text-[#1d1d1f]">No steps mapped in this track yet.</p>
              <p className="text-xs mt-1">Start by appending custom stages below.</p>
            </div>
          ) : (
            filteredNodes.map((node, index) => {
              const isSelected = selectedNodeId === node.id;
              const hasPlaybook = !!node.playbookId;

              // Extract playbook status details for live feedback
              const linkedPlaybook = playbooks.find(p => p.id === node.playbookId);
              let nodeBlockedSteps = 0;
              let nodeTotalSteps = 0;
              let nodeCompletedSteps = 0;

              if (linkedPlaybook && linkedPlaybook.steps) {
                nodeTotalSteps = linkedPlaybook.steps.length;
                nodeCompletedSteps = linkedPlaybook.steps.filter(s => s.done).length;
                linkedPlaybook.steps.forEach(s => {
                  if (!s.done && s.dependsOnStepId) {
                    const blocker = linkedPlaybook.steps.find(other => other.id === s.dependsOnStepId);
                    if (blocker && !blocker.done) {
                      nodeBlockedSteps++;
                    }
                  }
                });
              }

              return (
                <div key={node.id} className="flex items-center gap-4">
                  {/* Step Node Block */}
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`relative w-48 p-5 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between h-36 ${
                      isSelected
                        ? 'border-[#1d1d1f] bg-[#fbfbfd] shadow-sm transform translate-y-[-2px]'
                        : 'border-[#e8e8ed] bg-white hover:border-[#1d1d1f] hover:shadow-xs'
                    }`}
                  >
                    {/* Node Type Indicator */}
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-semibold text-[#86868b] tracking-wide">
                        {node.type === 'start' ? '🟢 Starts Trigger' :
                         node.type === 'process' ? '⚙️ Process Step' :
                         node.type === 'decision' ? '🔀 Choice Branch' :
                         node.type === 'outcome' ? '🏆 Success Milestone' : '⚙️ Process Step'}
                      </span>
                      {node.isPowerStage && (
                        <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium">
                          <Zap className="w-3 h-3 fill-current" /> Critical
                        </span>
                      )}
                    </div>

                    {/* Step Title */}
                    <div className="my-1 text-left">
                      <h4 className="font-semibold text-[#1d1d1f] text-[13px] leading-tight line-clamp-2">
                        {node.label}
                      </h4>
                    </div>

                    {/* Footer / Connection Badge */}
                    <div className="flex items-center justify-between text-[11px] border-t border-[#f5f5f7] pt-2 text-[#86868b]">
                      <span className="font-mono text-[9px]">STEP 0{index + 1}</span>
                      {hasPlaybook && (
                        nodeBlockedSteps > 0 ? (
                          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-500 font-bold text-[10px]" title="Contains blocked steps!">
                            <Lock className="w-2.5 h-2.5 animate-pulse" /> {nodeBlockedSteps} Blocked
                          </span>
                        ) : nodeCompletedSteps === nodeTotalSteps && nodeTotalSteps > 0 ? (
                          <span className="flex items-center gap-0.5 text-emerald-600 font-bold text-[10px]">
                            <CheckCircle className="w-3 h-3" /> Done
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-blue-600 font-bold text-[10px]">
                            <Unlock className="w-2.5 h-2.5" /> SOP Clear
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Connecting Arrow */}
                  {index < filteredNodes.length - 1 && (
                    <div className="flex flex-col items-center text-neutral-300">
                      <ArrowRight className="w-4 h-4" />
                      {node.id === 've-g-7' && activeEngine === 'growth' && (
                        <span className="text-[8px] font-mono uppercase tracking-tight text-[#86868b] mt-1 max-w-[50px] text-center leading-none">
                          Fulfill
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Inline Add Quick Button */}
          {!isEmployee && (
            <button
              onClick={() => setIsAddingNode(true)}
              className="border border-[#e8e8ed] hover:border-[#1d1d1f] bg-[#fbfbfd] hover:bg-[#f5f5f7] h-36 w-14 rounded-2xl flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition cursor-pointer"
              title="Append custom step"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid: Selected Node Detail Controller & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Step Modifier Detail Panel */}
        <div className="lg:col-span-2 bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm space-y-6">
          {isEmployee && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 text-xs leading-relaxed font-medium">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Teammate Operational Flow. Core company pipelines are managed by administrator credentials.</span>
            </div>
          )}
          {selectedNode ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-[#f5f5f7] pb-4">
                <div>
                  <h3 className="font-medium text-[#1d1d1f] text-base">
                    Step Configuration
                  </h3>
                  <p className="text-[#86868b] text-xs">
                    View specific operational actions, types, descriptions, and linked step checklist SOPs.
                  </p>
                </div>
                {!isEmployee && (
                  <button
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition duration-150 flex items-center gap-1 text-xs cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove step
                  </button>
                )}
              </div>

              {/* Node Sequence Arranger */}
              {!isEmployee && filteredNodes.length > 1 && (
                <div className="flex items-center gap-3 bg-[#fbfbfd] p-3 rounded-xl border border-[#e8e8ed] text-xs">
                  <span className="font-semibold text-xs text-[#1d1d1f]">Sequence Flow Controller:</span>
                  <div className="flex gap-1.5 ml-auto">
                    <button
                      onClick={() => moveNodeSequence('left')}
                      disabled={filteredNodes.findIndex(n => n.id === selectedNodeId) === 0}
                      className="px-3 py-1.5 rounded-xl border border-[#e8e8ed] bg-white text-[#1d1d1f] hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition cursor-pointer text-xs"
                    >
                      ← Move Left
                    </button>
                    <button
                      onClick={() => moveNodeSequence('right')}
                      disabled={filteredNodes.findIndex(n => n.id === selectedNodeId) === filteredNodes.length - 1}
                      className="px-3 py-1.5 rounded-xl border border-[#e8e8ed] bg-white text-[#1d1d1f] hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition cursor-pointer text-xs"
                    >
                      Move Right →
                    </button>
                  </div>
                </div>
              )}

              {/* Form Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                
                {/* Node Title */}
                <div className="space-y-1.5">
                  <label className="block text-[#1d1d1f] font-medium text-xs">Step / Stage Name</label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    disabled={isEmployee}
                    onChange={(e) => handleUpdateNodeField(selectedNode.id, 'label', e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] rounded-xl p-3 outline-none transition disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Node Type */}
                <div className="space-y-1.5">
                  <label className="block text-[#1d1d1f] font-medium text-xs">Activity Type</label>
                  <select
                    value={selectedNode.type}
                    disabled={isEmployee}
                    onChange={(e) => handleUpdateNodeField(selectedNode.id, 'type', e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] rounded-xl p-3 outline-none cursor-pointer transition text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="start">Starting Activity Trigger</option>
                    <option value="process">Standard Process Step</option>
                    <option value="decision">Branching Goal Decision</option>
                    <option value="outcome">Success Milestone Outcome</option>
                  </select>
                </div>

                {/* Node Description */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-[#1d1d1f] font-medium text-xs">Team Instruction & Process Goal</label>
                  <textarea
                    value={selectedNode.description}
                    disabled={isEmployee}
                    onChange={(e) => handleUpdateNodeField(selectedNode.id, 'description', e.target.value)}
                    rows={2}
                    className="w-full bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] rounded-xl p-3 outline-none transition resize-none leading-relaxed text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Audit: Is Power Stage Toggle */}
                <div className="md:col-span-2 flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-[#fbfbfd] rounded-xl border border-[#e8e8ed] gap-4">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[#1d1d1f] flex items-center gap-1.5 text-xs">
                      <Zap className="w-4 h-4 text-red-500 fill-current" />
                      Critical Milestone Stage?
                    </span>
                    <p className="text-[#86868b] text-[11px] leading-relaxed">
                      Highlight this stage as a critical business checkpoint requiring checklist enforcement.
                    </p>
                  </div>
                  
                  {!isEmployee ? (
                    <button
                      onClick={() => handleUpdateNodeField(selectedNode.id, 'isPowerStage', !selectedNode.isPowerStage)}
                      className={`px-4 py-2 text-xs font-semibold rounded-full border transition duration-150 cursor-pointer ${
                        selectedNode.isPowerStage
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-white border-[#e8e8ed] text-[#1d1d1f]'
                      }`}
                    >
                      {selectedNode.isPowerStage ? '⚠️ Yes, Critical Stage' : 'No'}
                    </button>
                  ) : (
                    <span className={`px-4 py-2 text-xs font-semibold border rounded-full ${
                      selectedNode.isPowerStage ? 'bg-red-50/50 border-red-100/60 text-red-700' : 'bg-neutral-50 border-neutral-100 text-neutral-400'
                    }`}>
                      {selectedNode.isPowerStage ? '⚠️ Yes, Critical Milestone' : 'Unflagged'}
                    </span>
                  )}
                </div>

                {/* Playbook Link Box */}
                <div className="md:col-span-2 border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-xl p-5 space-y-4 bg-[#fbfbfd] dark:bg-[#252526]/50">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <h4 className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-[#86868b]" />
                      Linked SOP Checklist (Standard Operating Procedure)
                    </h4>
                    {selectedNode.playbookId ? (
                      <button
                        onClick={() => onNavigateToPlaybook(selectedNode.playbookId || '')}
                        className="text-xs text-[#1d1d1f] hover:opacity-80 flex items-center gap-1 font-semibold text-sky-600 hover:underline cursor-pointer"
                      >
                        Execute SOP Checklist &rarr;
                      </button>
                    ) : !isEmployee ? (
                      <button
                        onClick={() => {
                          const generatedId = `pb-gen-${Date.now()}`;
                          onNavigateToPlaybook(
                            generatedId, 
                            `SOP: ${selectedNode.label}`, 
                            selectedNode.id, 
                            selectedNode.label
                          );
                        }}
                        className="bg-[#1d1d1f] hover:bg-neutral-850 text-white dark:bg-white dark:text-[#1d1d1f] rounded-full px-4 py-1.5 text-xs flex items-center gap-1 cursor-pointer transition font-medium"
                      >
                        <Plus className="w-3 h-3" /> Create linked SOP
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400 italic">No checklist mapped yet</span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-[#86868b] text-[11px] font-medium">Connect Standard Process Guide</label>
                    <select
                      value={selectedNode.playbookId || ''}
                      disabled={isEmployee}
                      onChange={(e) => handleUpdateNodeField(selectedNode.id, 'playbookId', e.target.value)}
                      className="w-full bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-xl p-3 outline-none cursor-pointer transition text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      <option value="">-- No SOP Connected --</option>
                      {playbooks.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center text-[#86868b] py-12 text-sm">
              <HelpCircle className="w-8 h-8 mx-auto opacity-30 mb-2" />
              Select a stage block node above to view and tweak workflow rules.
            </div>
          )}
        </div>

      </div>

      {/* Floating Pop-up Modal to Add Pipeline Step */}
      {isAddingNode && !isEmployee && (
        <div className="fixed inset-0 bg-[#1d1d1f]/65 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-3xl p-6 md:p-8 max-w-md w-full space-y-5 shadow-2xl relative text-left">
            
            <button 
              onClick={() => setIsAddingNode(false)}
              className="absolute top-4 right-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-full p-2 transition cursor-pointer"
              title="Close form"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[9.5px] uppercase font-mono font-bold tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                New Action Stage Builder
              </span>
              <h3 className="text-base font-extrabold text-[#1d1d1f] dark:text-[#f5f5f7]">
                Add Pipeline Step
              </h3>
              <p className="text-[11px] text-[#86868b]">
                Standardize operations for your {activeEngine === 'growth' ? 'Sourcing Growth Sprints' : 'Value Fulfillment Stream'}.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Node Title */}
              <div className="space-y-1.5">
                <label className="block text-[#1d1d1f] dark:text-[#f5f5f7] font-medium">Step Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Allocation Review"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  className="w-full bg-[#f5f5f7] dark:bg-[#252526]/50 border border-[#e8e8ed] dark:border-[#2d2d2f] text-neutral-900 dark:text-white rounded-xl p-3 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Node Type */}
              <div className="space-y-1.5">
                <label className="block text-[#1d1d1f] dark:text-[#f5f5f7] font-medium">Activity Type</label>
                <select
                  value={newNodeType}
                  onChange={(e) => setNewNodeType(e.target.value as any)}
                  className="w-full bg-[#f5f5f7] dark:bg-[#252526]/50 border border-[#e8e8ed] dark:border-[#2d2d2f] text-neutral-900 dark:text-white rounded-xl p-3 outline-none cursor-pointer transition text-xs"
                >
                  <option value="process">Standard Process Step</option>
                  <option value="decision">Branching Decision Choice</option>
                  <option value="start">Starting Activity Trigger</option>
                  <option value="outcome">Success Milestone Goal</option>
                </select>
              </div>

              {/* Node Description */}
              <div className="space-y-1.5">
                <label className="block text-[#1d1d1f] dark:text-[#f5f5f7] font-medium">Team Instruction & Process Goal</label>
                <textarea
                  placeholder="Describe what our team achieves in this step..."
                  value={newNodeDesc}
                  onChange={(e) => setNewNodeDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#f5f5f7] dark:bg-[#252526]/50 border border-[#e8e8ed] dark:border-[#2d2d2f] text-neutral-900 dark:text-white rounded-xl p-3 outline-none resize-none focus:border-indigo-500"
                />
              </div>

              {/* Power Stage Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#fbfbfd] dark:bg-[#252526]/30 border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-xl">
                <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1 text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-red-500 fill-current" />
                  Is Critical Milestone?
                </span>
                <input
                  type="checkbox"
                  checked={isNewPowerStage}
                  onChange={(e) => setIsNewPowerStage(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-[#f5f5f7] border-[#e8e8ed] rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setIsAddingNode(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold p-3 rounded-xl transition cursor-pointer text-center text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNode}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  Save Step
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
