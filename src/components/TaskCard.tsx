import type { Task } from "../types/task";
import { EditIcon, CalendarIcon } from "./Icons";
import { PriorityBadge } from "./PriorityBadge";

export const TaskCard = ({
  task,
  onEdit,
}: {
  task: Task;
  onEdit: (task: Task) => void;
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) &&
    task.status !== "done";

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group bg-white dark:bg-slate-800 p-3 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md dark:hover:border-slate-600 transition-all mb-3 relative"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight mr-6">
          {task.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Edit task"
        >
          <EditIcon size={14} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center mt-3">
        <PriorityBadge priority={task.priority} />
        
        {task.dueDate && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
            isOverdue 
              ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50" 
              : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          }`}>
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}

        {task.googleCalendarHtmlLink && (
          <a
            href={task.googleCalendarHtmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title="View in Google Calendar"
            onClick={(e) => e.stopPropagation()}
          >
            <CalendarIcon size={14} />
          </a>
        )}

        <div className="ml-auto flex items-center gap-2">
          {task.assignee && (
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-200 dark:border-blue-800" title={task.assignee}>
              {task.assignee.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono" title="Task ID">
            {task.id.slice(0, 4).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};
