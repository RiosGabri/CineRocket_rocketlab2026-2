import { useState } from "react";

interface ExpandableListProps {
  label: string;
  items: string[];
  limit?: number;
}

export function ExpandableList({ label, items, limit = 7 }: ExpandableListProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const visible = expanded ? items : items.slice(0, limit);
  const hasMore = items.length > limit;

  return (
    <p>
      <strong>{label}:</strong> {visible.join(", ")}
      {hasMore && (
        <>
          {" "}
          <button
            type="button"
            className="expand-toggle"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "ver menos" : `ver mais ${items.length - limit}`}
          </button>
        </>
      )}
    </p>
  );
}