import type { TaskPriority } from "../types/task";

export const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
  const styles: Record<TaskPriority, string> = {
    High: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    Medium: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    Low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border font-medium ${styles[priority]}`}
    >
      {priority}
    </span>
  );
};
