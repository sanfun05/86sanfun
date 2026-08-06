import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Compass, Maximize2, Minimize2, RotateCw, ZoomIn, ZoomOut, 
  Sparkles, Move, RefreshCw, Layers, MapPin, ChevronLeft, ChevronRight, 
  Sun, Moon, Eye, Image as ImageIcon, Navigation, HelpCircle
} from 'lucide-react';

export interface PanoramaScene {
  id: string;
  name: string;
  category?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  hotspots?: {
    id: string;
    lon: number;
    lat: number;
    targetSceneId: string;
    label: string;
  }[];
}

interface PanoramaViewerProps {
  imageUrl?: string;
  caption?: string;
  height?: string;
  autoRotateDefault?: boolean;
  scenes?: PanoramaScene[];
}

const DEFAULT_PANORAMA_SCENES: PanoramaScene[] = [
  {
    id: 'cyber-lab',
    name: '赛博极客工作站',
    category: '科技空间',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=2000',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=300',
    hotspots: [
      { id: 'h1', lon: 45, lat: -5, targetSceneId: 'art-gallery', label: '前往 艺术展厅 ➔' },
      { id: 'h2', lon: -120, lat: -10, targetSceneId: 'modern-villa', label: '前往 极简客厅 ➔' }
    ]
  },
  {
    id: 'art-gallery',
    name: '现代艺术展览馆',
    category: '文化展厅',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2000',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=300',
    hotspots: [
      { id: 'h3', lon: -30, lat: -2, targetSceneId: 'cyber-lab', label: '返回 工作站 ➔' },
      { id: 'h4', lon: 135, lat: -8, targetSceneId: 'outdoor-peak', label: '前往 露天广场 ➔' }
    ]
  },
  {
    id: 'modern-villa',
    name: 'Bento 极简豪宅客厅',
    category: '建筑室内',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=300',
    hotspots: [
      { id: 'h5', lon: 80, lat: -6, targetSceneId: 'cyber-lab', label: '前往 工作站 ➔' },
      { id: 'h6', lon: -90, lat: -12, targetSceneId: 'outdoor-peak', label: '前往 露天山顶 ➔' }
    ]
  },
  {
    id: 'outdoor-peak',
    name: '山顶露天全景广角',
    category: '户外风光',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=2000',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=300',
    hotspots: [
      { id: 'h7', lon: -40, lat: -15, targetSceneId: 'art-gallery', label: '进入 艺术展厅 ➔' }
    ]
  }
];

