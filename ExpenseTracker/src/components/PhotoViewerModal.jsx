import { useState } from 'react';
import { Modal } from './Modal';
import { FaChevronLeft, FaChevronRight, FaCamera } from 'react-icons/fa';

export const PhotoViewerModal = ({ isOpen, onClose, photos = [], title = 'Attached Receipt / Photos' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || !photos || photos.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {/* Main Photo Display */}
        <div className="relative w-full max-h-[60vh] flex items-center justify-center bg-stone-900 rounded-2xl overflow-hidden border-2 border-pink-300 shadow-inner group p-2">
          <img
            src={photos[currentIndex]}
            alt={`Photo ${currentIndex + 1}`}
            className="max-h-[55vh] w-auto max-w-full object-contain rounded-lg"
          />

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-md cursor-pointer border border-white/20"
                title="Previous photo"
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-md cursor-pointer border border-white/20"
                title="Next photo"
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 rounded-full text-[11px] font-black text-white uppercase tracking-wider border border-white/20 backdrop-blur-xs flex items-center gap-1.5">
            <FaCamera className="w-3 h-3 text-pink-400" />
            <span>{currentIndex + 1} of {photos.length}</span>
          </div>
        </div>

        {/* Thumbnail Selector Strip if multiple */}
        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
            {photos.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  currentIndex === idx
                    ? 'border-rose-600 ring-2 ring-rose-400 scale-105 shadow-md'
                    : 'border-pink-200 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-pink-100">
          <a
            href={photos[currentIndex]}
            download={`receipt_photo_${currentIndex + 1}.jpg`}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline uppercase"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download High Res Image
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md transition-all cursor-pointer uppercase"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
