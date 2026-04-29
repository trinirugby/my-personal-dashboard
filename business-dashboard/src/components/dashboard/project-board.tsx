"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { toast } from "sonner";
import { updateProjectStatus, updateProjectAction } from "@/app/actions";
import type { Project } from "@/lib/airtable";

const OWNER_COLORS: Record<string, string> = {
  M: "#bfff3a",
  P: "#3affd1",
  MP: "#c44dff",
};

function ownerInitials(owner: string | undefined): string | null {
  if (!owner) return null;
  const trimmed = owner.trim();
  if (!trimmed) return null;
  if (/^both$/i.test(trimmed)) return "MP";
  const words = trimmed.split(/[\s&/+,]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return words[0].slice(0, 2).toUpperCase();
}

function ownerColor(initials: string | null): string {
  if (!initials) return "#3a3f47";
  return OWNER_COLORS[initials] ?? "#fbbf24";
}

const inputCls = "w-full bg-[#0b0d10] border border-[#2a2e34] rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors";
const selectCls = inputCls + " cursor-pointer";

type Props = { projects: Project[] };
type Status = "Lead" | "In Progress" | "Review" | "Done";

const PAYMENT_LABELS: Record<string, string> = {
  one_time: "One-time",
  deposit_final: "Deposit + Final",
  milestones: "Milestones",
  recurring_monthly: "Recurring monthly",
  recurring_custom: "Recurring custom",
};

const COLUMNS: Status[] = ["Lead", "In Progress", "Review", "Done"];

const COLUMN_STYLES: Record<Status, { header: string; dot: string }> = {
  Lead: { header: "text-zinc-400", dot: "bg-zinc-500" },
  "In Progress": { header: "text-[#3affd1]", dot: "bg-[#3affd1]" },
  Review: { header: "text-[#c44dff]", dot: "bg-[#c44dff]" },
  Done: { header: "text-[#bfff3a]", dot: "bg-[#bfff3a]" },
};

const PAYMENT_COLORS: Record<string, string> = {
  one_time: "bg-zinc-700 text-zinc-300",
  deposit_final: "bg-[#3affd1]/10 text-[#3affd1]",
  milestones: "bg-[#c44dff]/10 text-[#c44dff]",
  recurring_monthly: "bg-[#bfff3a]/10 text-[#bfff3a]",
  recurring_custom: "bg-[#bfff3a]/10 text-[#bfff3a]",
};

function ProjectCard({ project, isDragging = false, onClick }: { project: Project; isDragging?: boolean; onClick?: () => void }) {
  const initials = ownerInitials(project.Owner);
  const ownerCol = ownerColor(initials);
  const serviceType = project["Service Type"];

  return (
    <div
      onClick={onClick}
      className={`bg-[#0b0d10] border border-[#2a2e34] rounded-2xl p-4 select-none ${
        isDragging ? "opacity-50" : "hover:border-zinc-600 transition-colors"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-white leading-tight flex-1">{project.Name}</p>
        {initials && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums shrink-0"
            style={{ background: `${ownerCol}1f`, color: ownerCol }}
            title={`Owner: ${project.Owner}`}
          >
            {initials}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {serviceType && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/[0.04] text-zinc-300">
            {serviceType}
          </span>
        )}
        {project["Payment Structure"] && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[project["Payment Structure"]] ?? "bg-zinc-700 text-zinc-300"}`}>
            {PAYMENT_LABELS[project["Payment Structure"]] ?? project["Payment Structure"].replace(/_/g, " ")}
          </span>
        )}
        {(project["Total Value"] ?? 0) > 0 && (
          <span className="text-[10px] text-zinc-500">
            ${(project["Total Value"] ?? 0).toLocaleString()}
          </span>
        )}
        {project["Recurring Amount"] && (
          <span className="text-[10px] text-zinc-500">
            ${project["Recurring Amount"].toLocaleString()}/mo
          </span>
        )}
      </div>
      {project["Start Date"] && (
        <p className="text-[10px] text-zinc-600 mt-2">{project["Start Date"]}</p>
      )}
    </div>
  );
}

function ProjectDetailModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [editMode, setEditMode] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  const style = COLUMN_STYLES[project.Status as Status] ?? COLUMN_STYLES["Lead"];

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const totalValue = fd.get("totalValue") as string;
    setError(false);
    start(async () => {
      try {
        await updateProjectAction(project.id, {
          Name: (fd.get("name") as string) || undefined,
          Status: (fd.get("status") as string) || undefined,
          "Payment Structure": (fd.get("paymentStructure") as string) || undefined,
          "Total Value": totalValue ? parseFloat(totalValue) : undefined,
          "Start Date": (fd.get("startDate") as string) || undefined,
          "End Date": (fd.get("endDate") as string) || undefined,
          Notes: (fd.get("notes") as string) || undefined,
          Owner: (fd.get("owner") as string) || undefined,
          "Service Type": (fd.get("serviceType") as string) || undefined,
        });
        toast.success("Project saved");
        onClose();
      } catch {
        setError(true);
        toast.error("Failed to save project");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-[#14181d] border border-[#2a2e34] rounded-[20px] p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-semibold text-white leading-snug pr-4">{project.Name}</p>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setEditMode(!editMode)} className="text-xs text-zinc-500 hover:text-white transition-colors">
              {editMode ? "View" : "Edit"}
            </button>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-lg leading-none">✕</button>
          </div>
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Name</label>
              <input name="name" defaultValue={project.Name} className={inputCls} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Status</label>
                <select name="status" defaultValue={project.Status ?? "Lead"} className={selectCls}>
                  <option value="Lead">Lead</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Done">Done</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Total Value ($)</label>
                <input name="totalValue" type="number" min="0" step="0.01" defaultValue={project["Total Value"] ?? ""} className={inputCls} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Payment Structure</label>
              <select name="paymentStructure" defaultValue={project["Payment Structure"] ?? ""} className={selectCls}>
                <option value="">—</option>
                <option value="one_time">One-time</option>
                <option value="deposit_final">Deposit + Final</option>
                <option value="milestones">Milestones</option>
                <option value="recurring_monthly">Recurring monthly</option>
                <option value="recurring_custom">Recurring custom</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Owner</label>
                <select name="owner" defaultValue={project.Owner ?? ""} className={selectCls}>
                  <option value="">—</option>
                  <option value="M">M</option>
                  <option value="Partner">Partner</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Service Type</label>
                <select name="serviceType" defaultValue={project["Service Type"] ?? ""} className={selectCls}>
                  <option value="">—</option>
                  <option value="Web Dev">Web Dev</option>
                  <option value="AI Automation">AI Automation</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Start Date</label>
                <input name="startDate" type="date" defaultValue={project["Start Date"] ?? ""} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">End Date</label>
                <input name="endDate" type="date" defaultValue={project["End Date"] ?? ""} className={inputCls} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400">Notes</label>
              <input name="notes" defaultValue={project.Notes ?? ""} placeholder="Optional" className={inputCls} />
            </div>
            {error && <p className="text-xs text-[#ff4d8b]">Failed to save. Try again.</p>}
            <div className="flex gap-2 justify-end mt-1">
              <button type="button" onClick={() => setEditMode(false)} className="text-xs px-4 py-2 rounded-xl border border-[#2a2e34] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={pending} className="text-xs px-4 py-2 rounded-xl font-semibold bg-[#c44dff] text-white disabled:opacity-40 transition-colors hover:bg-[#c44dff]/80">
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${style.dot}`} />
              <span className={`text-xs font-medium ${style.header}`}>{project.Status}</span>
            </div>
            <div className="space-y-2 text-xs">
              {project.Owner && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Owner</span>
                  <span className="text-zinc-300">{project.Owner}</span>
                </div>
              )}
              {project["Service Type"] && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Service type</span>
                  <span className="text-zinc-300">{project["Service Type"]}</span>
                </div>
              )}
              {project["Payment Structure"] && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Payment</span>
                  <span className="text-zinc-300">{PAYMENT_LABELS[project["Payment Structure"]] ?? project["Payment Structure"]}</span>
                </div>
              )}
              {(project["Total Value"] ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total value</span>
                  <span className="text-white font-semibold">${(project["Total Value"] ?? 0).toLocaleString()}</span>
                </div>
              )}
              {project["Recurring Amount"] && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Recurring</span>
                  <span className="text-zinc-300">${project["Recurring Amount"].toLocaleString()}/mo</span>
                </div>
              )}
              {project["Start Date"] && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Start date</span>
                  <span className="text-zinc-300">{project["Start Date"]}</span>
                </div>
              )}
              {project["End Date"] && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">End date</span>
                  <span className="text-zinc-300">{project["End Date"]}</span>
                </div>
              )}
              {(project["Paid To Date"] ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Paid to date</span>
                  <span className="text-[#bfff3a] font-semibold">${(project["Paid To Date"] ?? 0).toLocaleString()}</span>
                </div>
              )}
            </div>
            {project.Notes ? (
              <div className="mt-4 pt-4 border-t border-[#2a2e34]">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Notes</p>
                <p className="text-xs text-zinc-300 leading-relaxed">{project.Notes}</p>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-[#2a2e34]">
                <p className="text-xs text-zinc-600 italic">No notes</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ project, onDetail }: { project: Project; onDetail: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: project.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <ProjectCard project={project} isDragging={isDragging} onClick={isDragging ? undefined : onDetail} />
    </div>
  );
}

function Column({ status, projects, onDetail }: { status: Status; projects: Project[]; onDetail: (p: Project) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const style = COLUMN_STYLES[status];

  return (
    <div className="min-w-[220px] flex-1">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full ${style.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${style.header}`}>
          {status}
        </span>
        <span className="text-xs text-zinc-600 ml-1">{projects.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[120px] rounded-2xl p-2 space-y-2 transition-colors ${
          isOver ? "bg-white/[0.03]" : ""
        }`}
      >
        {projects.map((p) => (
          <DraggableCard key={p.id} project={p} onDetail={() => onDetail(p)} />
        ))}
      </div>
    </div>
  );
}

type OwnerFilter = "All" | string;

export function ProjectBoard({ projects }: Props) {
  const [localProjects, setLocalProjects] = useState(projects);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("All");
  const [, startTransition] = useTransition();

  useEffect(() => { setLocalProjects(projects); }, [projects]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const activeProject = localProjects.find((p) => p.id === activeId);

  const ownerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of localProjects) {
      if (p.Owner) set.add(p.Owner);
    }
    return Array.from(set).sort();
  }, [localProjects]);

  const visible = localProjects
    .filter((p) => p.Status !== "Cancelled")
    .filter((p) => ownerFilter === "All" ? true : p.Owner === ownerFilter);

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const newStatus = over.id as string;
    if (!COLUMNS.includes(newStatus as Status)) return;
    const typedStatus = newStatus as Status;
    const project = localProjects.find((p) => p.id === active.id);
    if (!project || project.Status === typedStatus) return;

    const prevProjects = localProjects;
    setLocalProjects((prev) =>
      prev.map((p) => (p.id === active.id ? { ...p, Status: typedStatus } : p))
    );
    startTransition(async () => {
      try {
        await updateProjectStatus(active.id as string, typedStatus);
        toast.success(`Moved to ${typedStatus}`);
      } catch {
        setLocalProjects(prevProjects);
        toast.error("Failed to move project");
      }
    });
  }

  return (
    <div className="bg-[#14181d] border border-[#2a2e34] rounded-[20px] p-6 hover:-translate-y-0.5 hover:shadow-lg transition-transform">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">Projects</p>
        {ownerOptions.length > 0 && (
          <div className="flex gap-1 bg-[#0b0d10] rounded-xl p-1">
            {(["All", ...ownerOptions] as OwnerFilter[]).map((f) => {
              const initials = f === "All" ? "All" : ownerInitials(f);
              return (
                <button
                  key={f}
                  onClick={() => setOwnerFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                    ownerFilter === f ? "bg-[#bfff3a] text-black" : "text-zinc-400 hover:text-white"
                  }`}
                  title={f === "All" ? "All owners" : `Owner: ${f}`}
                >
                  {initials}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max md:min-w-0">
          {COLUMNS.map((status) => (
            <Column
              key={status}
              status={status}
              projects={visible.filter((p) => p.Status === status)}
              onDetail={setDetailProject}
            />
          ))}
        </div>
        </div>
        <DragOverlay>
          {activeProject ? <ProjectCard project={activeProject} /> : null}
        </DragOverlay>
      </DndContext>
      {detailProject && (
        <ProjectDetailModal project={detailProject} onClose={() => setDetailProject(null)} />
      )}
    </div>
  );
}
