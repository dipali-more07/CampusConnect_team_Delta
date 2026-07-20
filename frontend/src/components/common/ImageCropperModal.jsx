import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react'

export default function ImageCropperModal({ isOpen, onClose, imageSrc, onCropComplete, BRAND = '#615FFF' }) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imgElement, setImgElement] = useState(null)
  const canvasRef = useRef(null)

  const CROP_SIZE = 260 // Circular crop viewport diameter

  // Reset state when image changes
  useEffect(() => {
    if (imageSrc) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = imageSrc
      img.onload = () => {
        setImgElement(img)
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }
    } else {
      setImgElement(null)
    }
  }, [imageSrc])

  // Mouse / Touch handlers for panning image inside crop circle
  const handleMouseDown = (e) => {
    setIsDragging(true)
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y })
  }

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    })
  }, [isDragging, dragStart])

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleMouseMove)
      window.addEventListener('touchend', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, handleMouseMove])

  // Crop & Export to base64 DataURL
  const handleCropSave = () => {
    if (!imgElement) return

    const canvas = document.createElement('canvas')
    const OUTPUT_SIZE = 300 // Output dimensions 300x300 for crisp high-res avatar
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Draw circular clip
    ctx.beginPath()
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // Calculate aspect ratio scale between viewport CROP_SIZE and output size
    const scaleFactor = OUTPUT_SIZE / CROP_SIZE

    // Base dimensions of the image
    const minDim = Math.min(imgElement.naturalWidth, imgElement.naturalHeight) || 1
    const baseScale = CROP_SIZE / minDim

    const drawWidth = imgElement.naturalWidth * baseScale * zoom * scaleFactor
    const drawHeight = imgElement.naturalHeight * baseScale * zoom * scaleFactor

    const drawX = (OUTPUT_SIZE - drawWidth) / 2 + (pan.x * scaleFactor)
    const drawY = (OUTPUT_SIZE - drawHeight) / 2 + (pan.y * scaleFactor)

    ctx.drawImage(imgElement, drawX, drawY, drawWidth, drawHeight)

    const croppedDataUrl = canvas.toDataURL('image/png', 0.95)
    onCropComplete(croppedDataUrl)
    onClose()
  }

  if (!isOpen || !imageSrc) return null

  // Calculate style for viewport image preview
  let imgStyle = { display: 'none' }
  if (imgElement) {
    const minDim = Math.min(imgElement.naturalWidth, imgElement.naturalHeight) || 1
    const baseScale = CROP_SIZE / minDim
    const width = imgElement.naturalWidth * baseScale * zoom
    const height = imgElement.naturalHeight * baseScale * zoom

    imgStyle = {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${pan.x}px, ${pan.y}px)`,
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      pointerEvents: 'none'
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#0d1627] border border-[#1b2b48] shadow-2xl overflow-hidden p-6 text-white animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1b2b48]">
          <h3 className="text-base font-extrabold m-0 text-white">Crop Profile Photo</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1a2d48] border-none bg-transparent cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Interactive Crop Viewport */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            className="relative overflow-hidden rounded-full border-2 border-white/80 shadow-2xl flex items-center justify-center bg-black/40 touch-none cursor-grab active:cursor-grabbing"
            style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
          >
            {imgElement && (
              <img
                src={imageSrc}
                alt="Crop preview"
                style={imgStyle}
                draggable={false}
              />
            )}
            <div className="absolute inset-0 border border-white/30 rounded-full pointer-events-none" />
          </div>

          <p className="text-[11.5px] text-slate-400 mt-3 font-semibold">
            Drag photo to adjust position
          </p>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-3 bg-[#132238] p-3 rounded-2xl mb-6 border border-[#1e3252]">
          <button
            onClick={() => setZoom(z => Math.max(1, z - 0.15))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1c3050] bg-transparent border-none cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>

          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-indigo-500 cursor-pointer h-1.5 rounded-lg bg-[#22385c]"
          />

          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.15))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1c3050] bg-transparent border-none cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1c3050] bg-transparent border-none cursor-pointer ml-1"
            title="Reset Position"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#14233a] border border-[#213554] text-slate-300 hover:bg-[#1a2d48] cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleCropSave}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white border-none cursor-pointer shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            style={{ background: BRAND }}
          >
            <Check size={16} />
            <span>Crop & Save</span>
          </button>
        </div>

      </div>
    </div>
  )
}
