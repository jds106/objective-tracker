import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { CreateObjectiveBody, TargetDateType, AiReviewResult } from '@objective-tracker/shared';
import { getCurrentQuarterEndDate } from '@objective-tracker/shared';
import { useAuth } from '../contexts/auth.context.js';
import { useCycle } from '../contexts/cycle.context.js';
import { useCascadeTree } from '../hooks/useCascadeTree.js';
import { ObjectiveFormFields } from '../components/objectives/ObjectiveFormFields.js';
import { ParentObjectivePicker } from '../components/objectives/ParentObjectivePicker.js';
import { TargetDatePicker } from '../components/objectives/TargetDatePicker.js';
import { PageTransition } from '../components/PageTransition.js';
import * as objectivesApi from '../services/objectives.api.js';
import * as aiApi from '../services/ai.api.js';

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
  const [aiReview, setAiReview] = useState<AiReviewResult | null>(null);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewError, setAiReviewError] = useState<string | null>(null);

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

  const handleAiReview = async () => {
    if (!title.trim()) return;
    setAiReviewLoading(true);
    setAiReviewError(null);
    setAiReview(null);
    try {
      const { data } = await aiApi.reviewDraft(title.trim(), description.trim() || undefined);
      setAiReview(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get AI review';
      setAiReviewError(msg.includes('503') || msg.includes('not configured')
        ? 'AI features are not enabled on this server.'
        : msg);
    } finally {
      setAiReviewLoading(false);
    }
  };

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

          {/* AI Review */}
          <section>
            <button
              type="button"
              onClick={handleAiReview}
              disabled={aiReviewLoading || !title.trim()}
              className="rounded-lg bg-purple-600/20 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiReviewLoading ? 'Reviewing…' : '✦ Review with AI'}
            </button>

            {aiReviewError && (
              <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {aiReviewError}
                <button onClick={() => setAiReviewError(null)} className="ml-2 underline text-red-300">dismiss</button>
              </div>
            )}

            {aiReviewLoading && (
              <div className="mt-3 rounded-xl bg-purple-500/10 border border-purple-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                  <p className="text-sm text-purple-300">Analysing draft objective with AI…</p>
                </div>
              </div>
            )}

            {aiReview && !aiReviewLoading && (
              <div className="mt-3 rounded-xl bg-purple-500/10 border border-purple-500/30 p-5">
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
                      type="button"
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
