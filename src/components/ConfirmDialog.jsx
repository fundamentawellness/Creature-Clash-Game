export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <button type="button" className="absolute inset-0 bg-black/75" aria-label="Close" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-600 bg-slate-900 p-5 sm:p-6 shadow-2xl slide-up">
        <h3 id="confirm-title" className="font-game text-xl font-bold tracking-wide text-slate-100 mb-3">{title}</h3>
        <p className="font-ui text-base text-slate-300 leading-relaxed mb-5">{message}</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl px-4 py-3 font-ui text-base font-bold uppercase tracking-wider bg-slate-700 text-slate-100 active:bg-slate-600 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full rounded-xl px-4 py-3 font-ui text-base font-bold uppercase tracking-wider cursor-pointer ${
              danger
                ? 'bg-red-600 text-white active:bg-red-500'
                : 'bg-amber-500 text-slate-950 active:bg-amber-400'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
