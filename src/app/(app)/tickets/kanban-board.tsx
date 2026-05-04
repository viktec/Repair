"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { updateTicketStatusAction } from "./actions";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Ticket = {
  id: string;
  ticketNumber: number;
  deviceBrand: string | null;
  deviceModel: string | null;
  faultDescription: string;
  createdAt: Date;
  customerName: string | null;
  statusName: string | null;
  statusColor: string | null;
  statusId: string | null;
};

type Status = {
  id: string;
  name: string;
  color: string | null;
};

type Column = {
  id: string | null;
  name: string;
  color: string | null;
  tickets: Ticket[];
};

// ─── Card singola (draggable) ───────────────────────────────────────────────

function TicketCard({ ticket, isDragging }: { ticket: Ticket; isDragging?: boolean }) {
  return (
    <div
      className={`rounded-lg bg-white p-3 shadow-sm border border-transparent transition-all ${
        isDragging
          ? "opacity-50 shadow-md border-primary/30"
          : "hover:shadow-md hover:border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-mono text-[11px] font-medium text-muted-foreground">
          #{String(ticket.ticketNumber).padStart(4, "0")}
        </span>
        <span className="text-[10px] text-muted-foreground/70 shrink-0">
          {formatDate(ticket.createdAt)}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground leading-tight">
        {[ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || "Dispositivo"}
      </p>
      {ticket.customerName && (
        <p className="mt-0.5 text-xs text-muted-foreground">{ticket.customerName}</p>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {ticket.faultDescription}
      </p>
    </div>
  );
}

// ─── Card sortable (wrappa TicketCard con useSortable) ──────────────────────

function SortableTicketCard({
  ticket,
  activeId,
}: {
  ticket: Ticket;
  activeId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link
        href={`/tickets/${ticket.id}`}
        onClick={(e) => {
          // Se stiamo trascinando, blocca il click
          if (activeId !== null) e.preventDefault();
        }}
        draggable={false}
      >
        <TicketCard ticket={ticket} isDragging={isDragging} />
      </Link>
    </div>
  );
}

// ─── Colonna ────────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  activeId,
}: {
  column: Column;
  activeId: string | null;
}) {
  const ticketIds = column.tickets.map((t) => t.id);

  return (
    <div className="flex w-64 shrink-0 flex-col rounded-xl bg-slate-100">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: column.color ?? "#94a3b8" }}
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 flex-1 truncate">
          {column.name}
        </span>
        <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          {column.tickets.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 px-2 pb-2 min-h-[60px]">
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          {column.tickets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">
              Nessun ticket
            </div>
          ) : (
            column.tickets.map((t) => (
              <SortableTicketCard key={t.id} ticket={t} activeId={activeId} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Kanban Board principale ─────────────────────────────────────────────────

export function KanbanBoard({
  tickets,
  statuses,
}: {
  tickets: Ticket[];
  statuses: Status[];
}) {
  // Stato locale per optimistic updates
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Costruisce le colonne dallo stato locale
  const buildColumns = useCallback((tks: Ticket[]): Column[] => {
    const byStatus = new Map<string | null, Ticket[]>();
    byStatus.set(null, []);
    for (const s of statuses) byStatus.set(s.id, []);
    for (const t of tks) {
      const key = t.statusId ?? null;
      if (!byStatus.has(key)) byStatus.set(key, []);
      byStatus.get(key)!.push(t);
    }
    return [
      ...statuses.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        tickets: byStatus.get(s.id) ?? [],
      })),
      ...(byStatus.get(null)!.length > 0
        ? [{ id: null, name: "Senza stato", color: null, tickets: byStatus.get(null)! }]
        : []),
    ];
  }, [statuses]);

  const columns = buildColumns(localTickets);

  // Sensore con soglia di movimento per non bloccare il click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Trova la colonna che contiene il ticket con dato id
  function findColumnId(ticketId: string): string | null | undefined {
    return localTickets.find((t) => t.id === ticketId)?.statusId ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    setActiveId(id);
    setActiveTicket(localTickets.find((t) => t.id === id) ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTicketId = active.id as string;
    // over.id può essere un ticketId o un columnId (null → "null")
    let overStatusId: string | null;

    // Controlla se over è una colonna o un ticket
    const overIsColumn = statuses.some((s) => s.id === over.id) || over.id === "null";
    if (overIsColumn) {
      overStatusId = over.id === "null" ? null : (over.id as string);
    } else {
      // È un ticket: recupera il suo statusId
      overStatusId = findColumnId(over.id as string) ?? null;
    }

    const currentStatusId = findColumnId(activeTicketId) ?? null;
    if (currentStatusId === overStatusId) return;

    // Optimistic: sposta il ticket nella nuova colonna
    setLocalTickets((prev) =>
      prev.map((t) =>
        t.id === activeTicketId ? { ...t, statusId: overStatusId } : t
      )
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setActiveTicket(null);

    if (!over) return;

    const activeTicketId = active.id as string;
    let overStatusId: string | null;

    const overIsColumn = statuses.some((s) => s.id === over.id) || over.id === "null";
    if (overIsColumn) {
      overStatusId = over.id === "null" ? null : (over.id as string);
    } else {
      overStatusId = findColumnId(over.id as string) ?? null;
    }

    const currentStatusId = findColumnId(activeTicketId) ?? null;

    // Assicura lo stato locale sia aggiornato (potrebbe non esserlo se over == active)
    setLocalTickets((prev) =>
      prev.map((t) =>
        t.id === activeTicketId ? { ...t, statusId: overStatusId } : t
      )
    );

    // Persist solo se il cambio è reale e il nuovo stato è un ID valido
    if (currentStatusId !== overStatusId && overStatusId !== null) {
      try {
        await updateTicketStatusAction(activeTicketId, overStatusId);
      } catch {
        // Rollback in caso di errore
        setLocalTickets((prev) =>
          prev.map((t) =>
            t.id === activeTicketId ? { ...t, statusId: currentStatusId } : t
          )
        );
      }
    }
  }

  // Tutti gli id delle card per DndContext
  const allTicketIds = localTickets.map((t) => t.id);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id ?? "none"}
            column={col}
            activeId={activeId}
          />
        ))}
      </div>

      {/* Overlay: card "fantasma" che segue il cursore durante il drag */}
      <DragOverlay>
        {activeTicket ? (
          <div className="rotate-1 opacity-90 w-64">
            <TicketCard ticket={activeTicket} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
