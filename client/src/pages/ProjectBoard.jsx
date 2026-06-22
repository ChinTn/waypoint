import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import useTaskStore from "../store/taskStore";
import useProjectStore from "../store/projectStore";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../store/authStore";

import socket from "../api/socket";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import SortableTask from "../components/kanban/SortableTask";
import ColumnDroppable from "../components/kanban/ColumnDroppable";
import TaskDetailsModal from "../components/kanban/TaskDetailsModal";
import ProjectSettingsModal from "../components/project/ProjectSettingsModal";

const COLUMNS = [
  { id: "TODO", title: "To Do", color: "border-white/10" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-blue-500/30" },
  { id: "IN_REVIEW", title: "In Review", color: "border-yellow-500/30" },
  { id: "DONE", title: "Done", color: "border-green-500/30" },
];

const ProjectBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    tasks,
    fetchTasks,
    updateTaskStatus,
    updateTaskPriority,
    createTask,
  } = useTaskStore();
  const { projects, fetchProjectMembers } = useProjectStore();
  const { user } = useAuthStore();

  const currentProject = projects.find((p) => p._id === projectId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newTask, setNewTask] = useState({ title: "", priority: "MEDIUM" });
  const [activeTask, setActiveTask] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [localTasks, setLocalTasks] = useState([]);

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
      fetchProjectMembers(projectId);
    }
  }, [projectId, fetchTasks, fetchProjectMembers]);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    // 1. stablsih the tunnel to backend
    socket.connect();

    // 2. Tell the backend that which bucket we want to listen
    if (user) {
      socket.emit("join_project", { projectId, user });
    }

    // Define named handlers to allow precise cleanup
    const handleOnlineUsers = (users) => setOnlineUsers(users);
    
    const handleTaskCreated = (newTask) => {
      useTaskStore.setState((state) => {
        if (state.tasks.some((t) => t._id === newTask._id)) return state;
        return { tasks: [newTask, ...state.tasks] };
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      if (updatedTask.sentAt) {
        console.log(`⚡ WebSocket Latency: ${Date.now() - updatedTask.sentAt} ms`);
      }
      useTaskStore.setState((state) => ({
        tasks: state.tasks.map((task) =>
          task._id === updatedTask._id ? updatedTask : task,
        ),
      }));
    };

    const handleProjectUpdated = (updatedProject) => {
      useProjectStore.setState((state) => ({
        projects: state.projects.map((p) =>
          p._id === updatedProject._id ? { ...p, ...updatedProject } : p,
        ),
      }));
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("task_created", handleTaskCreated);
    socket.on("task_updated", handleTaskUpdated);
    socket.on("project_updated", handleProjectUpdated);

    // 6. CLEANUP: When we leave the page, stop listening to project-specific events
    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("task_created", handleTaskCreated);
      socket.off("task_updated", handleTaskUpdated);
      socket.off("project_updated", handleProjectUpdated);
      socket.emit("leave_project", projectId);
    };
  }, [projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const task = localTasks.find((t) => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      const activeIndex = localTasks.findIndex((t) => t._id === activeId);
      const overIndex = localTasks.findIndex((t) => t._id === overId);

      if (localTasks[activeIndex].status !== localTasks[overIndex].status) {
        setLocalTasks((prevTasks) => {
          const newTasks = [...prevTasks];
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            status: newTasks[overIndex].status,
          };
          return arrayMove(newTasks, activeIndex, overIndex);
        });
      } else {
        setLocalTasks((prevTasks) =>
          arrayMove(prevTasks, activeIndex, overIndex),
        );
      }
    }

    if (isActiveTask && isOverColumn) {
      setLocalTasks((prevTasks) => {
        const activeIndex = prevTasks.findIndex((t) => t._id === activeId);
        const newTasks = [...prevTasks];
        newTasks[activeIndex] = { ...newTasks[activeIndex], status: overId };
        return arrayMove(newTasks, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const activeTask = localTasks.find((t) => t._id === activeId);

    let finalStatus = activeTask.status;
    const isOverColumn = over.data.current?.type === "Column";

    if (isOverColumn) {
      finalStatus = over.id;
    } else {
      const overTask = localTasks.find((t) => t._id === over.id);
      if (overTask) finalStatus = overTask.status;
    }

    const originalTask = tasks.find((t) => t._id === activeId);
    if (originalTask && originalTask.status !== finalStatus) {
      updateTaskStatus(activeId, finalStatus);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    await createTask({
      projectId,
      title: newTask.title,
      priority: newTask.priority,
    });
    setIsModalOpen(false);
    setNewTask({ title: "", priority: "MEDIUM" });
  };

  return (
    <main className="flex-1 overflow-auto pt-8 px-10 pb-10 flex flex-col relative custom-scrollbar w-full h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
        <div className="flex items-center space-x-4 mb-6 md:mb-0">
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-neutral-400 hover:text-white transition-colors border border-white/5"
            title="Back to Project Hub"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight">
              {currentProject?.name || "Project"}
            </h1>
            <p className="text-neutral-500 font-mono text-sm mt-2">
              {currentProject?.description || "Manage your tasks efficiently."}
            </p>
          </div>
        </div>
        <div className="flex space-x-4 items-center">
          {/* ONLINE USERS AVATAR STACK */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center mr-2 md:mr-6">
              <div className="flex -space-x-3">
                {onlineUsers.slice(0, 5).map((u, i) => (
                  <div
                    key={u._id}
                    className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] overflow-hidden relative"
                    title={u.fullName}
                    style={{ zIndex: 10 - i }}
                  >
                    <img
                      src={
                        u.avatar ||
                        `https://ui-avatars.com/api/?name=${u.fullName}`
                      }
                      alt={u.fullName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0a0a0a]"></div>
                  </div>
                ))}
                {onlineUsers.length > 5 && (
                  <div className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-xs font-bold text-white relative z-0">
                    +{onlineUsers.length - 5}
                  </div>
                )}
              </div>
              <span className="hidden md:flex ml-3 text-[10px] font-mono text-emerald-400 uppercase tracking-[0.2em] items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                Live
              </span>
            </div>
          )}

          {(currentProject?.myRole === "OWNER" ||
            currentProject?.myRole === "ADMIN") && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-4 font-sans text-sm tracking-widest uppercase font-semibold transition-all duration-300 rounded-full border border-white/10 flex items-center"
            >
              Settings
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black px-6 md:px-8 py-4 font-sans text-sm tracking-widest uppercase font-semibold transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] rounded-full flex items-center"
          >
            <Plus size={18} className="mr-2" />
            New Task
          </motion.button>
        </div>
      </div>

      {/* Kanban Columns Grid with dnd-kit */}
      <div className="w-full flex space-x-6 items-start mt-8 relative z-10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((column) => {
            const columnTasks = localTasks.filter(
              (t) => t.status === column.id,
            );

            // Sort by priority (URGENT -> HIGH -> MEDIUM -> LOW)
            const priorityWeight = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
            columnTasks.sort(
              (a, b) => priorityWeight[b.priority] - priorityWeight[a.priority],
            );

            const taskIds = columnTasks.map((t) => t._id);

            return (
              <ColumnDroppable
                key={column.id}
                column={column}
                taskCount={columnTasks.length}
              >
                <SortableContext
                  items={taskIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="p-4 space-y-3 pb-8 min-h-[150px]">
                    {columnTasks.map((task) => (
                      <SortableTask
                        key={task._id}
                        task={task}
                        myRole={currentProject?.myRole}
                        updateTaskPriority={updateTaskPriority}
                        onOpenDetails={setSelectedTaskId}
                      />
                    ))}
                  </div>
                </SortableContext>
              </ColumnDroppable>
            );
          })}

          {/* Floating Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <div className="bg-black/80 backdrop-blur-3xl border border-[#3b82f6] p-4 shadow-[0_0_50px_rgba(255,90,0,0.3)] opacity-95 cursor-grabbing rotate-3 rounded-[1rem]">
                <h4 className="text-sm font-semibold mb-3 text-white">
                  {activeTask.title}
                </h4>
                <div className="flex justify-between items-center mt-1 pt-3 border-t border-white/5">
                  <span
                    className={`text-[10px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border ${activeTask.priority === "URGENT" ? "border-red-500 text-red-100 bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.8)]" : activeTask.priority === "HIGH" ? "border-red-500/50 text-red-400 bg-red-500/10" : activeTask.priority === "MEDIUM" ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10" : "border-green-500/50 text-green-400 bg-green-500/10"}`}
                  >
                    {activeTask.priority}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 p-10 shadow-2xl rounded-[2.5rem]"
            >
              <h2 className="font-serif text-3xl mb-8 text-white">New Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold font-mono text-neutral-500 mb-2 uppercase tracking-[0.2em]">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-full text-base text-white focus:outline-none focus:border-[#3b82f6] transition-colors"
                    placeholder="e.g. Design Login Page"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold font-mono text-neutral-500 mb-4 uppercase tracking-[0.2em]">
                    Priority
                  </label>
                  <div className="flex space-x-3">
                    {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewTask({ ...newTask, priority: p })}
                        className={`flex-1 py-3 rounded-full font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest border transition-all duration-300 ${
                          newTask.priority === p
                            ? p === "URGENT"
                              ? "border-red-500 text-red-100 bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                              : p === "HIGH"
                                ? "border-red-500 text-red-400 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                : p === "MEDIUM"
                                  ? "border-yellow-500 text-yellow-400 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                                  : "border-green-500 text-green-400 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                            : "border-white/5 text-neutral-500 bg-black/20 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-4 text-sm font-bold font-mono text-neutral-400 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-8 py-4 font-sans text-base tracking-widest uppercase font-semibold flex items-center transition-colors shadow-[0_0_20px_rgba(255,90,0,0.3)] rounded-full"
                  >
                    Create
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Details Modal */}
      <AnimatePresence>
        {selectedTaskId && (
          <TaskDetailsModal
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </AnimatePresence>

      {/* Project Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <ProjectSettingsModal
            projectId={projectId}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default ProjectBoard;
