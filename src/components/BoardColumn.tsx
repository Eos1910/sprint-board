import type { Task, TaskStatus } from "../types/task";
import { CircleIcon, ClockIcon, CheckCircleIcon } from "./Icons";
import { TaskCard } from "./TaskCard";

export const BoardColumn = ({
  status,
  tasks,
  onDrop,
  onEdit,
  count,
}: {
  status: TaskStatus;
  tasks: Task[];
  onDrop: (taskId: string, targetStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  count: number;
}) => {
  const iconMap: Record<TaskStatus, React.ReactNode> = {
    todo: <CircleIcon size={16} className="text-slate-500 dark:text-slate-400" />,
    inprogress: <ClockIcon size={16} className="text-blue-500 dark:text-blue-400" />,
    done: <CheckCircleIcon size={16} className="text-green-500 dark:text-green-400" />,
  };

  const titleMap: Record<TaskStatus, string> = {
    todo: "To Do",
    inprogress: "In Progress",
    done: "Done",
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropEvent = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");

    if (taskId) {
      onDrop(taskId, status);
    }
  };

  return (
    <div
      className="flex flex-col h-full w-80 shrink-0 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg border border-slate-200/60 dark:border-slate-700/60 ml-4 first:ml-0"
      onDragOver={handleDragOver}
      onDrop={handleDropEvent}
    >
      <div className="p-3 flex items-center justify-between sticky top-0 bg-slate-100/50 dark:bg-slate-800/30 backdrop-blur-sm z-10 rounded-t-lg">
        <div className="flex items-center gap-2">
          {iconMap[status]}
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
            {titleMap[status]}
          </h3>
          <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {count}
          </span>
        </div>
      </div>

      <div className="flex-1 p-2 overflow-y-auto min-h-[150px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}

        {tasks.length === 0 && (
          <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs italic">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
};
