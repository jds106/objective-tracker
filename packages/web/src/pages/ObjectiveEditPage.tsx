import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type {
  KeyResult,
  CreateKeyResultBody,
  UpdateKeyResultBody,
  CheckInBody,
  UpdateObjectiveBody,
  TargetDateType,
} from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateHealthStatus } from '@objective-tracker/shared';
import { useAuth } from '../contexts/auth.context.js';
import { useCycle } from '../contexts/cycle.context.js';
import { useObjective } from '../hooks/useObjective.js';
import { ObjectiveFormFields } from '../components/objectives/ObjectiveFormFields.js';
import { ParentObjectivePicker } from '../components/objectives/ParentObjectivePicker.js';
import { TargetDatePicker } from '../components/objectives/TargetDatePicker.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { HealthBadge } from '../components/HealthBadge.js';
import { ProgressRing } from '../components/ProgressRing.js';
import { KeyResultList } from '../components/key-results/KeyResultList.js';
import { KeyResultFormModal } from '../components/key-results/KeyResultFormModal.js';
import { CheckInModal } from '../components/check-ins/CheckInModal.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { PageTransition } from '../components/PageTransition.js';
import { Confetti, useCelebration } from '../components/Confetti.js';
import * as objectivesApi from '../services/objectives.api.js';

export function ObjectiveEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { selectedCycle } = useCycle();
  const { objective, canEdit, isLoading, error, refetch } = useObjective(id ?? '');

  const [celebrating, triggerCelebration] = useCelebration();

  // Form state — initialised from objective once loaded
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parentObjectiveId, setParentObjectiveId] = useState<string | null>(null);
  const [parentKeyResultId, setParentKeyResultId] = useState<string | null>(null);
  const [targetDateType, setTargetDateType] = useState<TargetDateType>('quarterly');
  const [targetDate, setTargetDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // KR modal state
  const [showAddKR, setShowAddKR] = useState(false);
  const [editingKR, setEditingKR] = useState<KeyResult | null>(null);
  const [checkInKR, setCheckInKR] = useState<KeyResult | null>(null);
  const [confirmDeleteKR, setConfirmDeleteKR] = useState<KeyResult | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Initialise form fields when objective loads
  useEffect(() => {
    if (objective) {
      setTitle(objective.title);
      setDescription(objective.description);
      setParentObjectiveId(objective.parentObjectiveId);
      setParentKeyResultId(objective.parentKeyResultId);
      setTargetDateType(objective.targetDateType ?? 'quarterly');
      setTargetDate(objective.targetDate ?? '');
    }
  }, [objective]);

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

  // Guard: only draft objectives can be edited (unless admin)
  if (!canEdit || (objective.status !== 'draft' && !isAdmin)) {
    navigate(`/objectives/${id}`, { replace: true });
    return null;
  }

  const progress = calculateObjectiveProgress(objective.keyResults.map(kr => kr.progress));
  const allCheckIns = objective.keyResults.flatMap(kr => kr.checkIns);
  const health = calculateHealthStatus(progress, selectedCycle, allCheckIns, {
    targetDate: objective.targetDate,
    objectiveStatus: objective.status,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const input: UpdateObjectiveBody = {
        title: title.trim(),
        description: description.trim(),
        parentObjectiveId,
        parentKeyResultId,
        targetDateType,
        targetDate,
      };
      await objectivesApi.updateObjective(objective.id, input);
      await refetch();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save objective');
    } finally {
      setIsSaving(false);
    }
  };

  // KR handlers
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
      if (checkIn.newProgress >= 100) {
        triggerCelebration();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to record check-in');
      throw err;
    }
  };

  return (
    <PageTransition>
      <Confetti active={celebrating} />

      {/* Back link + header */}
      <div className="mb-4">
        <Link
          to={`/objectives/${id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to objective
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={objective.status} />
          <HealthBadge status={health} />
        </div>
        <ProgressRing progress={progress} size={48} strokeWidth={4} />
      </div>

      {/* Error banners */}
      {(saveError || actionError) && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 flex items-center justify-between">
          <p className="text-sm text-red-400">{saveError || actionError}</p>
          <button
            onClick={() => { setSaveError(null); setActionError(null); }}
            className="text-red-400 hover:text-red-300 text-xs ml-4 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-sm text-emerald-400">Changes saved successfully.</p>
        </div>
      )}

      {/* Two-column layout on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column: Objective details + parent linking */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Objective Details</h3>
              <ObjectiveFormFields
                title={title}
                description={description}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
              />
            </section>

            {selectedCycle && (
              <section>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Target Date</h3>
                <TargetDatePicker
                  targetDateType={targetDateType}
                  targetDate={targetDate}
                  onTypeChange={setTargetDateType}
                  onDateChange={setTargetDate}
                  cycle={selectedCycle}
                />
              </section>
            )}

            <section>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Link to Parent Objective
                <span className="ml-2 text-xs font-normal text-slate-500">(optional)</span>
              </h3>
              <ParentObjectivePicker
                parentObjectiveId={parentObjectiveId}
                parentKeyResultId={parentKeyResultId}
                onChange={(objId, krId) => {
                  setParentObjectiveId(objId);
                  setParentKeyResultId(krId);
                }}
                excludeObjectiveId={objective.id}
                childTargetDate={targetDate}
              />
            </section>

            <div className="pt-4 border-t border-slate-700">
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Key Results */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-100">Key Results</h3>
            <button
              onClick={() => setShowAddKR(true)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Add Key Result
            </button>
          </div>
          <KeyResultList
            keyResults={objective.keyResults}
            canEdit={canEdit}
            onCheckIn={kr => setCheckInKR(kr)}
            onEdit={kr => setEditingKR(kr)}
            onDelete={kr => setConfirmDeleteKR(kr)}
          />
        </div>
      </div>

      {/* ── KR Modals ──────────────────────────────────── */}

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
    </PageTransition>
  );
}
