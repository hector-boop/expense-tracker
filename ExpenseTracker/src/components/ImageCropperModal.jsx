import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { FaImage, FaUndo, FaCheck, FaTimes, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';

const VIEWPORT_SIZE = 340; // Size of the dark cropper box in px
const CROP_SIZE = 240;     // Diameter of the crop circle in px
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 4.0;

export const ImageCropperModal = ({ isOpen, onClose, imageSrc, onSave }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchDist, setTouchDist] = useState(null);
  
  // Image metadata
  const [baseSize, setBaseSize] = useState({ width: CROP_SIZE, height: CROP_SIZE });
  const [loadedSrc, setLoadedSrc] = useState(imageSrc);
  const [errorMsg, setErrorMsg] = useState('');
  const [livePreviewUrl, setLivePreviewUrl] = useState('');

  const viewportRef = useRef(null);
  const imageRef = useRef(null);
  const interactionTimerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Helper to clamp offsets so image NEVER exposes empty background inside crop frame
  const clampOffset = useCallback((x, y, z) => {
    const curW = baseSize.width * z;
    const curH = baseSize.height * z;
    const maxX = Math.max(0, (curW - CROP_SIZE) / 2);
    const maxY = Math.max(0, (curH - CROP_SIZE) / 2);

    return {
      x: Math.min(Math.max(x, -maxX), maxX),
      y: Math.min(Math.max(y, -maxY), maxY),
    };
  }, [baseSize]);

  // Mark interaction active & schedule grid fade-out
  const triggerInteraction = useCallback(() => {
    setIsInteracting(true);
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 400);
  }, []);

  // Initialize and calculate Cover-Fit scaling
  useEffect(() => {
    if (isOpen && imageSrc) {
      setErrorMsg('');
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
      setLoadedSrc(imageSrc);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      img.onload = () => {
        const nw = img.naturalWidth || 300;
        const nh = img.naturalHeight || 300;

        // Cover-fit scale relative to CROP_SIZE (240px)
        const coverScale = Math.max(CROP_SIZE / nw, CROP_SIZE / nh);
        const w0 = nw * coverScale;
        const h0 = nh * coverScale;

        setBaseSize({ width: w0, height: h0 });
        setOffset({ x: 0, y: 0 });
      };

      img.onerror = () => {
        setErrorMsg('Failed to load image format. Please try another photo.');
      };
    }
  }, [isOpen, imageSrc]);

  // Generate Live Mini Preview
  useEffect(() => {
    if (!isOpen || !loadedSrc || !imageRef.current) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    animFrameRef.current = requestAnimationFrame(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.arc(32, 32, 32, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#1e1f22';
        ctx.fillRect(0, 0, 64, 64);

        const ratio = 64 / CROP_SIZE;
        ctx.translate(32, 32);
        ctx.translate(offset.x * ratio, offset.y * ratio);
        ctx.scale(zoom * ratio, zoom * ratio);
        ctx.rotate((rotation * Math.PI) / 180);

        ctx.drawImage(
          imageRef.current,
          -baseSize.width / 2,
          -baseSize.height / 2,
          baseSize.width,
          baseSize.height
        );

        setLivePreviewUrl(canvas.toDataURL());
      } catch {
        // Ignore preview generation errors
      }
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, loadedSrc, zoom, offset, rotation, baseSize]);

  if (!isOpen || !imageSrc) return null;

  // Mouse Drag Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only primary click
    e.preventDefault();
    setIsDragging(true);
    triggerInteraction();
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    triggerInteraction();

    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    const clamped = clampOffset(rawX, rawY, zoom);
    setOffset(clamped);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Cursor-Centered Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    triggerInteraction();

    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Mouse coordinates relative to viewport center (170, 170)
    const mouseX = e.clientX - rect.left - VIEWPORT_SIZE / 2;
    const mouseY = e.clientY - rect.top - VIEWPORT_SIZE / 2;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.min(Math.max(MIN_ZOOM, zoom * zoomFactor), MAX_ZOOM);

    if (newZoom === zoom) return;

    // Adjust offsets so zoom centers on cursor
    const targetX = mouseX - (mouseX - offset.x) * (newZoom / zoom);
    const targetY = mouseY - (mouseY - offset.y) * (newZoom / zoom);

    setZoom(newZoom);
    setOffset(clampOffset(targetX, targetY, newZoom));
  };

  // Touch Handlers for Mobile (Pinch-To-Zoom & Pan)
  const handleTouchStart = (e) => {
    triggerInteraction();
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDist(dist);
    }
  };

  const handleTouchMove = (e) => {
    triggerInteraction();
    if (e.touches.length === 1 && isDragging) {
      const rawX = e.touches[0].clientX - dragStart.x;
      const rawY = e.touches[0].clientY - dragStart.y;
      setOffset(clampOffset(rawX, rawY, zoom));
    } else if (e.touches.length === 2 && touchDist) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = newDist / touchDist;
      const newZoom = Math.min(Math.max(MIN_ZOOM, zoom * factor), MAX_ZOOM);
      setZoom(newZoom);
      setOffset((prev) => clampOffset(prev.x, prev.y, newZoom));
      setTouchDist(newDist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchDist(null);
  };

  // Double Click Reset
  const handleDoubleClick = () => {
    triggerInteraction();
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  };

  // Slider Zoom Update
  const handleSliderZoomChange = (newZoomVal) => {
    triggerInteraction();
    setZoom(newZoomVal);
    setOffset((prev) => clampOffset(prev.x, prev.y, newZoomVal));
  };

  // Rotate Image
  const handleRotate = () => {
    triggerInteraction();
    setRotation((prev) => (prev + 90) % 360);
  };

  // Keyboard Shortcuts (Arrow Nudge, Zoom +/-, Enter, Escape)
  const handleKeyDown = (e) => {
    triggerInteraction();
    const step = e.shiftKey ? 20 : 6;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setOffset((prev) => clampOffset(prev.x - step, prev.y, zoom));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setOffset((prev) => clampOffset(prev.x + step, prev.y, zoom));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOffset((prev) => clampOffset(prev.x, prev.y - step, zoom));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOffset((prev) => clampOffset(prev.x, prev.y + step, zoom));
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      const z = Math.min(MAX_ZOOM, zoom + 0.15);
      setZoom(z);
      setOffset((prev) => clampOffset(prev.x, prev.y, z));
    } else if (e.key === '-') {
      e.preventDefault();
      const z = Math.max(MIN_ZOOM, zoom - 0.15);
      setZoom(z);
      setOffset((prev) => clampOffset(prev.x, prev.y, z));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleCropAndSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Canvas Crop & High-Res Export
  const handleCropAndSave = () => {
    const img = imageRef.current;
    if (!img) return;

    const EXPORT_SIZE = 400; // High-res avatar export size
    const ratio = EXPORT_SIZE / CROP_SIZE;

    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clip to circle
    ctx.beginPath();
    ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, EXPORT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

    ctx.translate(EXPORT_SIZE / 2, EXPORT_SIZE / 2);
    ctx.translate(offset.x * ratio, offset.y * ratio);
    ctx.scale(zoom * ratio, zoom * ratio);
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.drawImage(
      img,
      -baseSize.width / 2,
      -baseSize.height / 2,
      baseSize.width,
      baseSize.height
    );

    try {
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onSave(croppedDataUrl);
    } catch (err) {
      console.warn('Canvas export fallback:', err);
      onSave(loadedSrc || imageSrc);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Image">
      <div 
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="space-y-4 bg-[#1e1f22] p-5 -m-6 rounded-b-3xl text-white select-none outline-none focus:ring-1 focus:ring-rose-500/50 transition-all font-sans"
        aria-label="Image Cropper Workspace"
      >
        {/* Error Banner if invalid image */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-900/40 border border-red-500 text-xs font-bold text-red-200 text-center uppercase">
            {errorMsg}
          </div>
        )}

        {/* Discord-style Main Viewport */}
        <div
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          className="relative w-[340px] h-[340px] mx-auto bg-[#111214] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center border border-neutral-800 shadow-2xl touch-none"
        >
          {/* Hardware-Accelerated Draggable Image (Pixel-Perfect Center Anchored) */}
          <img
            ref={imageRef}
            src={loadedSrc || imageSrc}
            crossOrigin="anonymous"
            alt="Adjust Profile Avatar"
            draggable={false}
            className="absolute left-1/2 top-1/2 max-w-none pointer-events-none transition-transform ease-out duration-75"
            style={{
              width: `${baseSize.width}px`,
              height: `${baseSize.height}px`,
              transform: `translate(-50%, -50%) translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          />

          {/* Dimmed Background Overlay & Circular Crop Frame */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-[240px] h-[240px] rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] shadow-black/80">
              
              {/* Fade-in Rule of Thirds Grid during interaction */}
              <div 
                className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                  isInteracting ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="absolute left-1/3 top-0 bottom-0 border-l border-dashed border-white/30" />
                <div className="absolute right-1/3 top-0 bottom-0 border-l border-dashed border-white/30" />
                <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-white/30" />
                <div className="absolute bottom-1/3 left-0 right-0 border-t border-dashed border-white/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Discord Control Bar & Live Preview */}
        <div className="max-w-[340px] mx-auto space-y-3 pt-1">
          <div className="flex items-center gap-3 bg-[#2b2d31] p-3 rounded-2xl border border-neutral-700/60 shadow-md">
            <button
              type="button"
              onClick={() => handleSliderZoomChange(Math.max(MIN_ZOOM, zoom - 0.2))}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom out"
            >
              <FaSearchMinus className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step="0.01"
              value={zoom}
              onChange={(e) => handleSliderZoomChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer accent-rose-500"
              aria-label="Zoom Level"
            />

            <button
              type="button"
              onClick={() => handleSliderZoomChange(Math.min(MAX_ZOOM, zoom + 0.2))}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom in"
            >
              <FaSearchPlus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRotate}
              className="ml-1 p-2 rounded-xl bg-[#313338] hover:bg-[#383a40] text-neutral-200 transition-all cursor-pointer border border-neutral-700/50"
              title="Rotate 90°"
            >
              <FaUndo className="w-3 h-3" />
            </button>
          </div>

          {/* Footer Info & Live Preview Badge */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 px-1">
            <div className="flex items-center gap-2">
              {livePreviewUrl && (
                <div className="w-7 h-7 rounded-full overflow-hidden border border-rose-500 shadow-xs shrink-0 bg-[#111214]">
                  <img src={livePreviewUrl} alt="Live Avatar Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <span>Drag to position • Scroll to zoom</span>
            </div>

            <button
              type="button"
              onClick={handleDoubleClick}
              className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer font-bold"
              title="Reset zoom & position"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white hover:bg-[#2b2d31] rounded-2xl transition-all cursor-pointer uppercase"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropAndSave}
            className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-2xl shadow-lg transition-all cursor-pointer uppercase"
          >
            <FaCheck className="w-3.5 h-3.5" />
            <span>Save Profile Photo</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
