import { useState, useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Project, Item, Stage } from '../../db/schema';
import { ItemCard } from '../items/ItemCard';
import { createItem, moveItemToStage, reorderItem } from '../../db/mutations';

const STAGE_PREFIX = 'stage:';

export function KanbanView({ project, items }: { project: Project; items: Item[] }) {
  const stages = useMemo(() => [...project.stages].sort((a, b) => a.order - b.order), [project.stages]);
  const itemsByStage = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const s of stages) map.set(s.id, []);
    for (const item of items) {
      const list = map.get(item.stageId);
      if (list) list.push(item);
    }
    for (const list of map.values()) list.sort((a, b) => a.order - b.order);
    return map;
  }, [stages, items]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  function findStageOfItem(id: string): string | null {
    for (const [stageId, list] of itemsByStage) {
      if (list.some((i) => i.id === id)) return stageId;
    }
    return null;
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;

    const fromStage = findStageOfItem(activeIdStr);
    if (!fromStage) return;

    let toStage: string;
    let toIndex: number;

    if (overId.startsWith(STAGE_PREFIX)) {
      toStage = overId.slice(STAGE_PREFIX.length);
      const list = itemsByStage.get(toStage) ?? [];
      toIndex = list.length;
    } else {
      const overStage = findStageOfItem(overId);
      if (!overStage) return;
      toStage = overStage;
      const list = itemsByStage.get(toStage) ?? [];
      toIndex = list.findIndex((i) => i.id === overId);
      if (toIndex < 0) toIndex = list.length;
    }

    if (fromStage === toStage) {
      const list = itemsByStage.get(fromStage) ?? [];
      const fromIndex = list.findIndex((i) => i.id === activeIdStr);
      if (fromIndex === toIndex || fromIndex < 0) return;
      const next = arrayMove(list, fromIndex, toIndex);
      await reorderItem(
        next[0].projectId,
        fromStage,
        next.map((i) => i.id),
      );
    } else {
      await moveItemToStage(activeIdStr, toStage);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            items={itemsByStage.get(stage.id) ?? []}
            projectId={project.id}
          />
        ))}
        {stages.length === 0 && (
          <div className="glass p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            No stages yet. Add some via the Stages panel above.
          </div>
        )}
      </div>
      <DragOverlay>{activeItem && <ItemCard item={activeItem} />}</DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  stage,
  items,
  projectId,
}: {
  stage: Stage;
  items: Item[];
  projectId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${STAGE_PREFIX}${stage.id}` });
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  async function commitAdd() {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setAdding(false);
      setNewTitle('');
      return;
    }
    await createItem(projectId, stage.id, trimmed);
    setNewTitle('');
    setAdding(false);
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 shrink-0 rounded-lg p-2 transition ${isOver ? 'ring-1' : ''}`}
      style={{
        background: isOver ? `${stage.color}11` : 'transparent',
      }}
    >
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: stage.color }}
          />
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: stage.color }}
          >
            {stage.name}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {items.length}
          </span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="text-xs opacity-60 hover:opacity-100 px-1.5 py-0.5 rounded"
          title="Add item"
        >
          +
        </button>
      </div>

      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[24px]">
          {items.map((item) => (
            <SortableItem key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>

      {adding ? (
        <div className="mt-2">
          <textarea
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={commitAdd}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitAdd();
              }
              if (e.key === 'Escape') {
                setNewTitle('');
                setAdding(false);
              }
            }}
            placeholder="Item title…"
            rows={2}
            className="glass glass-inner w-full p-2 text-sm bg-transparent outline-none resize-none"
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 text-xs px-2 py-1.5 rounded-md opacity-50 hover:opacity-100 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-left"
          style={{ color: 'var(--text-muted)' }}
        >
          + Add item
        </button>
      )}
    </div>
  );
}

function SortableItem({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ItemCard
        item={item}
        dragHandle={
          <span
            {...listeners}
            className="text-[10px] leading-none opacity-30 hover:opacity-70 cursor-grab active:cursor-grabbing pt-0.5 select-none"
            title="Drag"
            onClick={(e) => e.stopPropagation()}
          >
            ⋮⋮
          </span>
        }
      />
    </div>
  );
}
