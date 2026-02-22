import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { CreateObjectiveBody, TargetDateType } from '@objective-tracker/shared';
import { getCurrentQuarterEndDate } from '@objective-tracker/shared';
import { useAuth } from '../contexts/auth.context.js';
import { useCycle } from '../contexts/cycle.context.js';
import { useCascadeTree } from '../hooks/useCascadeTree.js';
import { ObjectiveFormFields } from '../components/objectives/ObjectiveFormFields.js';
import { ParentObjectivePicker } from '../components/objectives/ParentObjectivePicker.js';
import { TargetDatePicker } from '../components/objectives/TargetDatePicker.js';
import { PageTransition } from '../components/PageTransition.js';
import * as objectivesApi from '../services/objectives.api.js';

export function ObjectiveCreatePage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { activeCycle, isHistorical, selectedCycle } = useCycle();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parentObjectiveId, setParentObjectiveId] = useState<string | null>(null);
  const [parentKeyResultId, setParentKeyResultId] = useState<string | null>(null);
  const [targetDateType, setTargetDateType] = useState<TargetDateType>('quarterly');
  const [targetDate, setTargetDate] = useState(() =>
    activeCycle ? getCurrentQuarterEndDate(activeCycle) : new Date().toISOString().split('T')[0]!,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cascade tree to resolve parent's target date
  const { tree } = useCascadeTree(selectedCycle?.id);
  const parentTargetDate = useMemo(() => {
    if (!parentObjectiveId || tree.length === 0) return null;
    function findInTree(nodes: typeof tree): string | null {
      for (const node of nodes) {
        if (node.objective.id === parentObjectiveId) return node.objective.targetDate ?? null;
        const found = findInTree(node.children);
        if (found) return found;
      }
      return null;
    }
    return findInTree(tree);
  }, [parentObjectiveId, tree]);

  // Guards: no cycle, historical, or admin → redirect
  if (!activeCycle || isHistorical || isAdmin) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const input: CreateObjectiveBody = {
        cycleId: activeCycle.id,
        title: title.trim(),
        description: description.trim(),
        parentObjectiveId,
        parentKeyResultId,
        targetDateType,
        targetDate,
      };
      const { data } = await objectivesApi.createObjective(input);
      navigate(`/objectives/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create objective');
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h2 className="text-2xl font-bold text-slate-100">Create Objective</h2>
        <p className="mt-1 text-sm text-slate-400">
          Define your objective and optionally link it to a parent objective in your reporting chain.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {/* Title + Description */}
          <section>
            <ObjectiveFormFields
              title={title}
              description={description}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
            />
          </section>

          {/* Target Date */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Target Date</h3>
            <TargetDatePicker
              targetDateType={targetDateType}
              targetDate={targetDate}
              onTypeChange={setTargetDateType}
              onDateChange={setTargetDate}
              cycle={activeCycle}
              parentTargetDate={parentTargetDate}
            />
          </section>

          {/* Parent Linking */}
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
              childTargetDate={targetDate}
            />
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Objective'}
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
