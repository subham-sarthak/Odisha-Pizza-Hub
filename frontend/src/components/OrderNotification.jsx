const palette = {
  info: {
    background: "linear-gradient(135deg, rgba(255,107,53,0.16), rgba(255,159,67,0.12))",
    border: "1px solid rgba(255,107,53,0.35)",
    color: "#7a2e12"
  },
  success: {
    background: "linear-gradient(135deg, rgba(34,197,94,0.16), rgba(74,222,128,0.12))",
    border: "1px solid rgba(34,197,94,0.35)",
    color: "#166534"
  },
  error: {
    background: "linear-gradient(135deg, rgba(239,68,68,0.16), rgba(248,113,113,0.12))",
    border: "1px solid rgba(239,68,68,0.35)",
    color: "#991b1b"
  }
};

export default function OrderNotification({ title, message, count = 0, tone = "info", onClear }) {
  const theme = palette[tone] || palette.info;
  const displayTitle = title || "🔔 New Order Received";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0.9rem 1rem",
        borderRadius: "1rem",
        background: theme.background,
        border: theme.border,
        color: theme.color
      }}
    >
      <div style={{ display: "grid", gap: "0.2rem" }}>
        <strong>{displayTitle}</strong>
        <span style={{ fontSize: "0.92rem", opacity: 0.9 }}>{message}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {count > 0 ? (
          <span
            style={{
              minWidth: "2rem",
              height: "2rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 0.65rem",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.72)",
              fontWeight: 700
            }}
          >
            {count}
          </span>
        ) : null}
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            style={{
              border: "none",
              background: "transparent",
              color: "inherit",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
