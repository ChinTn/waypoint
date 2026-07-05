import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  useReactFlow,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Plus, Save, Network, X } from "lucide-react";
import useFlowStore from "../store/flowStore";
import useProjectStore from "../store/projectStore";
import useAuthStore from "../store/authStore";

// Custom Node Design
const CustomNode = ({ id, data, selected }) => {
  const { setNodes } = useReactFlow();

  const onLabelChange = (evt) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: evt.target.value,
            },
          };
        }
        return node;
      }),
    );
  };

  return (
    <div
      className={`px-5 py-3 shadow-xl rounded-2xl bg-white/80 dark:bg-neutral-500/10 backdrop-blur-xl min-w-[140px] relative transition-all ${selected ? "border border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]" : "border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"}`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-neutral-500 border-none rounded-full"
      />

      {/* Glossy top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

      <div className="flex flex-col items-center text-center">
        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/5 mb-1.5 shadow-inner">
          <Network size={14} className="text-slate-400 dark:text-neutral-400" />
        </div>
        <div className="text-[9px] font-medium font-sans text-slate-500 dark:text-neutral-500 uppercase tracking-widest mb-0.5">
          {data.type || "Block"}
        </div>
        <input
          value={data.label}
          onChange={onLabelChange}
          className="bg-transparent text-neutral-900 dark:text-neutral-200 font-medium text-xs text-center outline-none w-full border-b border-transparent hover:border-slate-300 dark:hover:border-white/10 focus:border-blue-400/50 transition-colors"
          placeholder="Node Name"
        />
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-neutral-500 border-none rounded-full"
      />
    </div>
  );
};

// Custom Edge Design (Allows "breaking" / deleting the edge)
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const { setEdges } = useReactFlow();

  // Smoothstep creates clean right-angle breaks instead of bezier curves
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan group"
        >
          <button
            onClick={onEdgeClick}
            className="w-5 h-5 bg-white dark:bg-neutral-900 border border-red-500/50 hover:bg-red-500 hover:text-white hover:border-red-500 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-xl"
            title="Break Connection"
          >
            <X size={12} />
          </button>
        </div>
      </EdgeLabelRenderer>

      {/* Invisible thicker path to make hovering over the line much easier */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
    </>
  );
};

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

const ProjectFlow = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, members, fetchProjectMembers } = useProjectStore();
  const currentProject = projects.find(p => p._id === projectId);
  const {
    nodes: initialNodes,
    edges: initialEdges,
    fetchFlow,
    saveFlow,
  } = useFlowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const myMembership = members.find((m) => m.userId._id === user?._id);
  const myRole = myMembership?.role || "VIEWER";
  const isViewer = myRole === "VIEWER";

  useEffect(() => {
    if (projectId) {
      fetchProjectMembers(projectId);
      fetchFlow(projectId).then(() => setIsDataLoaded(true));
    }
  }, [projectId, fetchFlow, fetchProjectMembers]);

  useEffect(() => {
    if (isDataLoaded) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, isDataLoaded, setNodes, setEdges]);

  // Auto-save logic
  const saveTimeout = useRef(null);

  const triggerSave = useCallback(
    (currentNodes, currentEdges) => {
      if (isViewer) return;

      setIsSaving(true);
      if (saveTimeout.current) clearTimeout(saveTimeout.current);

      saveTimeout.current = setTimeout(async () => {
        await saveFlow(projectId, currentNodes, currentEdges);
        setIsSaving(false);
      }, 1500);
    },
    [projectId, saveFlow, isViewer],
  );

  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      const hasSignificantChange = changes.some(
        (c) => c.type === "position" || c.type === "add" || c.type === "remove",
      );
      if (hasSignificantChange) {
        setNodes((nds) => {
          triggerSave(nds, edges);
          return nds;
        });
      }
    },
    [onNodesChange, edges, triggerSave, setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      const hasSignificantChange = changes.some(
        (c) => c.type === "add" || c.type === "remove",
      );
      if (hasSignificantChange) {
        setEdges((eds) => {
          triggerSave(nodes, eds);
          return eds;
        });
      }
    },
    [onEdgesChange, nodes, triggerSave, setEdges],
  );

  const onConnect = useCallback(
    (params) => {
      if (isViewer) return;
      const newEdges = addEdge(
        {
          ...params,
          type: "custom",
          animated: true,
          style: { stroke: "#3b82f6", strokeWidth: 2 },
        },
        edges,
      );
      setEdges(newEdges);
      triggerSave(nodes, newEdges);
    },
    [edges, setEdges, nodes, triggerSave, isViewer],
  );

  const addNode = () => {
    if (isViewer) return;
    const newNode = {
      id: `node_${Date.now()}`,
      type: "custom",
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: `New Block`, type: "Component" },
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    triggerSave(newNodes, edges);
  };

  if (!currentProject) {
      return (
          <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-neutral-950">
              <p className="text-neutral-400 font-sans text-sm uppercase tracking-widest mb-4">Project not found or you lost access</p>
              <button onClick={() => navigate('/projects')} className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-neutral-900 dark:text-white font-bold transition-colors border border-slate-200 dark:border-white/10">
                  Back to Projects
              </button>
          </div>
      );
  }

  if (!isDataLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-neutral-500 font-sans animate-pulse bg-slate-50 dark:bg-neutral-950">
        Loading Canvas...
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-neutral-950 relative w-full overflow-hidden">
      {/* Header / Toolbar */}
      <div className="absolute top-6 left-6 z-10 flex items-center space-x-4">
        <button
          onClick={() => navigate(`/project/${projectId}`)}
          className="p-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/10 shadow-xl"
          title="Back to Hub"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-slate-200 dark:border-white/10 px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-4">
          <div>
            <h2 className="text-neutral-900 dark:text-white font-bold text-sm">
              Architecture Flow
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-500 font-sans mt-0.5">
              {nodes.length} Nodes
            </p>
          </div>
          {isSaving && (
            <div className="flex items-center text-[10px] font-bold font-sans text-[#3b82f6] uppercase tracking-widest animate-pulse ml-4 border-l border-slate-200 dark:border-white/10 pl-4">
              <Save size={12} className="mr-2" /> Saving
            </div>
          )}
        </div>
      </div>

      {!isViewer && (
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={addNode}
            className="bg-[#3b82f6] text-white px-6 py-3 rounded-2xl font-bold font-sans text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center"
          >
            <Plus size={16} className="mr-2" /> Add Node
          </button>
        </div>
      )}

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: "custom",
            animated: true,
            style: { stroke: "#3b82f6", strokeWidth: 2 },
          }}
          fitView
          className="bg-slate-50 dark:bg-neutral-950"
          nodesDraggable={!isViewer}
          nodesConnectable={!isViewer}
          elementsSelectable={!isViewer}
        >
          <Controls className="bg-white dark:bg-neutral-900 border-slate-200 dark:border-white/10 fill-neutral-900 dark:fill-white text-neutral-900 dark:text-white shadow-2xl" />
          <MiniMap
            nodeColor="#3b82f6"
            className="bg-white dark:bg-neutral-900 border-slate-200 dark:border-white/10 shadow-2xl transition-colors duration-300"
          />
          <Background color="#94a3b8" gap={24} size={1} opacity={0.1} />
        </ReactFlow>
      </div>

      <style jsx global>{`
        /* Light Mode (Default) */
        .react-flow__panel.react-flow__controls button {
          background: #ffffff !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
          color: #171717 !important;
          fill: #171717 !important;
        }

        .react-flow__panel.react-flow__controls button:hover {
          background: #f8fafc !important;
        }

        .react-flow__minimap {
          background: #ffffff !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          border-radius: 16px !important;
          overflow: hidden;
        }

        .react-flow__minimap-mask {
          fill: rgba(0, 0, 0, 0.1) !important;
        }

        /* Dark Mode */
        .dark .react-flow__panel.react-flow__controls button {
          background: #171717 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          fill: white !important;
        }

        .dark .react-flow__panel.react-flow__controls button:hover {
          background: #1a1a1a !important;
        }

        .dark .react-flow__minimap {
          background: #0a0a0a !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .dark .react-flow__minimap-mask {
          fill: rgba(0, 0, 0, 0.8) !important;
        }
      `}</style>
    </main>
  );
};

export default ProjectFlow;
