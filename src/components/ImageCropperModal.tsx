import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Crop, ZoomIn, ZoomOut, RotateCw, Maximize2, Check, X, Image as ImageIcon, Sparkles, RefreshCw } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageUrl?: string;
  onCropComplete: (croppedDataUrl: string) => void;
}

type AspectRatio = '16:9' | '4:3' | '2:1' | '1:1' | 'free';

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  initialImageUrl = '',
  onCropComplete,
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or load initial URL
  useEffect(() => {
    if (isOpen) {
      if (initialImageUrl) {
        setImageSrc(initialImageUrl);
      } else {
        setImageSrc('');
        setLoadedImage(null);
      }
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, initialImageUrl]);

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      setLoadedImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImage(img);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.onerror = () => {
      // Fallback if CORS fails for external image URL
      console.warn("Failed to load cross-origin image for canvas editing");
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Get target aspect ratio numeric value
  const getAspectRatioNum = useCallback(() => {
    switch (aspectRatio) {
      case '16:9': return 16 / 9;
      case '4:3': return 4 / 3;
      case '2:1': return 2 / 1;
      case '1:1': return 1 / 1;
      case 'free':
      default:
        if (loadedImage) return loadedImage.width / loadedImage.height;
        return 16 / 9;
    }
  }, [aspectRatio, loadedImage]);

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset image fit and position
  const handleAutoFit = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  // Mouse / Touch Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Render crop preview onto canvas and get Data URL
  const generateCroppedImage = useCallback((targetWidth = 1200): string | null => {
    if (!loadedImage) return null;

    const targetRatio = getAspectRatioNum();
    const targetHeight = Math.round(targetWidth / targetRatio);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    ctx.save();
    // Move origin to canvas center
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate scale factors
    const baseScale = Math.max(
      targetWidth / (rotation % 180 === 0 ? loadedImage.width : loadedImage.height),
      targetHeight / (rotation % 180 === 0 ? loadedImage.height : loadedImage.width)
    );

    const totalScale = baseScale * zoom;

    const drawWidth = loadedImage.width * totalScale;
    const drawHeight = loadedImage.height * totalScale;

    // Apply offset
    const scaledOffsetX = (offset.x / 200) * targetWidth;
    const scaledOffsetY = (offset.y / 200) * targetHeight;

    ctx.drawImage(
      loadedImage,
      -drawWidth / 2 + scaledOffsetX,
      -drawHeight / 2 + scaledOffsetY,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.88);
  }, [loadedImage, getAspectRatioNum, rotation, zoom, offset]);

  // Live preview update
  useEffect(() => {
    if (loadedImage) {
      const cropped = generateCroppedImage(600);
      if (cropped) setPreviewUrl(cropped);
    }
  }, [loadedImage, zoom, rotation, offset, aspectRatio, generateCroppedImage]);

  // Handle Confirm
  const handleConfirm = () => {
    const finalDataUrl = generateCroppedImage(1200) || imageSrc;
    if (finalDataUrl) {
      onCropComplete(finalDataUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md transition-all animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>封面图裁切与自适应调优</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  高清生成
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">选择本地图片或调优已有封面，进行缩放、拖拽与比例裁剪</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Cropper / Viewport (Left) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {/* Aspect Ratio Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-zinc-400 uppercase mr-1">裁剪比例:</span>
              {[
                { id: '16:9', label: '16:9 标清横幅' },
                { id: '4:3', label: '4:3 卡片推荐' },
                { id: '2:1', label: '2:1 全宽 Header' },
                { id: '1:1', label: '1:1 正方形' },
                { id: 'free', label: '原图比例' },
              ].map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => setAspectRatio(ratio.id as AspectRatio)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                    aspectRatio === ratio.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>

            {/* Canvas Container / Interactive Drag Box */}
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative w-full h-[320px] sm:h-[380px] bg-zinc-950 rounded-lg border border-zinc-800/80 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none group"
            >
              {loadedImage ? (
                <>
                  {/* Outer Background Blur Layer */}
                  <img
                    src={imageSrc}
                    alt="background blur"
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-20 pointer-events-none scale-110"
                  />

                  {/* Main Transformed Image */}
                  <div
                    className="relative transition-transform ease-out duration-75 pointer-events-none"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                      maxHeight: '85%',
                      maxWidth: '85%'
                    }}
                  >
                    <img
                      src={imageSrc}
                      alt="Crop target"
                      className="max-h-[300px] max-w-full object-contain rounded-md shadow-2xl pointer-events-none"
                    />
                  </div>

                  {/* Crop Aspect Ratio Overlay Frame */}
                  <div
                    className="absolute border-2 border-indigo-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-none rounded-md flex items-center justify-center"
                    style={{
                      aspectRatio: `${getAspectRatioNum()}`,
                      maxHeight: '82%',
                      maxWidth: '88%',
                      width: aspectRatio === '1:1' ? '280px' : '92%'
                    }}
                  >
                    {/* Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-indigo-400/20 divide-x divide-y divide-indigo-400/20">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} />
                      ))}
                    </div>
                    {/* Corner Handles */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-indigo-500 rounded-full border border-white" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-indigo-500 rounded-full border border-white" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-indigo-500 rounded-full border border-white" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-indigo-500 rounded-full border border-white" />
                  </div>

                  {/* Drag Hint overlay */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-zinc-300 font-medium pointer-events-none flex items-center gap-1.5">
                    <Maximize2 className="w-3 h-3 text-indigo-400" />
                    <span>按住左键拖拽调整位置</span>
                  </div>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center space-y-3 text-center p-6 cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200">点击选择本地图片上传</p>
                    <p className="text-xs text-zinc-500 mt-1">支持 JPG, PNG, WEBP, GIF 等主流图片格式</p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md transition-colors"
                  >
                    浏览文件...
                  </button>
                </div>
              )}
            </div>

            {/* Controls Bar (Zoom, Rotate, AutoFit, Re-upload) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-800/60 rounded-lg border border-zinc-800">
              
              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  disabled={!loadedImage}
                  className="p-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
                  title="缩小"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  disabled={!loadedImage}
                  className="w-24 sm:w-32 accent-indigo-500 cursor-pointer disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  disabled={!loadedImage}
                  className="p-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
                  title="放大"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  disabled={!loadedImage}
                  className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 disabled:opacity-40"
                  title="旋转 90 度"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>旋转</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoFit}
                  disabled={!loadedImage}
                  className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 disabled:opacity-40"
                  title="重置居中"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>重置居中</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 flex items-center gap-1 border border-indigo-500/30"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>重新上传</span>
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Real-time Preview Side Panel (Right) */}
          <div className="lg:col-span-4 flex flex-col space-y-4 bg-zinc-950/80 p-4 rounded-lg border border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>裁切成品实效预览</span>
            </h4>

            {/* Card Cover Preview */}
            <div className="space-y-2">
              <span className="text-[11px] text-zinc-500 font-medium">1. 博客大图卡片效图:</span>
              <div className="w-full h-36 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 relative group shadow-lg">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Cropped Preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 text-xs">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                    <span>暂无裁剪图像</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2 p-2 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-bold line-clamp-1">
                  文章封面实效预览标题示例
                </div>
              </div>
            </div>

            {/* Small Thumbnail Preview */}
            <div className="space-y-2">
              <span className="text-[11px] text-zinc-500 font-medium">2. 文章列表侧边小图:</span>
              <div className="flex items-center gap-3 p-2.5 rounded-md bg-zinc-900 border border-zinc-800">
                <div className="w-16 h-12 bg-zinc-800 rounded-md overflow-hidden shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Thumb" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" />
                  )}
                </div>
                <div className="space-y-1 overflow-hidden">
                  <p className="text-xs font-bold text-zinc-200 truncate">文章摘要与全排版展示效果</p>
                  <p className="text-[10px] text-zinc-500 truncate">自动高清晰度调整，极致匹配网页布局</p>
                </div>
              </div>
            </div>

            {/* Quality Note */}
            <div className="p-3 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-indigo-400" />
                <span>智能画布高清压缩算法</span>
              </p>
              <p className="text-indigo-200/80">
                确认后将自动转换优化为高压缩比、高保真的矢量/位图画幅，直接应用于全站文库及 Hero 展板。
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            取消
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!loadedImage && !imageSrc}
            className="px-5 py-2.5 rounded-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>确认裁切并应用于封面</span>
          </button>
        </div>

      </div>
    </div>
  );
};
