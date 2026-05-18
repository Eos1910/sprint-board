export type TaskStatus = "todo" | "inprogress" | "done";
export type TaskPriority = "Low" | "Medium" | "High";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: string;
  status: TaskStatus;
  startDate?: string;
  dueDate?: string;
  startDateTime?: string;
  endDateTime?: string;
  syncToCalendar?: boolean;
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
};

export type TaskFormData = Omit<Task, "id" | "createdAt" | "updatedAt" | "googleCalendarEventId" | "googleCalendarHtmlLink">;
