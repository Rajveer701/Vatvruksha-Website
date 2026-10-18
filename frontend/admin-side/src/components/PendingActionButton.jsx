// PendingActionButton — disabled control for backend endpoints pending.
// Visible "Backend endpoint pending" label. Never writes to Firestore directly.

export default function PendingActionButton({ label = 'Action', tooltip = 'Backend endpoint pending' }) {
  return (
    <button
      className="btn-pending"
      disabled
      title={tooltip}
      aria-disabled="true"
    >
      <span className="mr-1">⏳</span>
      {label}
    </button>
  )
}
