export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    danger = false,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <p className="mt-2 text-sm text-gray-600">{message}</p>
                </div>
                <div className="flex flex-col gap-3 px-6 py-5">
                    <button
                        onClick={onConfirm}
                        className={`w-full rounded-md px-4 py-3 text-sm font-semibold transition ${danger ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-primary'}`}
                    >
                        {confirmLabel}
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full rounded-md btn-secondary text-sm font-semibold"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
