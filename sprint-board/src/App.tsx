import React, { useState, useEffect } from 'react';
// Remove ReactDOM import, we don't need it if we export default App
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";

// --- Firebase Configuration & Initialization ---
import { auth, db } from "./firebase/firebaseConfig";
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Icons (Inline SVGs to remove external dependencies) ---
const IconWrapper = ({ children, size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

const LayoutIcon = (props) => (
  <IconWrapper {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </IconWrapper>
);

const SearchIcon = (props) => (
  <IconWrapper {...props}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </IconWrapper>
);

const PlusIcon = (props) => (
  <IconWrapper {...props}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </IconWrapper>
);

const XIcon = (props) => (
  <IconWrapper {...props}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </IconWrapper>
);

const TrashIcon = (props) => (
  <IconWrapper {...props}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </IconWrapper>
);

const EditIcon = (props) => (
  <IconWrapper {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </IconWrapper>
);

const ClockIcon = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </IconWrapper>
);

const CheckCircleIcon = (props) => (
  <IconWrapper {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </IconWrapper>
);

const CircleIcon = (props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10"></circle>
  </IconWrapper>
);

// --- Components ---

// 1. Priority Badge
const PriorityBadge = ({ priority }) => {
  const styles = {
    High: "bg-red-100 text-red-700 border-red-200",
    Medium: "bg-orange-100 text-orange-700 border-orange-200",
    Low: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
};

// 2. Task Card
const TaskCard = ({ task, onEdit }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group bg-white p-3 rounded-md shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all mb-3 relative"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold text-slate-800 leading-tight mr-6">
          {task.title}
        </h4>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="text-slate-400 hover:text-blue-600 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <EditIcon size={14} />
        </button>
      </div>

      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.assignee && (
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold border border-blue-200">
              {task.assignee.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          {task.id.slice(0, 4).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

// 3. Column
const Column = ({ title, status, tasks, onDrop, onEdit, count }) => {
  const iconMap = {
    'todo': <CircleIcon size={16} className="text-slate-500" />,
    'inprogress': <ClockIcon size={16} className="text-blue-500" />,
    'done': <CheckCircleIcon size={16} className="text-green-500" />
  };

  const titleMap = {
    'todo': 'To Do',
    'inprogress': 'In Progress',
    'done': 'Done'
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropEvent = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onDrop(taskId, status);
    }
  };

  return (
    <div
      className="flex flex-col h-full w-80 shrink-0 bg-slate-100/50 rounded-lg border border-slate-200/60 ml-4 first:ml-0"
      onDragOver={handleDragOver}
      onDrop={handleDropEvent}
    >
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between sticky top-0 bg-slate-100/50 backdrop-blur-sm z-10 rounded-t-lg">
        <div className="flex items-center gap-2">
          {iconMap[status]}
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            {titleMap[status]}
          </h3>
          <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {count}
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
          />
        ))}
        {tasks.length === 0 && (
          <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs italic">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
};

// 4. Edit/Create Modal
const TaskModal = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assignee: '',
    status: 'todo'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        assignee: '',
        status: 'todo'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">
            {initialData ? 'Edit Issue' : 'Create Issue'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Summary
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm h-24 resize-none"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Assignee (Initials)
            </label>
            <input
              type="text"
              maxLength={2}
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
              placeholder="e.g. JD"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between">
          {initialData ? (
            <button
              onClick={() => { onDelete(initialData.id); onClose(); }}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
            >
              <TrashIcon size={16} />
              Delete
            </button>
          ) : <div></div>}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(formData); onClose(); }}
              disabled={!formData.title.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initialData ? 'Save Changes' : 'Create Issue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // 1. Authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching
  useEffect(() => {
    if (!user) return;

    // We store tasks in a user-specific collection
    const tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const q = query(tasksRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(fetchedTasks);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Handlers

  const handleDrop = async (taskId, targetStatus) => {
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== targetStatus) {
      // Optimistic update locally for smoother feel
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, status: targetStatus } : t
      );
      setTasks(updatedTasks);

      // Update Firestore
      try {
        const taskRef = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId);
        await updateDoc(taskRef, { status: targetStatus });
      } catch (error) {
        console.error("Move failed:", error);
        // Force refresh from server state on error
      }
    }
  };

  const handleSaveTask = async (taskData) => {
    if (!user) return;

    try {
      if (editingTask) {
        // Update existing
        const taskRef = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', editingTask.id);
        await updateDoc(taskRef, {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          assignee: taskData.assignee
        });
      } else {
        // Create new
        const tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
        await addDoc(tasksRef, {
          ...taskData,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (!user) return;
    try {
      const taskRef = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Delete failed", error);
    }
  }

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // 4. Filtering
  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.assignee && t.assignee.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTasksByStatus = (status) => filteredTasks.filter(t => t.status === status);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin text-blue-600">
          <LayoutIcon size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-md">
            <LayoutIcon className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Sprint Board</h1>
            <p className="text-xs text-slate-500">Project Alpha</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-md text-sm transition-all outline-none w-64"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
          >
            <PlusIcon size={16} />
            Create Issue
          </button>
          <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold border border-purple-200">
            {user ? 'ME' : '?'}
          </div>
        </div>
      </header>

      {/* Board Canvas */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full p-6 flex items-start min-w-max">
          <Column
            title="To Do"
            status="todo"
            tasks={getTasksByStatus('todo')}
            count={getTasksByStatus('todo').length}
            onDrop={handleDrop}
            onEdit={openEditModal}
          />
          <Column
            title="In Progress"
            status="inprogress"
            tasks={getTasksByStatus('inprogress')}
            count={getTasksByStatus('inprogress').length}
            onDrop={handleDrop}
            onEdit={openEditModal}
          />
          <Column
            title="Done"
            status="done"
            tasks={getTasksByStatus('done')}
            count={getTasksByStatus('done').length}
            onDrop={handleDrop}
            onEdit={openEditModal}
          />
        </div>
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