export const PanoramaViewer: React.FC<PanoramaViewerProps> = ({
  imageUrl,
  caption = '360° 交互式全景环视 & 室内漫游',
  height = '480px',
  autoRotateDefault = true,
  scenes
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Merge custom scenes or generate default list
  const activeSceneList = React.useMemo(() => {
    if (scenes && scenes.length > 0) return scenes;
    if (imageUrl) {
      const customScene: PanoramaScene = {
        id: 'custom-scene-1',
        name: caption || '自定义 360° 全景图',
        category: '当前文章全景',
        imageUrl: imageUrl,
        thumbnailUrl: imageUrl,
        hotspots: [
          { id: 'h-custom-1', lon: 60, lat: -5, targetSceneId: 'cyber-lab', label: '漫游至 极客工作站 ➔' }
        ]
      };
      return [customScene, ...DEFAULT_PANORAMA_SCENES];
    }
    return DEFAULT_PANORAMA_SCENES;
  }, [imageUrl, caption, scenes]);

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const currentScene = activeSceneList[currentSceneIndex] || activeSceneList[0];

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(autoRotateDefault);
  const [hdrExposure, setHdrExposure] = useState<'day' | 'night' | 'hdr'>('hdr');
  const [fov, setFov] = useState(75);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [hotspotPositions, setHotspotPositions] = useState<{ id: string; x: number; y: number; label: string; targetSceneId: string; visible: boolean }[]>([]);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  // Interaction refs
  const isUserInteractingRef = useRef(false);
  const onPointerDownPointerXRef = useRef(0);
  const onPointerDownPointerYRef = useRef(0);
  const onPointerDownLonRef = useRef(0);
  const onPointerDownLatRef = useRef(0);
  const lonRef = useRef(0);
  const latRef = useRef(0);
  const autoRotateRef = useRef(autoRotateDefault);

  useEffect(() => {
    autoRotateRef.current = isAutoRotate;
  }, [isAutoRotate]);

  // Fallback Procedural Canvas Panorama generator
  const createProceduralPanoramaTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.4, '#1e1b4b');
    gradient.addColorStop(0.7, '#311b92');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.lineWidth = 2;
    for (let x = 0; x < canvas.width; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(`360° HDR 全景漫游 - ${currentScene.name}`, canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '22px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('◄ 滑动鼠标拖拽 360° 漫游 | 点击底栏或空间热点传送门切换场景 ►', canvas.width / 2, canvas.height / 2 + 30);

    return new THREE.CanvasTexture(canvas);
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const heightPx = containerRef.current.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(fov, width / heightPx, 1, 1100);
    cameraRef.current = camera;

    // Inverted Sphere for 360 panorama
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    // Texture Loading
    const textureLoader = new THREE.TextureLoader();
    let isCancelled = false;

    setIsLoading(true);
    setLoadError(false);

    textureLoader.load(
      currentScene.imageUrl,
      (texture) => {
        if (isCancelled) return;
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        meshRef.current = mesh;
        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.warn('Failed to load scene panorama texture, using procedural fallback.', err);
        if (isCancelled) return;
        const fallbackTexture = createProceduralPanoramaTexture();
        const material = new THREE.MeshBasicMaterial({ map: fallbackTexture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        meshRef.current = mesh;
        setIsLoading(false);
        setLoadError(true);
      }
    );

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, heightPx);
    rendererRef.current = renderer;

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotateRef.current && !isUserInteractingRef.current) {
        lonRef.current += 0.1;
      }

      latRef.current = Math.max(-85, Math.min(85, latRef.current));
      const phi = THREE.MathUtils.degToRad(90 - latRef.current);
      const theta = THREE.MathUtils.degToRad(lonRef.current);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(targetX, targetY, targetZ);
      renderer.render(scene, camera);

      // Calculate Screen 2D positions for Hotspots
      if (currentScene.hotspots && containerRef.current && cameraRef.current) {
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;

        const calculatedHotspots = currentScene.hotspots.map((spot) => {
          const spotPhi = THREE.MathUtils.degToRad(90 - spot.lat);
          const spotTheta = THREE.MathUtils.degToRad(spot.lon);

          const spotVector = new THREE.Vector3(
            450 * Math.sin(spotPhi) * Math.cos(spotTheta),
            450 * Math.cos(spotPhi),
            450 * Math.sin(spotPhi) * Math.sin(spotTheta)
          );

          // Check if in front of camera
          const camDir = new THREE.Vector3();
          camera.getWorldDirection(camDir);
          const isFront = spotVector.dot(camDir) > 0;

          spotVector.project(camera);
          const screenX = (spotVector.x * 0.5 + 0.5) * containerW;
          const screenY = (-(spotVector.y * 0.5) + 0.5) * containerH;

          return {
            id: spot.id,
            x: screenX,
            y: screenY,
            label: spot.label,
            targetSceneId: spot.targetSceneId,
            visible: isFront && spotVector.z < 1
          };
        });

        setHotspotPositions(calculatedHotspots);
      }

      // Compass Degree
      const currentDeg = Math.round(((lonRef.current % 360) + 360) % 360);
      setRotationAngle(currentDeg);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;

      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
    };
  }, [currentSceneIndex]);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.fov = fov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [fov]);

  // Pointer Interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    isUserInteractingRef.current = true;
    onPointerDownPointerXRef.current = e.clientX;
    onPointerDownPointerYRef.current = e.clientY;
    onPointerDownLonRef.current = lonRef.current;
    onPointerDownLatRef.current = latRef.current;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isUserInteractingRef.current) return;
    lonRef.current = (onPointerDownPointerXRef.current - e.clientX) * 0.15 + onPointerDownLonRef.current;
    latRef.current = (e.clientY - onPointerDownPointerYRef.current) * 0.15 + onPointerDownLatRef.current;
  };

  const handlePointerUp = () => {
    isUserInteractingRef.current = false;
  };

  const switchSceneById = (sceneId: string) => {
    const idx = activeSceneList.findIndex(s => s.id === sceneId);
    if (idx !== -1) {
      setCurrentSceneIndex(idx);
    }
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullScreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false));
    }
  };

  const resetView = () => {
    lonRef.current = 0;
    latRef.current = 0;
    setFov(75);
  };

  // Filter effect based on exposure
  const hdrFilterStyle = {
    day: 'brightness(1.15) contrast(1.05)',
    night: 'brightness(0.8) contrast(1.2) hue-rotate(10deg)',
    hdr: 'brightness(1.05) contrast(1.1) saturate(1.2)'
  };

  return (
    <div 
      ref={containerRef}
      style={{ height: isFullScreen ? '100vh' : height }}
      className="relative my-6 w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl select-none group flex flex-col"
    >
      {/* Three.js Canvas */}
      <div className="relative w-full h-full flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ filter: hdrFilterStyle[hdrExposure] }}
          className="w-full h-full cursor-grab active:cursor-grabbing block transition-[filter] duration-500"
        />

        {/* Floating Interactive 3D Hotspot Portals */}
        {hotspotPositions.map((spot) => (
          spot.visible && (
            <button
              key={spot.id}
              type="button"
              onClick={() => switchSceneById(spot.targetSceneId)}
              style={{
                left: `${spot.x}px`,
                top: `${spot.y}px`,
                transform: 'translate(-50%, -50%)'
              }}
              className="absolute z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white font-bold text-xs shadow-xl border border-white/30 backdrop-blur-md animate-pulse hover:animate-none transition-all hover:scale-110 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-300" />
              <span>{spot.label}</span>
            </button>
          )
        ))}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-md text-white space-y-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono font-bold tracking-wide">
              正在全景加载 HDR 空间纹理: {currentScene.name}...
            </p>
          </div>
        )}

        {/* Top Title & Scene Navigation Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-2">
          
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/15 text-white pointer-events-auto shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-bold truncate max-w-[180px] sm:max-w-xs">{currentScene.name}</span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {currentScene.category || '360° HDR 漫游'} ({currentSceneIndex + 1}/{activeSceneList.length})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* HDR Tone Switcher */}
            <div className="flex items-center bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/15 text-xs text-white shadow-lg">
              <button
                type="button"
                onClick={() => setHdrExposure('hdr')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                  hdrExposure === 'hdr' ? 'bg-amber-500 text-black shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
                title="HDR 渲染色彩增强"
              >
                HDR
              </button>
              <button
                type="button"
                onClick={() => setHdrExposure('day')}
                className={`p-1.5 rounded-md transition-all ${
                  hdrExposure === 'day' ? 'bg-blue-500 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
                title="高亮阳光模式"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setHdrExposure('night')}
                className={`p-1.5 rounded-md transition-all ${
                  hdrExposure === 'night' ? 'bg-purple-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
                title="赛博夜景氛围"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Compass Info */}
            <div className="hidden sm:flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-xs font-mono text-zinc-300 shadow-lg">
              <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span>{rotationAngle}°</span>
            </div>
          </div>

        </div>

        {/* Drag Hint */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-60 group-hover:opacity-0 transition-opacity duration-300">
          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/15 text-white text-xs font-medium flex items-center gap-2">
            <Move className="w-4 h-4 text-blue-400" />
            <span>按住鼠标拖拽 | 点击红蓝色热点传送门自由巡航</span>
          </div>
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-white shadow-2xl">
          
          {/* Toggle Scene Thumbnails Bar */}
          <button
            type="button"
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-2 rounded-md transition-all ${
              showThumbnails ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-zinc-300'
            }`}
            title="室内多场景巡航切换栏"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Auto Rotate Toggle */}
          <button
            type="button"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`p-2 rounded-md transition-all ${
              isAutoRotate ? 'bg-amber-500 text-black font-bold' : 'hover:bg-white/10 text-zinc-300'
            }`}
            title={isAutoRotate ? '暂停自动巡航' : '开启自动巡航'}
          >
            <RotateCw className={`w-4 h-4 ${isAutoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setFov(prev => Math.max(30, prev - 10))}
            className="p-2 rounded-md hover:bg-white/10 text-zinc-300 transition-colors"
            title="拉近视角 (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setFov(prev => Math.min(100, prev + 10))}
            className="p-2 rounded-md hover:bg-white/10 text-zinc-300 transition-colors"
            title="拉远视角 (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Reset View */}
          <button
            type="button"
            onClick={resetView}
            className="p-2 rounded-md hover:bg-white/10 text-zinc-300 transition-colors"
            title="复位视角"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullScreen}
            className="p-2 rounded-md hover:bg-white/10 text-zinc-300 transition-colors"
            title="沉浸全屏模式"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

        </div>
      </div>

      {/* MULTI-SCENE CAROUSEL ROOM SWITCHER (Bottom Bar) */}
      {showThumbnails && (
        <div className="p-3 bg-zinc-950/95 border-t border-zinc-800 z-20 flex items-center gap-3 overflow-x-auto scrollbar-none animate-in slide-in-from-bottom duration-200">
          <span className="text-[11px] font-bold text-zinc-400 whitespace-nowrap flex items-center gap-1 shrink-0 pl-1">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>室内多节点巡航:</span>
          </span>

          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            {activeSceneList.map((scene, idx) => {
              const isActive = idx === currentSceneIndex;
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setCurrentSceneIndex(idx)}
                  className={`group relative flex items-center gap-2 p-1.5 pr-3 rounded-md border text-left transition-all shrink-0 ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/20 text-white font-bold ring-2 ring-blue-500/30'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <img
                    src={scene.thumbnailUrl || scene.imageUrl}
                    alt={scene.name}
                    className="w-8 h-8 rounded-md object-cover border border-white/10"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs truncate max-w-[110px]">{scene.name}</span>
                    <span className="text-[9px] text-zinc-500 group-hover:text-zinc-400">
                      {scene.category || '房间场景'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
