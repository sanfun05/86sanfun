import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Box, Maximize2, Minimize2, RotateCw, Sparkles, Layers, Eye, 
  ExternalLink, FileText, RefreshCw, Palette, Cpu, Shield, Download,
  Sliders, Move3D, Compass, ZoomIn, ZoomOut, Check, Info, FileCode, Search,
  ChevronRight, ChevronLeft, LayoutGrid, Scissors, Disc
} from 'lucide-react';

interface ThreeDViewerProps {
  src?: string;
  title?: string;
  format?: 'gltf' | '3dpdf' | 'procedural' | 'iframe';
  height?: string;
  pdfUrl?: string;
}

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({
  src,
  title = '3D 交互模型与 3D PDF 在线体验',
  format = 'procedural',
  height = '500px',
  pdfUrl
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render & Lighting Modes
  const [renderMode, setRenderMode] = useState<'solid' | 'wireframe' | 'xray' | 'explode'>('solid');
  const [lightingPreset, setLightingPreset] = useState<'studio' | 'cyber' | 'industrial' | 'sunset'>('studio');
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(1.0);
  const [explodeDistance, setExplodeDistance] = useState(0);

  // Active Tab: 3D Model vs 3D PDF Online Reader
  const [activeTab, setActiveTab] = useState<'model' | '3dpdf' | 'structure'>('model');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentPresetShape, setCurrentPresetShape] = useState<'robot' | 'architecture' | 'gear' | 'molecule'>('robot');

  // Inspection & Part Hotspot State
  const [selectedPart, setSelectedPart] = useState<{ id: string; name: string; desc: string; spec: string } | null>({
    id: 'p1',
    name: '六轴高速伺服电机',
    desc: '高精度无刷闭环伺服马达，提供 120Nm 额定扭矩与 0.01mm 定位精度',
    spec: '电压: 48V DC | 功率: 750W | 防护: IP67'
  });

  // 3D PDF Online Canvas Viewer States
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfLayer, setPdfLayer] = useState<'all' | 'cad' | 'dimensions'>('all');
  const [pdfCutSection, setPdfCutSection] = useState(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const partsMeshMapRef = useRef<{ [key: string]: THREE.Object3D }>({});

  // Interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Procedural 3D Mesh Creator with individual Parts for Explode & Inspection
  const createProcedural3DScene = (type: 'robot' | 'architecture' | 'gear' | 'molecule') => {
    const group = new THREE.Group();
    partsMeshMapRef.current = {};

    if (type === 'robot') {
      // Base Cylinder
      const baseGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.6, 32);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.8, roughness: 0.2 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.name = 'base';
      group.add(base);
      partsMeshMapRef.current['base'] = base;

      // Joint 1 Servo
      const joint1Geo = new THREE.SphereGeometry(1.0, 32, 16);
      const joint1Mat = new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.9, roughness: 0.1 });
      const joint1 = new THREE.Mesh(joint1Geo, joint1Mat);
      joint1.position.y = 0.8;
      joint1.name = 'motor';
      group.add(joint1);
      partsMeshMapRef.current['motor'] = joint1;

      // Arm 1
      const arm1Geo = new THREE.BoxGeometry(0.6, 2.8, 0.6);
      const arm1Mat = new THREE.MeshStandardMaterial({ color: 0xe0e7ff, metalness: 0.5, roughness: 0.3 });
      const arm1 = new THREE.Mesh(arm1Geo, arm1Mat);
      arm1.position.set(0, 2.2, 0);
      arm1.rotation.z = -0.3;
      arm1.name = 'arm';
      group.add(arm1);
      partsMeshMapRef.current['arm'] = arm1;

      // Claw Gripper
      const clawGeo = new THREE.TorusGeometry(0.8, 0.12, 16, 32, Math.PI);
      const clawMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set(0.8, 3.4, 0);
      claw.rotation.x = Math.PI / 2;
      claw.name = 'claw';
      group.add(claw);
      partsMeshMapRef.current['claw'] = claw;

      // Glowing Core
      const coreGeo = new THREE.IcosahedronGeometry(0.5, 2);
      const coreMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.8 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0, 0.8, 0);
      core.name = 'core';
      group.add(core);
      partsMeshMapRef.current['core'] = core;

    } else if (type === 'architecture') {
      const mainBuildingGeo = new THREE.BoxGeometry(3, 2, 3);
      const mainMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.2, roughness: 0.1 });
      const building = new THREE.Mesh(mainBuildingGeo, mainMat);
      building.position.y = 1;
      building.name = 'building';
      group.add(building);
      partsMeshMapRef.current['building'] = building;

      const roofGeo = new THREE.ConeGeometry(2.5, 1.5, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, metalness: 0.9 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 2.75;
      roof.rotation.y = Math.PI / 4;
      roof.name = 'roof';
      group.add(roof);
      partsMeshMapRef.current['roof'] = roof;

      const balconyGeo = new THREE.BoxGeometry(3.6, 0.2, 1.5);
      const balconyMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.6 });
      const balcony = new THREE.Mesh(balconyGeo, balconyMat);
      balcony.position.set(0, 1.2, 1.2);
      balcony.name = 'balcony';
      group.add(balcony);
      partsMeshMapRef.current['balcony'] = balcony;

    } else if (type === 'gear') {
      const ringGeo = new THREE.TorusGeometry(2.0, 0.4, 16, 100);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.95, roughness: 0.1 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'ring';
      group.add(ring);
      partsMeshMapRef.current['ring'] = ring;

      for (let i = 0; i < 12; i++) {
        const toothGeo = new THREE.BoxGeometry(0.4, 0.8, 0.4);
        const toothMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.8 });
        const tooth = new THREE.Mesh(toothGeo, toothMat);
        const angle = (i / 12) * Math.PI * 2;
        tooth.position.set(2.2 * Math.cos(angle), 2.2 * Math.sin(angle), 0);
        tooth.rotation.z = angle;
        tooth.name = `tooth_${i}`;
        group.add(tooth);
      }

      const axisGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 32);
      const axisMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9 });
      const axis = new THREE.Mesh(axisGeo, axisMat);
      axis.rotation.x = Math.PI / 2;
      axis.name = 'axis';
      group.add(axis);
      partsMeshMapRef.current['axis'] = axis;

    } else {
      const centerGeo = new THREE.SphereGeometry(1.2, 32, 32);
      const centerMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.2, metalness: 0.5 });
      const center = new THREE.Mesh(centerGeo, centerMat);
      center.name = 'center';
      group.add(center);

      const positions = [[2, 2, 2], [-2, 2, -2], [2, -2, -2], [-2, -2, 2]];
      positions.forEach(([x, y, z], idx) => {
        const nodeGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const nodeMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        node.position.set(x, y, z);
        node.name = `node_${idx}`;
        group.add(node);
      });
    }

    return group;
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || activeTab !== 'model') return;

    const width = containerRef.current.clientWidth || 600;
    const heightPx = containerRef.current.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / heightPx, 0.1, 1000);
    camera.position.set(0, 2.5, 6.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, heightPx);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Lighting Presets
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    if (lightingPreset === 'cyber') {
      dirLight1.color.setHex(0xec4899);
      dirLight2.color.setHex(0x3b82f6);
    } else if (lightingPreset === 'sunset') {
      dirLight1.color.setHex(0xf59e0b);
      dirLight2.color.setHex(0xef4444);
    } else if (lightingPreset === 'industrial') {
      dirLight1.color.setHex(0x94a3b8);
      dirLight2.color.setHex(0x475569);
    }

    // Grid Floor
    const gridHelper = new THREE.GridHelper(12, 20, 0x3b82f6, 0x334155);
    gridHelper.position.y = -1.8;
    scene.add(gridHelper);

    // Main 3D Model Group
    const mainGroup = createProcedural3DScene(currentPresetShape);
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (mainGroupRef.current) {
        if (isAutoRotate && !isDraggingRef.current) {
          mainGroupRef.current.rotation.y += 0.008 * autoRotateSpeed;
        }

        // Apply Explode & Render Modes
        mainGroupRef.current.children.forEach((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mat = mesh.material as THREE.MeshStandardMaterial;

            if (mat) {
              if (renderMode === 'wireframe') {
                mat.wireframe = true;
                mat.transparent = false;
                mat.opacity = 1.0;
              } else if (renderMode === 'xray') {
                mat.wireframe = false;
                mat.transparent = true;
                mat.opacity = 0.45;
              } else {
                mat.wireframe = false;
                mat.transparent = false;
                mat.opacity = 1.0;
              }
            }

            // Explode offset along local position
            if (renderMode === 'explode' || explodeDistance > 0) {
              const expFactor = renderMode === 'explode' ? 1.5 : explodeDistance;
              if (mesh.name === 'claw') mesh.position.set(0.8 + expFactor * 0.8, 3.4 + expFactor * 0.5, 0);
              if (mesh.name === 'arm') mesh.position.set(0, 2.2 + expFactor * 0.6, 0);
              if (mesh.name === 'motor') mesh.position.set(0, 0.8 + expFactor * 0.3, 0);
              if (mesh.name === 'roof') mesh.position.set(0, 2.75 + expFactor * 0.8, 0);
              if (mesh.name === 'balcony') mesh.position.set(0, 1.2, 1.2 + expFactor * 0.8);
            } else {
              // Reset positions
              if (mesh.name === 'claw') mesh.position.set(0.8, 3.4, 0);
              if (mesh.name === 'arm') mesh.position.set(0, 2.2, 0);
              if (mesh.name === 'motor') mesh.position.set(0, 0.8, 0);
              if (mesh.name === 'roof') mesh.position.set(0, 2.75, 0);
              if (mesh.name === 'balcony') mesh.position.set(0, 1.2, 1.2);
            }
          }
        });
      }

      renderer.render(scene, camera);
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
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [currentPresetShape, renderMode, lightingPreset, activeTab, autoRotateSpeed, explodeDistance]);

  // Mouse & Touch Orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !mainGroupRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    mainGroupRef.current.rotation.y += deltaX * 0.01;
    mainGroupRef.current.rotation.x += deltaY * 0.01;

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !mainGroupRef.current || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
    const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

    mainGroupRef.current.rotation.y += deltaX * 0.01;
    mainGroupRef.current.rotation.x += deltaY * 0.01;

    previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Preset Camera Angles
  const setCameraPresetAngle = (preset: 'iso' | 'top' | 'front' | 'side') => {
    if (!cameraRef.current || !mainGroupRef.current) return;
    mainGroupRef.current.rotation.set(0, 0, 0);

    if (preset === 'top') {
      cameraRef.current.position.set(0, 7.5, 0.1);
    } else if (preset === 'front') {
      cameraRef.current.position.set(0, 1.5, 7.0);
    } else if (preset === 'side') {
      cameraRef.current.position.set(7.0, 1.5, 0);
    } else {
      cameraRef.current.position.set(4.5, 4.5, 5.5);
    }
    cameraRef.current.lookAt(0, 0, 0);
  };

  const reset3DView = () => {
    if (mainGroupRef.current) mainGroupRef.current.rotation.set(0, 0, 0);
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 2.5, 6.5);
      cameraRef.current.lookAt(0, 0, 0);
    }
    setExplodeDistance(0);
    setRenderMode('solid');
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullScreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false));
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{ height: isFullScreen ? '100vh' : height }}
      className="relative my-6 w-full rounded-xl overflow-hidden bg-zinc-950 text-white border border-zinc-800 shadow-2xl transition-colors duration-300 select-none flex flex-col"
    >
      {/* Top Header Controls Bar */}
      <div className="p-3 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
        
        {/* Title & Badge */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Box className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold truncate max-w-xs">{title}</h4>
            <p className="text-[10px] text-zinc-400 font-mono">
              Web 3D & 3D PDF 在线预览引擎 (No Plugins Required)
            </p>
          </div>
        </div>

        {/* Tab Switcher: 3D Model View vs 3D PDF Online Spec Reader */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/60 border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('model')}
            className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
              activeTab === 'model'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Web 3D 交互模型</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('3dpdf')}
            className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
              activeTab === '3dpdf'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3D PDF 手册 (免插件)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
              activeTab === 'structure'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>BOM 结构树明细</span>
          </button>
        </div>

      </div>

      {/* Main View Area */}
      <div className="relative flex-1 w-full overflow-hidden flex flex-col md:flex-row">
        
        {/* TAB 1: WEB 3D MODEL CANVAS VIEW */}
        {activeTab === 'model' && (
          <div className="relative w-full h-full flex-1 flex flex-col items-center justify-center">
            
            {/* Three.js Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
            />

            {/* Model Preset Picker & Camera Angles (Top Left) */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
              <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-lg border border-white/10 text-[11px]">
                <span className="px-1.5 text-zinc-400 font-bold">预设:</span>
                <button
                  type="button"
                  onClick={() => setCurrentPresetShape('robot')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    currentPresetShape === 'robot' ? 'bg-blue-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🤖 六轴机械臂
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPresetShape('architecture')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    currentPresetShape === 'architecture' ? 'bg-blue-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🏛️ Bento 建筑
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPresetShape('gear')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    currentPresetShape === 'gear' ? 'bg-blue-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ⚙️ 传动齿轮
                </button>
              </div>

              {/* Camera Angle Presets */}
              <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-lg border border-white/10 text-[10px] text-zinc-300">
                <span className="px-1 text-zinc-400">视角:</span>
                <button type="button" onClick={() => setCameraPresetAngle('iso')} className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700">ISO 等轴</button>
                <button type="button" onClick={() => setCameraPresetAngle('top')} className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700">顶视</button>
                <button type="button" onClick={() => setCameraPresetAngle('front')} className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700">正视</button>
                <button type="button" onClick={() => setCameraPresetAngle('side')} className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700">侧视</button>
              </div>
            </div>

            {/* Selected Component Spec Callout Card (Top Right) */}
            {selectedPart && (
              <div className="absolute top-3 right-3 z-10 max-w-xs p-3 rounded-lg bg-black/80 backdrop-blur-md border border-blue-500/30 text-xs space-y-1.5 shadow-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="font-bold text-blue-400 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{selectedPart.name}</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">零件选定</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">{selectedPart.desc}</p>
                <div className="text-[10px] text-zinc-400 font-mono bg-zinc-900/90 p-1.5 rounded-md border border-zinc-800">
                  {selectedPart.spec}
                </div>
              </div>
            )}

            {/* Bottom 3D Toolbar Controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-wrap items-center gap-1.5 bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-lg border border-white/20 text-white shadow-2xl">
              
              {/* Render Modes Selector */}
              <div className="flex items-center gap-1 p-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setRenderMode('solid')}
                  className={`px-2.5 py-1 rounded-xs text-[11px] font-bold transition-all ${
                    renderMode === 'solid' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  实体 PBR
                </button>
                <button
                  type="button"
                  onClick={() => setRenderMode('wireframe')}
                  className={`px-2.5 py-1 rounded-xs text-[11px] font-bold transition-all ${
                    renderMode === 'wireframe' ? 'bg-amber-500 text-black shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  网格线框
                </button>
                <button
                  type="button"
                  onClick={() => setRenderMode('xray')}
                  className={`px-2.5 py-1 rounded-xs text-[11px] font-bold transition-all ${
                    renderMode === 'xray' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  射线 X-Ray
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRenderMode(renderMode === 'explode' ? 'solid' : 'explode');
                  }}
                  className={`px-2.5 py-1 rounded-xs text-[11px] font-bold transition-all ${
                    renderMode === 'explode' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  爆炸拆解
                </button>
              </div>

              <div className="w-px h-4 bg-white/20 mx-0.5" />

              {/* Lighting Preset Switcher */}
              <button
                type="button"
                onClick={() => {
                  const presets: ('studio' | 'cyber' | 'industrial' | 'sunset')[] = ['studio', 'cyber', 'industrial', 'sunset'];
                  const nextIdx = (presets.indexOf(lightingPreset) + 1) % presets.length;
                  setLightingPreset(presets[nextIdx]);
                }}
                className="p-2 rounded-md hover:bg-white/10 text-zinc-300 transition-colors flex items-center gap-1 text-xs"
                title="切换环境灯光渲染"
              >
                <Palette className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline text-[10px] font-mono capitalize">{lightingPreset}</span>
              </button>

              {/* Auto Rotate Toggle */}
              <button
                type="button"
                onClick={() => setIsAutoRotate(!isAutoRotate)}
                className={`p-2 rounded-md transition-all ${
                  isAutoRotate ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-zinc-400'
                }`}
                title="360° 自动转动"
              >
                <RotateCw className={`w-4 h-4 ${isAutoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
              </button>

              {/* Reset View */}
              <button
                type="button"
                onClick={reset3DView}
                className="p-2 rounded-md hover:bg-white/10 text-zinc-300 transition-colors"
                title="复位 3D 视角"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={toggleFullScreen}
                className="p-2 rounded-md hover:bg-white/10 text-zinc-300 transition-colors"
                title="沉浸全屏"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

            </div>
          </div>
        )}

        {/* TAB 2: ONLINE 3D PDF / CAD VECTOR SHEET READER (NO PLUGINS NEEDED) */}
        {activeTab === '3dpdf' && (
          <div className="w-full h-full flex-1 flex flex-col bg-zinc-950 overflow-hidden">
            
            {/* 3D PDF Interactive Control Toolbar */}
            <div className="p-2.5 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-400 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>3D PDF 交互式渲染画布:</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Vector Engine Ready
                </span>
              </div>

              {/* PDF Reader Controls */}
              <div className="flex items-center gap-1.5">
                
                {/* Zoom */}
                <div className="flex items-center bg-zinc-800 rounded-lg p-0.5 border border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setPdfZoom(prev => Math.max(50, prev - 25))}
                    className="p-1 hover:bg-zinc-700 rounded-md text-zinc-300"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono text-[11px] text-zinc-200">{pdfZoom}%</span>
                  <button
                    type="button"
                    onClick={() => setPdfZoom(prev => Math.min(200, prev + 25))}
                    className="p-1 hover:bg-zinc-700 rounded-md text-zinc-300"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Section Cut Toggle */}
                <button
                  type="button"
                  onClick={() => setPdfCutSection(!pdfCutSection)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    pdfCutSection ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>工程剖切视图</span>
                </button>

                {/* Layer Selector */}
                <select
                  value={pdfLayer}
                  onChange={(e) => setPdfLayer(e.target.value as any)}
                  className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="all">全图层显示 (All Layers)</option>
                  <option value="cad">仅 CAD 矢量结构线</option>
                  <option value="dimensions">仅 尺寸标注与形位公差</option>
                </select>

                <a
                  href={pdfUrl || src || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1"
                  title="下载 / 外部查看原文件"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">导出 PDF</span>
                </a>
              </div>

            </div>

            {/* Embedded Interactive 3D PDF Drawing Rendering Area */}
            <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-zinc-900/60 relative">
              
              <div 
                style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'center center' }}
                className="w-full max-w-3xl bg-slate-900 border-2 border-purple-500/40 rounded-xl p-6 shadow-2xl text-slate-100 space-y-6 transition-transform duration-200"
              >
                {/* CAD Drawing Header Title Box */}
                <div className="border-b-2 border-purple-500/50 pb-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-300 font-mono text-[10px] font-bold">
                        ISO 2768-mK
                      </span>
                      <h3 className="text-base font-bold tracking-wide text-white">
                        {title} - 三维工程尺寸规程图纸
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      CAD Document ID: #PDF-3D-2026-X8 | 比例 1:1 | 投影: 第一视角
                    </p>
                  </div>

                  <div className="text-right font-mono text-[11px] text-slate-400">
                    <div>页码: {pdfPage} / 3</div>
                    <div className="text-emerald-400 font-bold">● 在线免插件矢量渲染</div>
                  </div>
                </div>

                {/* Simulated Interactive CAD 3D Vector Viewport */}
                <div className="relative h-64 rounded-lg bg-slate-950 border border-slate-800 p-4 flex items-center justify-between font-mono text-xs overflow-hidden">
                  
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

                  {/* Section Cut Visual Bar if enabled */}
                  {pdfCutSection && (
                    <div className="absolute inset-y-0 left-1/2 w-1 bg-purple-500/80 shadow-[0_0_12px_#a855f7] z-10 flex items-center justify-center">
                      <span className="bg-purple-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">A-A 剖面</span>
                    </div>
                  )}

                  {/* Vector Drawing Content */}
                  <div className="z-10 space-y-2">
                    <div className="text-amber-400 font-bold flex items-center gap-1">
                      <Compass className="w-4 h-4" />
                      <span>[视图 A] 伺服电机外壳剖面 (Section A-A)</span>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div>├─ 轴承外径: ∅ 42.00mm (+0.015 / -0.005)</div>
                      <div>├─ 法兰安装孔距: 60.00mm ±0.05</div>
                      <div>└─ 材质: A356 高强度发黑铝合金</div>
                    </div>
                  </div>

                  {/* Interactive Dimension Markers */}
                  {(pdfLayer === 'all' || pdfLayer === 'dimensions') && (
                    <div className="z-10 text-right space-y-2">
                      <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-200">
                        <span className="text-[10px] text-purple-400 block">形位公差注解:</span>
                        <span className="font-bold">⌖ 垂直度 0.02 A</span>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-200">
                        <span className="text-[10px] text-blue-400 block">同轴度:</span>
                        <span className="font-bold">◎ 0.015 B</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* CAD Title Block Footer */}
                <div className="grid grid-cols-4 gap-2 border-t-2 border-purple-500/50 pt-4 text-[11px] font-mono text-slate-400">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="block text-[9px] text-slate-500">设计工程师</span>
                    <span className="font-bold text-slate-200">Bento CAD Studio</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="block text-[9px] text-slate-500">审核状态</span>
                    <span className="font-bold text-emerald-400">✓ 最终量产核准</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="block text-[9px] text-slate-500">公差标准</span>
                    <span className="font-bold text-slate-200">ISO 2768-mK</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={pdfPage <= 1}
                      onClick={() => setPdfPage(prev => Math.max(1, prev - 1))}
                      className="p-1 hover:bg-slate-800 rounded disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-purple-300">P{pdfPage}</span>
                    <button
                      type="button"
                      disabled={pdfPage >= 3}
                      onClick={() => setPdfPage(prev => Math.min(3, prev + 1))}
                      className="p-1 hover:bg-slate-800 rounded disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 3: BOM STRUCTURE TREE & COMPONENT INSPECTION */}
        {activeTab === 'structure' && (
          <div className="w-full h-full flex-1 p-6 bg-zinc-950 text-white overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">3D 模型物料结构清单 (BOM Tree)</h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono">共 5 个核心部件单元</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { id: 'p1', name: '六轴闭环伺服电机', code: 'MTR-48V-750W', type: '驱动组件', status: '正常运行' },
                { id: 'p2', name: '碳纤维关节臂主轴', code: 'ARM-CF-060', type: '结构件', status: '高应力核准' },
                { id: 'p3', name: '工业三爪智能夹爪', code: 'GRIP-3X-200', type: '末端执行器', status: '准备就绪' },
                { id: 'p4', name: '发黑高精度支撑底座', code: 'BASE-AL-356', type: '基础承重件', status: '固定完成' },
                { id: 'p5', name: '量子能量指示核心', code: 'CORE-LED-01', type: '光学传感', status: '激活中' }
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedPart({
                      id: item.id,
                      name: item.name,
                      desc: `编号: ${item.code} | 类型: ${item.type}`,
                      spec: `状态: ${item.status}`
                    });
                    setActiveTab('model');
                  }}
                  className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/80 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                      <Box className="w-4 h-4 text-emerald-400" />
                      <span>{item.name}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      {item.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>类别: {item.type}</span>
                    <span className="text-emerald-400 font-bold">{item.status} ➔</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
