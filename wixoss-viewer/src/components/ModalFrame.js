function ModalFrame({ title, onClose, children, surfaceClassName = "" }) {
  return (
    <div className="modal-overlay">
      <div
        className={`modal-surface ${surfaceClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close" aria-label="閉じる">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default ModalFrame;
