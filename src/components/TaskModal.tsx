import { useState, useEffect } from "react";
import type { Task, TaskFormData, TaskPriority, TaskStatus } from "../types/task";
import { XIcon, TrashIcon, AlertCircleIcon } from "./Icons";

export const TaskModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: TaskFormData) => Promise<void> | void;
  onDelete: (taskId: string) => Promise<void> | void;
  initialData: Task | null;
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "Medium",
    assignee: "",
    status: "todo",
    startDate: "",
    dueDate: "",
    startDateTime: "",
    endDateTime: "",
    syncToCalendar: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || "",
        priority: initialData.priority,
        assignee: initialData.assignee || "",
        status: initialData.status,
        startDate: initialData.startDate || "",
        dueDate: initialData.dueDate || "",
        startDateTime: initialData.startDateTime || "",
        endDateTime: initialData.endDateTime || "",
        syncToCalendar: initialData.syncToCalendar || false,
      });
      // Extract time if exists, though edit sync is disabled in MVP
      if (initialData.startDateTime) {
        const d = new Date(initialData.startDateTime);
        setStartTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      }
      if (initialData.endDateTime) {
        const d = new Date(initialData.endDateTime);
        setEndTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      }
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        assignee: "",
        status: "todo",
        startDate: "",
        dueDate: "",
        startDateTime: "",
        endDateTime: "",
        syncToCalendar: false,
      });
      setStartTime("09:00");
      setEndTime("10:00");
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    if (!formData.title.trim()) {
      setError("Title is required.");
      return false;
    }
    if (formData.syncToCalendar) {
      if (!formData.startDate || !formData.dueDate) {
        setError("Start Date and Due Date are required for Google Calendar sync.");
        return false;
      }
      const start = new Date(`${formData.startDate}T${startTime}`);
      const end = new Date(`${formData.dueDate}T${endTime}`);
      if (end < start) {
        setError("End date/time cannot be earlier than start date/time.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (validate()) {
      setIsSubmitting(true);
      try {
        let finalData = { ...formData };
        if (formData.syncToCalendar && formData.startDate && formData.dueDate) {
           const start = new Date(`${formData.startDate}T${startTime}`);
           const end = new Date(`${formData.dueDate}T${endTime}`);
           finalData.startDateTime = start.toISOString();
           finalData.endDateTime = end.toISOString();
        }
        await onSave(finalData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDelete = async () => {
    if (initialData) {
      setIsSubmitting(true);
      try {
        await onDelete(initialData.id);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {initialData ? "Edit Issue" : "Create Issue"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm flex items-start gap-2 border border-red-200 dark:border-red-800/50">
              <AlertCircleIcon size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Summary *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all text-sm font-medium"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all text-sm h-20 resize-none"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as TaskPriority,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as TaskStatus,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Assignee Initials
              </label>
              <input
                type="text"
                maxLength={2}
                value={formData.assignee}
                onChange={(e) =>
                  setFormData({ ...formData, assignee: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all text-sm"
                placeholder="e.g. CY"
              />
            </div>

          {/* Schedule & Calendar Integration */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="syncToCalendar"
                checked={formData.syncToCalendar}
                onChange={(e) =>
                  setFormData({ ...formData, syncToCalendar: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                disabled={!!initialData} // Disabling sync for edit mode as MVP constraint
              />
              <label
                htmlFor="syncToCalendar"
                className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none"
              >
                Add to Google Calendar {initialData ? "(Creation only)" : ""}
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200">
              {formData.syncToCalendar && (
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent focus:border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium cursor-pointer"
                />
              )}

              {formData.syncToCalendar && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-3 py-2 w-[110px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent focus:border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium cursor-pointer text-center"
                />
              )}
              
              {formData.syncToCalendar && (
                <span className="text-sm font-medium text-slate-500 px-1">to</span>
              )}

              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent focus:border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium cursor-pointer"
              />

              {formData.syncToCalendar && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="px-3 py-2 w-[110px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent focus:border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium cursor-pointer text-center"
                />
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-between shrink-0">
          {initialData ? (
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 rounded-md text-sm font-medium transition-colors"
            >
              <TrashIcon size={16} />
              Delete
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                initialData ? "Save Changes" : "Create Issue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
