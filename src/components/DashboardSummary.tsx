import type { Task } from "../types/task";

export const DashboardSummary = ({ tasks }: { tasks: Task[] }) => {
  const total = tasks.length;
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "inprogress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const overdueCount = tasks.filter((t) => {
    if (t.status === "done" || !t.dueDate) return false;
    const due = new Date(t.dueDate).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  return (
    <div className="mb-6 flex flex-wrap gap-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-1 min-w-[120px]">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Total</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{total}</p>
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-1 min-w-[120px]">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">To Do</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{todoCount}</p>
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-1 min-w-[120px]">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">In Progress</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{inProgressCount}</p>
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-1 min-w-[120px]">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Done</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{doneCount}</p>
      </div>
      <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border flex-1 min-w-[120px] ${overdueCount > 0 ? "border-red-300 dark:border-red-800" : "border-slate-200 dark:border-slate-700"}`}>
        <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${overdueCount > 0 ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>Overdue</p>
        <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}`}>{overdueCount}</p>
      </div>
    </div>
  );
};
