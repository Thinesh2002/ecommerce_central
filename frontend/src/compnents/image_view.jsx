export default function ImageModal({ src, onClose }) {
  if (!src) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative"
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 text-sm"
        >
          ✕
        </button>

        <img
          src={src}
          alt="Preview"
          className="max-w-[90vw] max-h-[90vh] rounded-lg border border-white/10"
        />
      </div>
    </div>
  );
}
