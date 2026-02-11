import { useState } from 'react';
import type { Objective, CreateObjectiveBody, UpdateObjectiveBody } from '@objective-tracker/shared';
import { Modal } from '../Modal.js';
import { ObjectiveForm } from './ObjectiveForm.js';

interface ObjectiveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateObjectiveBody | UpdateObjectiveBody) => Promise<void>;
  objective?: Objective;
  cycleId: string;
}

export function ObjectiveFormModal({
  isOpen,
  onClose,
  onSubmit,
  objective,
  cycleId,
}: ObjectiveFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!objective;

  const handleSubmit = async (data: { title: string; description: string; parentObjectiveId: string | null; parentKeyResultId: string | null }) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (isEdit) {
        await onSubmit({
          title: data.title,
          description: data.description,
          parentObjectiveId: data.parentObjectiveId,
          parentKeyResultId: data.parentKeyResultId,
        } as UpdateObjectiveBody);
      } else {
        await onSubmit({
          cycleId,
          title: data.title,
          description: data.description,
          parentObjectiveId: data.parentObjectiveId,
          parentKeyResultId: data.parentKeyResultId,
        } as CreateObjectiveBody);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save objective');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Objective' : 'Create Objective'}
      maxWidth="max-w-xl"
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <ObjectiveForm
        initialData={objective ? {
          title: objective.title,
          description: objective.description,
          parentObjectiveId: objective.parentObjectiveId,
          parentKeyResultId: objective.parentKeyResultId,
        } : undefined}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel={isEdit ? 'Save Changes' : 'Create Objective'}
      />
    </Modal>
  );
}
