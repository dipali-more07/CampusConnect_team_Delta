import React, { useState, useEffect, useCallback } from 'react'
import { X, Check } from 'lucide-react'

export default function ImageCropperModal({ 
  isOpen, 
  onClose, 
  imageSrc, 
  onCropComplete, 
  BRAND = '#615FFF',
  cropShape = 'rect', // 'round' | 'rect'
  cropTitle = 'Crop Poster'
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imgElement, setImgElement] = useState(null)

  const isRect = cropShape === 'rect'
  const CROP_WIDTH = isRect ? 340 : 260
  const CROP_HEIGHT = isRect ? 200 : 260

  // Reset state when image changes
  useEffect(() => {
    if (imageSrc) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = imageSrc
      img.onload = () => {
        setImgElement(img)
        setPan({ x: 0, y: 0 })
      }
    } else {
      setImgElement(null)
    }
  }, [imageSrc])

  // Mouse / Touch handlers for panning image inside crop area
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

  // Lightweight Crop & Export to base64 DataURL
  const handleCropSave = () => {
    if (!imgElement) return

    const canvas = document.createElement('canvas')
    const OUTPUT_WIDTH = isRect ? 800 : 300
    const OUTPUT_HEIGHT = isRect ? 450 : 300
    canvas.width = OUTPUT_WIDTH
    canvas.height = OUTPUT_HEIGHT
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    if (!isRect) {
      ctx.beginPath()
      ctx.arc(OUTPUT_WIDTH / 2, OUTPUT_HEIGHT / 2, OUTPUT_WIDTH / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
    }

    const scaleFactorX = OUTPUT_WIDTH / CROP_WIDTH
    const scaleFactorY = OUTPUT_HEIGHT / CROP_HEIGHT

    const baseScale = Math.max(CROP_WIDTH / imgElement.naturalWidth, CROP_HEIGHT / imgElement.naturalHeight)

    const drawWidth = imgElement.naturalWidth * baseScale * scaleFactorX
    const drawHeight = imgElement.naturalHeight * baseScale * scaleFactorY

    const drawX = (OUTPUT_WIDTH - drawWidth) / 2 + (pan.x * scaleFactorX)
    const drawY = (OUTPUT_HEIGHT - drawHeight) / 2 + (pan.y * scaleFactorY)

    ctx.drawImage(imgElement, drawX, drawY, drawWidth, drawHeight)

    const croppedDataUrl = canvas.toDataURL('image/png', 0.92)
    onCropComplete(croppedDataUrl)
    onClose()
  }

  if (!isOpen || !imageSrc) return null

  let imgStyle = { display: 'none' }
  if (imgElement) {
    const baseScale = Math.max(CROP_WIDTH / imgElement.naturalWidth, CROP_HEIGHT / imgElement.naturalHeight)
    const width = imgElement.naturalWidth * baseScale
    const height = imgElement.naturalHeight * baseScale

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
          <h3 className="text-base font-extrabold m-0 text-white">{cropTitle}</h3>
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
            className={`relative overflow-hidden ${isRect ? 'rounded-2xl' : 'rounded-full'} border-2 border-white/80 shadow-2xl flex items-center justify-center bg-black/40 touch-none cursor-grab active:cursor-grabbing`}
            style={{ width: `${CROP_WIDTH}px`, height: `${CROP_HEIGHT}px` }}
          >
            {imgElement && (
              <img
                src={imageSrc}
                alt="Crop preview"
                style={imgStyle}
                draggable={false}
              />
            )}
            <div className={`absolute inset-0 border border-white/30 ${isRect ? 'rounded-2xl' : 'rounded-full'} pointer-events-none`} />
          </div>

          <p className="text-[11.5px] text-slate-400 mt-3 font-semibold">
            Drag image to adjust crop position
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1b2b48]">
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
