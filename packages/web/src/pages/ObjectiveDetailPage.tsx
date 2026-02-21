import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type {
  Objective,
  KeyResult,
  CreateKeyResultBody,
  UpdateKeyResultBody,
  CheckInBody,
  UpdateObjectiveBody,
  AiReviewResult,
} from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateHealthStatus } from '@objective-tracker/shared';
import { useCycle } from '../contexts/cycle.context.js';
import { useObjective } from '../hooks/useObjective.js';
import { CascadeBreadcrumb } from '../components/CascadeBreadcrumb.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { HealthBadge } from '../components/HealthBadge.js';
import { ProgressRing } from '../components/ProgressRing.js';
import { KeyResultList } from '../components/key-results/KeyResultList.js';
import { KeyResultFormModal } from '../components/key-results/KeyResultFormModal.js';
import { CheckInModal } from '../components/check-ins/CheckInModal.js';
import { CheckInTimeline } from '../components/check-ins/CheckInTimeline.js';
import { ObjectiveFormModal } from '../components/objectives/ObjectiveFormModal.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { Modal } from '../components/Modal.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { PageTransition } from '../components/PageTransition.js';
import { Confetti, useCelebration } from '../components/Confetti.js';
import * as objectivesApi from '../services/objectives.api.js';
import * as cascadeApi from '../services/cascade.api.js';
import * as aiApi from '../services/ai.api.js';

