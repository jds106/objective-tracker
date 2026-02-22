interface ObjectiveFormFieldsProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function ObjectiveFormFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: ObjectiveFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="obj-title" className="block text-sm font-medium text-slate-300">
          Title
        </label>
        <input
          id="obj-title"
          type="text"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="e.g. Improve platform reliability to 99.9% uptime"
        />
      </div>

      <div>
        <label htmlFor="obj-description" className="block text-sm font-medium text-slate-300">
          Description
        </label>
        <textarea
          id="obj-description"
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Describe what this objective aims to achieve and why it matters..."
        />
      </div>
    </div>
  );
}
