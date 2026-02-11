import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type {
  Objective,
  KeyResult,
  CreateKeyResultBody,
  UpdateKeyResultBody,
  CheckInBody,
  UpdateObjectiveBody,
} from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateHealthStatus } from '@objective-tracker/shared';
import { useAuth } from '../contexts/auth.context.js';
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
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import * as objectivesApi from '../services/objectives.api.js';
import * as cascadeApi from '../services/cascade.api.js';

export function ObjectiveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCycle } = useCycle();
  const { objective, isLoading, error, refetch } = useObjective(id!);

  const [cascadePath, setCascadePath] = useState<Objective[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddKR, setShowAddKR] = useState(false);
  const [editingKR, setEditingKR] = useState<KeyResult | null>(null);
  const [checkInKR, setCheckInKR] = useState<KeyResult | null>(null);

  useEffect(() => {
    if (!id) return;
    cascadeApi.getObjectiveCascadePath(id)
      .then(({ data }) => setCascadePath(data))
      .catch(() => {});
  }, [id]);

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
  const health = calculateHealthStatus(progress, activeCycle, allCheckIns);
  const canEdit = objective.ownerId === user?.id;

  const handleEditObjective = async (input: UpdateObjectiveBody) => {
    await objectivesApi.updateObjective(objective.id, input as UpdateObjectiveBody);
    await refetch();
  };

  const handleAddKR = async (input: CreateKeyResultBody | UpdateKeyResultBody) => {
    await objectivesApi.createKeyResult(objective.id, input as CreateKeyResultBody);
    await refetch();
  };

  const handleEditKR = async (input: CreateKeyResultBody | UpdateKeyResultBody) => {
    if (!editingKR) return;
    await objectivesApi.updateKeyResult(editingKR.id, input as UpdateKeyResultBody);
    setEditingKR(null);
    await refetch();
  };

  const handleDeleteKR = async (kr: KeyResult) => {
    if (!confirm(`Delete key result "${kr.title}"?`)) return;
    await objectivesApi.deleteKeyResult(kr.id);
    await refetch();
  };

  const handleCheckIn = async (input: CheckInBody) => {
    if (!checkInKR) return;
    await objectivesApi.recordCheckIn(checkInKR.id, input);
    setCheckInKR(null);
    await refetch();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete objective "${objective.title}"? This cannot be undone.`)) return;
    await objectivesApi.deleteObjective(objective.id);
    navigate('/dashboard');
  };

  return (
    <div>
      {cascadePath.length > 1 && (
        <CascadeBreadcrumb path={cascadePath} className="mb-4" />
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
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Edit
          </button>
          {objective.status === 'draft' && (
            <button
              onClick={handleDelete}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
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
          onDelete={handleDeleteKR}
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

      {activeCycle && (
        <ObjectiveFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditObjective}
          objective={objective}
          cycleId={activeCycle.id}
        />
      )}

      <KeyResultFormModal
        isOpen={showAddKR}
        onClose={() => setShowAddKR(false)}
        onSubmit={handleAddKR}
        objectiveId={objective.id}
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
    </div>
  );
}