export function ObjectiveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeCycle, selectedCycle, allCycles } = useCycle();
  const { objective, canEdit, isLoading, error, refetch } = useObjective(id ?? '');

  const [celebrating, triggerCelebration] = useCelebration();
  const [cascadePath, setCascadePath] = useState<Objective[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddKR, setShowAddKR] = useState(false);
  const [editingKR, setEditingKR] = useState<KeyResult | null>(null);
  const [checkInKR, setCheckInKR] = useState<KeyResult | null>(null);
  const [confirmDeleteObj, setConfirmDeleteObj] = useState(false);
  const [confirmDeleteForce, setConfirmDeleteForce] = useState(false);
  const [linkedChildrenWarning, setLinkedChildrenWarning] = useState<Array<{ id: string; title: string }>>([]);
  const [confirmDeleteKR, setConfirmDeleteKR] = useState<KeyResult | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showRollforward, setShowRollforward] = useState(false);
  const [rollforwardCycleId, setRollforwardCycleId] = useState('');
  const [rollforwardLoading, setRollforwardLoading] = useState(false);
  const [rollforwardError, setRollforwardError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [aiReview, setAiReview] = useState<AiReviewResult | null>(null);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewError, setAiReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    cascadeApi.getObjectiveCascadePath(id)
      .then(({ data }) => setCascadePath(data))
      .catch(() => {});
  }, [id]);

  if (!id) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !objective) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400">{error || 'Objective not found'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const progress = calculateObjectiveProgress(objective.keyResults.map(kr => kr.progress));
  const allCheckIns = objective.keyResults.flatMap(kr => kr.checkIns);
  const health = calculateHealthStatus(progress, selectedCycle, allCheckIns);

  const handleEditObjective = async (input: UpdateObjectiveBody) => {
    setActionError(null);
    try {
      await objectivesApi.updateObjective(objective.id, input as UpdateObjectiveBody);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update objective');
      throw err; // Re-throw so the form modal can show its own error state
    }
  };

  const handleAddKR = async (input: CreateKeyResultBody | UpdateKeyResultBody) => {
    setActionError(null);
    try {
      await objectivesApi.createKeyResult(objective.id, input as CreateKeyResultBody);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add key result');
      throw err;
    }
  };

  const handleEditKR = async (input: CreateKeyResultBody | UpdateKeyResultBody) => {
    if (!editingKR) return;
    setActionError(null);
    try {
      await objectivesApi.updateKeyResult(editingKR.id, input as UpdateKeyResultBody);
      setEditingKR(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update key result');
      throw err;
    }
  };

  const handleDeleteKR = async () => {
    if (!confirmDeleteKR) return;
    setDeleteLoading(true);
    setActionError(null);
    try {
      await objectivesApi.deleteKeyResult(confirmDeleteKR.id);
      setConfirmDeleteKR(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete key result');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCheckIn = async (input: CheckInBody) => {
    if (!checkInKR) return;
    setActionError(null);
    try {
      const { data: checkIn } = await objectivesApi.recordCheckIn(checkInKR.id, input);
      setCheckInKR(null);
      await refetch();
      // Celebrate if this KR reached 100%
      if (checkIn.newProgress >= 100) {
        triggerCelebration();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to record check-in');
      throw err;
    }
  };

  const handleDeleteObjective = async (force = false) => {
    setDeleteLoading(true);
    setActionError(null);
    try {
      await objectivesApi.deleteObjective(objective.id, force);
      navigate('/dashboard');
    } catch (err) {
      // Check if this is a linked-children 409 error
      const errMsg = err instanceof Error ? err.message : 'Failed to delete objective';
      if (errMsg.includes('linked child')) {
        setConfirmDeleteObj(false);
        // Extract linked children from ApiError details
        const apiErr = err as Error & { details?: { linkedChildren?: Array<{ id: string; title: string }> } };
        setLinkedChildrenWarning(apiErr.details?.linkedChildren ?? []);
        setConfirmDeleteForce(true);
      } else {
        setActionError(errMsg);
      }
    } finally {
      setDeleteLoading(false);
      if (!confirmDeleteForce) {
        setConfirmDeleteObj(false);
      }
    }
  };

  const handleAiReview = async () => {
    setAiReviewLoading(true);
    setAiReviewError(null);
    setAiReview(null);
    try {
      const { data } = await aiApi.reviewObjective(objective.id);
      setAiReview(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get AI review';
      setAiReviewError(msg.includes('503') || msg.includes('not configured')
        ? 'AI features are not enabled. Ask your admin to configure the ANTHROPIC_API_KEY.'
        : msg);
    } finally {
      setAiReviewLoading(false);
    }
  };

  // Target cycles for rollforward: non-closed cycles other than the current one
  const rollforwardTargetCycles = allCycles.filter(
    c => c.id !== objective.cycleId && c.status !== 'closed',
  );

  const handleRollforward = async () => {
    if (!rollforwardCycleId) return;
    setRollforwardLoading(true);
    setRollforwardError(null);
    try {
      const { data: newObjective } = await objectivesApi.rollforwardObjective(objective.id, rollforwardCycleId);
      setShowRollforward(false);
      navigate(`/objectives/${newObjective.id}`);
    } catch (err) {
      setRollforwardError(err instanceof Error ? err.message : 'Failed to roll forward objective');
    } finally {
      setRollforwardLoading(false);
    }
  };

  return (
    <PageTransition>
      <Confetti active={celebrating} />

      {/* Back navigation + cascade breadcrumb */}
      <div className="mb-4 flex items-center gap-3 text-sm">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <span className="text-slate-600">|</span>
        <Link to="/dashboard" className="text-slate-400 hover:text-slate-200 transition-colors">
          Dashboard
        </Link>
        <span className="text-slate-600">&rsaquo;</span>
        <span className="text-slate-300 truncate">{objective.title}</span>
      </div>

      {cascadePath.length > 1 && (
        <CascadeBreadcrumb path={cascadePath} className="mb-4" />
      )}

      {actionError && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 flex items-center justify-between">
          <p className="text-sm text-red-400">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-red-300 text-xs ml-4 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-slate-100">{objective.title}</h2>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <StatusBadge status={objective.status} />
            <HealthBadge status={health} />
          </div>
          {objective.description && (
            <p className="mt-3 text-sm text-slate-400">{objective.description}</p>
          )}
        </div>
        <ProgressRing progress={progress} size={64} strokeWidth={5} />
      </div>

      {canEdit && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleAiReview}
            disabled={aiReviewLoading}
            className="rounded-lg bg-purple-600/20 px-3 py-1.5 text-sm font-medium text-purple-400 hover:bg-purple-600/30 transition-colors disabled:opacity-50"
          >
            {aiReviewLoading ? 'Reviewing…' : '✦ AI Review'}
          </button>
          {objective.status === 'active' && rollforwardTargetCycles.length > 0 && (
            <button
              onClick={() => {
                setRollforwardCycleId(rollforwardTargetCycles[0].id);
                setRollforwardError(null);
                setShowRollforward(true);
              }}
              className="rounded-lg bg-amber-600/20 px-3 py-1.5 text-sm font-medium text-amber-400 hover:bg-amber-600/30 transition-colors"
            >
              Roll Forward
            </button>
          )}
          {objective.status === 'draft' && (
            <button
              onClick={() => setConfirmDeleteObj(true)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* AI Review Results */}
      {aiReviewError && (
        <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {aiReviewError}
          <button onClick={() => setAiReviewError(null)} className="ml-2 underline text-red-300">dismiss</button>
        </div>
      )}

      {aiReviewLoading && (
        <div className="mt-4 rounded-xl bg-purple-500/10 border border-purple-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
            <p className="text-sm text-purple-300">Analysing objective quality with AI…</p>
          </div>
        </div>
      )}

      {aiReview && !aiReviewLoading && (
        <div className="mt-4 rounded-xl bg-purple-500/10 border border-purple-500/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-purple-300">✦ AI Quality Review</h3>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${
                aiReview.score >= 8 ? 'text-emerald-400' :
                aiReview.score >= 5 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {aiReview.score}/10
              </span>
              <button
                onClick={() => setAiReview(null)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                dismiss
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-3">{aiReview.summary}</p>

          {aiReview.strengths.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-emerald-400 mb-1">Strengths</p>
              <ul className="space-y-1">
                {aiReview.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiReview.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-400 mb-1">Suggestions</p>
              <ul className="space-y-2">
                {aiReview.suggestions.map((s, i) => (
                  <li key={i} className="text-xs">
                    <span className="inline-block rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 mr-1.5">
                      {s.category}
                    </span>
                    <span className="text-slate-300">{s.message}</span>
                    {s.rewrite && (
                      <p className="mt-1 ml-4 text-purple-300 italic">&ldquo;{s.rewrite}&rdquo;</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Key Results</h3>
          {canEdit && (
            <button
              onClick={() => setShowAddKR(true)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Add Key Result
            </button>
          )}
        </div>
        <KeyResultList
          keyResults={objective.keyResults}
          canEdit={canEdit}
          onCheckIn={kr => setCheckInKR(kr)}
          onEdit={kr => setEditingKR(kr)}
          onDelete={kr => setConfirmDeleteKR(kr)}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Check-in History</h3>
        <div className="rounded-xl bg-surface-raised border border-slate-700 p-6">
          <CheckInTimeline
            checkIns={allCheckIns.sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            )}
          />
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}

      <ObjectiveFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditObjective}
        objective={objective}
        cycleId={activeCycle?.id ?? objective.cycleId}
      />

      <KeyResultFormModal
        isOpen={showAddKR}
        onClose={() => setShowAddKR(false)}
        onSubmit={handleAddKR}
      />

      {editingKR && (
        <KeyResultFormModal
          isOpen={!!editingKR}
          onClose={() => setEditingKR(null)}
          onSubmit={handleEditKR}
          keyResult={editingKR}
        />
      )}

      {checkInKR && (
        <CheckInModal
          isOpen={!!checkInKR}
          onClose={() => setCheckInKR(null)}
          onSubmit={handleCheckIn}
          keyResult={checkInKR}
        />
      )}

      {/* Confirm delete objective */}
      <ConfirmModal
        isOpen={confirmDeleteObj}
        onClose={() => setConfirmDeleteObj(false)}
        onConfirm={() => handleDeleteObjective(false)}
        title="Delete Objective"
        message={`Delete "${objective.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteLoading}
      />

      {/* Force delete — linked children warning */}
      <Modal
        isOpen={confirmDeleteForce}
        onClose={() => { setConfirmDeleteForce(false); setLinkedChildrenWarning([]); }}
        title="Linked Objectives Found"
      >
        <div className="space-y-4">
          <p className="text-sm text-amber-300">
            This objective has {linkedChildrenWarning.length} linked child objective{linkedChildrenWarning.length !== 1 ? 's' : ''} that cascade from it.
            Deleting will unlink them.
          </p>
          {linkedChildrenWarning.length > 0 && (
            <ul className="space-y-1 rounded-lg bg-surface p-3">
              {linkedChildrenWarning.map(child => (
                <li key={child.id} className="text-xs text-slate-300">
                  &bull; {child.title}
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setConfirmDeleteForce(false); setLinkedChildrenWarning([]); }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmDeleteForce(false);
                handleDeleteObjective(true);
              }}
              disabled={deleteLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {deleteLoading ? 'Deleting…' : 'Delete and Unlink'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete key result */}
      <ConfirmModal
        isOpen={!!confirmDeleteKR}
        onClose={() => setConfirmDeleteKR(null)}
        onConfirm={handleDeleteKR}
        title="Delete Key Result"
        message={confirmDeleteKR ? `Delete key result "${confirmDeleteKR.title}"?` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteLoading}
      />

      {/* Roll forward modal */}
      <Modal
        isOpen={showRollforward}
        onClose={() => setShowRollforward(false)}
        title="Roll Forward Objective"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            This will create a copy of <strong className="text-slate-200">&ldquo;{objective.title}&rdquo;</strong> in the
            selected cycle with all key results reset to zero progress. The original will be marked as rolled forward.
          </p>

          <div>
            <label htmlFor="rollforward-cycle" className="block text-sm font-medium text-slate-300 mb-1">
              Target Cycle
            </label>
            <select
              id="rollforward-cycle"
              value={rollforwardCycleId}
              onChange={e => setRollforwardCycleId(e.target.value)}
              className="w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {rollforwardTargetCycles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {rollforwardError && (
            <p className="text-sm text-red-400">{rollforwardError}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowRollforward(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRollforward}
              disabled={rollforwardLoading || !rollforwardCycleId}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {rollforwardLoading ? 'Rolling forward…' : 'Roll Forward'}
            </button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
