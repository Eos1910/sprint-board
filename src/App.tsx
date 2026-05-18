import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, db, googleProvider } from "./firebase/firebaseConfig";
import type { Task, TaskFormData, TaskStatus } from "./types/task";
import { LayoutIcon, SearchIcon, PlusIcon, AlertCircleIcon, XIcon } from "./components/Icons";
import { BoardColumn } from "./components/BoardColumn";
import { TaskModal } from "./components/TaskModal";
import { DashboardSummary } from "./components/DashboardSummary";
import { ThemeToggle } from "./components/ThemeToggle";
import { createGoogleCalendarEvent } from "./services/googleCalendar";

const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  // Loading states
  const [authLoading, setAuthLoading] = useState(true);
  const [firestoreLoading, setFirestoreLoading] = useState(false);
  
  // Error states
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    setFirestoreLoading(true);
    setFirestoreError(null);

    const tasksRef = collection(db, "users", user.uid, "tasks");
    const q = query(tasksRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<Task, "id">),
        }));

        setTasks(fetchedTasks);
        setFirestoreLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setFirestoreError("Failed to load tasks. Please check your connection or permissions.");
        setFirestoreLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      alert(`Login failed: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout failed:", error);
    }
  };

  const handleDrop = async (taskId: string, targetStatus: TaskStatus) => {
    if (!user) return;
    setActionError(null);

    const task = tasks.find((item) => item.id === taskId);

    if (task && task.status !== targetStatus) {
      // Optimistic UI update
      setTasks((prevTasks) =>
        prevTasks.map((item) =>
          item.id === taskId ? { ...item, status: targetStatus } : item
        )
      );

      try {
        const taskRef = doc(db, "users", user.uid, "tasks", taskId);
        await updateDoc(taskRef, {
          status: targetStatus,
          updatedAt: serverTimestamp(),
        });
      } catch (error: any) {
        console.error("Move failed:", error);
        setActionError("Failed to move task. Please try again.");
        // Revert optimistic update by triggering a re-fetch (handled by onSnapshot usually, but we could manually revert)
      }
    }
  };

  const handleSaveTask = async (taskData: TaskFormData) => {
    if (!user) return;
    setActionError(null);
    setCalendarError(null);

    try {
      if (editingTask) {
        setIsModalOpen(false);
        const taskRef = doc(db, "users", user.uid, "tasks", editingTask.id);

        await updateDoc(taskRef, {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          assignee: taskData.assignee,
          startDate: taskData.startDate,
          dueDate: taskData.dueDate,
          updatedAt: serverTimestamp(),
        });
      } else {
        setIsModalOpen(false);
        const tasksRef = collection(db, "users", user.uid, "tasks");

        const newDocRef = await addDoc(tasksRef, {
          ...taskData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (taskData.syncToCalendar) {
          try {
            const { id, htmlLink } = await createGoogleCalendarEvent(
              taskData.title,
              taskData.description || "",
              taskData.startDateTime || "",
              taskData.endDateTime || ""
            );

            await updateDoc(newDocRef, {
              googleCalendarEventId: id,
              googleCalendarHtmlLink: htmlLink,
              updatedAt: serverTimestamp(),
            });
          } catch (calError: any) {
            setCalendarError(calError.message || "Failed to sync with Google Calendar.");
          }
        }
      }
    } catch (error: any) {
      console.error("Save failed:", error);
      setActionError("Failed to save task. Please try again.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    setActionError(null);

    try {
      const taskRef = doc(db, "users", user.uid, "tasks", taskId);
      await deleteDoc(taskRef);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Delete failed:", error);
      setActionError("Failed to delete task. Please try again.");
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((task) => task.status === status);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin text-blue-600 dark:text-blue-500">
          <LayoutIcon size={32} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center max-w-sm w-full">
          <div className="bg-blue-600 p-3 rounded-xl w-fit mx-auto mb-6 shadow-md shadow-blue-500/20">
            <LayoutIcon className="text-white" size={32} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Sprint Board
          </h1>

          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
            Sign in with Google to manage your sprint tasks securely.
          </p>

          <button
            onClick={handleLogin}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-md">
            <LayoutIcon className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight dark:text-slate-100">Sprint Board</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Project Alpha</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <SearchIcon
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-900 border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 border focus:border-blue-500 dark:focus:border-blue-500 rounded-md text-sm transition-all outline-none w-64 dark:text-slate-100"
            />
          </div>

          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
          >
            <PlusIcon size={16} />
            <span className="hidden sm:inline">Create Issue</span>
          </button>

          <ThemeToggle />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-bold border border-purple-200 dark:border-purple-800">
              {user.displayName
                ? user.displayName.charAt(0).toUpperCase()
                : "U"}
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col h-[calc(100vh-65px)]">
        {/* Error Banners */}
        {firestoreError && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm flex items-center justify-between border border-red-200 dark:border-red-800/50">
            <div className="flex items-center gap-2">
              <AlertCircleIcon size={16} />
              <span>{firestoreError}</span>
            </div>
            <button onClick={() => setFirestoreError(null)}><XIcon size={16} /></button>
          </div>
        )}

        {actionError && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm flex items-center justify-between border border-red-200 dark:border-red-800/50">
            <div className="flex items-center gap-2">
              <AlertCircleIcon size={16} />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)}><XIcon size={16} /></button>
          </div>
        )}

        {calendarError && (
          <div className="mb-4 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 p-3 rounded-md text-sm flex items-center justify-between border border-orange-200 dark:border-orange-800/50">
            <div className="flex items-center gap-2">
              <AlertCircleIcon size={16} />
              <span>{calendarError} - The task was saved, but calendar sync failed.</span>
            </div>
            <button onClick={() => setCalendarError(null)}><XIcon size={16} /></button>
          </div>
        )}

        <DashboardSummary tasks={tasks} />

        {firestoreLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin text-blue-600 dark:text-blue-500">
              <LayoutIcon size={32} />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="h-full flex items-start min-w-max">
              <BoardColumn
                status="todo"
                tasks={getTasksByStatus("todo")}
                count={getTasksByStatus("todo").length}
                onDrop={handleDrop}
                onEdit={openEditModal}
              />

              <BoardColumn
                status="inprogress"
                tasks={getTasksByStatus("inprogress")}
                count={getTasksByStatus("inprogress").length}
                onDrop={handleDrop}
                onEdit={openEditModal}
              />

              <BoardColumn
                status="done"
                tasks={getTasksByStatus("done")}
                count={getTasksByStatus("done").length}
                onDrop={handleDrop}
                onEdit={openEditModal}
              />
            </div>
          </div>
        )}
      </main>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialData={editingTask}
      />
    </div>
  );
};

export default App;