import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Pause, Play, RotateCcw } from 'lucide-react';

type EmbryoStage = 'blastocyst' | 'cleavage' | 'genetics';

const STAGE_INFO: Record<
  EmbryoStage,
  { label: string; title: string; subtitle: string; metric: string }
> = {
  blastocyst: {
    label: 'Репродукция и УЗИ',
    title: 'Экспертная визуализация · Развитие эмбриона',
    subtitle: 'Оценка репродуктивного здоровья, фолликулогенеза и сохранения беременности в Репро-Мед.',
    metric: 'Samsung H-60 · Стаж врачей от 10 до 25+ лет',
  },
  cleavage: {
    label: 'Биопсия (1 день)',
    title: 'Клеточная морфология · Биопсия за 1 день',
    subtitle: 'Точный забор материала под УЗИ-навигацией с выдачей результата в тот же день.',
    metric: 'Результат биопсии в тот же день · Стерильный блок',
  },
  genetics: {
    label: 'Кариотип (5 дней)',
    title: 'Кариотипирование и генетика (результат 5 дней)',
    subtitle: 'Анализ хромосомного набора 46,XX / 46,XY и пренатальный скрининг патологий.',
    metric: 'Кариотипирование за 5 дней · Консультация генетика',
  },
};

const _targetVec = new THREE.Vector3();

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0, 'rgba(11, 37, 69, 0.24)');
    grad.addColorStop(0.5, 'rgba(13, 148, 136, 0.09)');
    grad.addColorStop(1, 'rgba(11, 37, 69, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const Embryo3DViewport: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = useState<EmbryoStage>('blastocyst');
  const [explode, setExplode] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<boolean>(false);

  const stageRef = useRef<EmbryoStage>(stage);
  const explodeRef = useRef<number>(explode);
  const autoRotateRef = useRef<boolean>(autoRotate);
  const resetSignalRef = useRef<number>(0);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    explodeRef.current = explode;
  }, [explode]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 480;

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    const bgColor = new THREE.Color('#EDF4F7');
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2('#EDF4F7', 0.042);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const defaultCamPos = new THREE.Vector3(0, 1.4, 5.4);
    camera.position.copy(defaultCamPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 3.2;
    controls.maxDistance = 8.2;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.05, 0);

    let userInteracting = false;
    controls.addEventListener('start', () => {
      userInteracting = true;
    });
    controls.addEventListener('end', () => {
      userInteracting = false;
    });

    // 3-point warm/cool studio lighting rig
    const hemiLight = new THREE.HemisphereLight(0xe0f7f4, 0x0b2545, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e8, 1.9);
    keyLight.position.set(4.5, 6.0, 5.0);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x14b8a6, 1.15);
    rimLight.position.set(-4.5, 2.0, -4.5);
    scene.add(rimLight);

    // Ground contact shadow plane
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
    });
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.78;
    scene.add(shadowPlane);

    // Root multi-part specimen group
    const specimenGroup = new THREE.Group();
    scene.add(specimenGroup);

    // 1. Outer Zona Pellucida Membrane (optical shell)
    const zonaGeo = new THREE.SphereGeometry(1.42, 48, 48);
    const zonaMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6f7f5,
      metalness: 0.0,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.32 : 0.92,
      ior: 1.46,
      thickness: 0.9,
      attenuationColor: new THREE.Color(0x0d9488),
      attenuationDistance: 2.6,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      iridescence: 0.65,
      iridescenceIOR: 1.3,
      depthWrite: false,
    });
    const zonaMesh = new THREE.Mesh(zonaGeo, zonaMat);
    zonaMesh.renderOrder = 3;
    specimenGroup.add(zonaMesh);

    // 2. Inner Zona Polar Ring (refractive rim highlight)
    const innerRimGeo = new THREE.TorusGeometry(1.42, 0.022, 16, 72);
    const innerRimMat = new THREE.MeshStandardMaterial({
      color: 0x0d9488,
      metalness: 0.75,
      roughness: 0.22,
      transparent: true,
      opacity: 0.65,
    });
    const innerRimMesh = new THREE.Mesh(innerRimGeo, innerRimMat);
    innerRimMesh.rotation.x = Math.PI / 2;
    specimenGroup.add(innerRimMesh);

    // 3. Blastomere Cellular Cluster (8 cellular bodies + inner nuclei)
    const blastomereData: Array<{
      group: THREE.Group;
      blastPos: THREE.Vector3;
      cleavePos: THREE.Vector3;
      geneticsPos: THREE.Vector3;
      baseScale: number;
    }> = [];

    const cellGeo = new THREE.SphereGeometry(0.42, 32, 32);
    const nucleusGeo = new THREE.SphereGeometry(0.16, 20, 20);

    const blastOffsets: [number, number, number, number][] = [
      [0.42, 0.34, 0.24, 0.92],
      [-0.44, 0.31, 0.26, 0.88],
      [0.12, 0.48, -0.32, 0.86],
      [-0.25, -0.22, 0.48, 0.82],
      [0.48, -0.24, -0.28, 0.82],
      [-0.45, -0.28, -0.3, 0.84],
      [0.02, -0.48, 0.06, 0.85],
      [0.0, 0.14, 0.46, 0.78],
    ];

    const cleaveOffsets: [number, number, number, number][] = [
      [0.44, 0.44, 0.0, 1.18],
      [-0.44, 0.44, 0.0, 1.18],
      [0.44, -0.44, 0.0, 1.18],
      [-0.44, -0.44, 0.0, 1.18],
      [0.0, 0.0, 0.56, 0.01],
      [0.0, 0.0, -0.56, 0.01],
      [0.56, 0.0, 0.0, 0.01],
      [-0.56, 0.0, 0.0, 0.01],
    ];

    const geneticsOffsets: [number, number, number, number][] = [
      [0.88, 0.52, 0.32, 0.52],
      [-0.88, 0.52, 0.32, 0.52],
      [0.32, 0.82, -0.62, 0.52],
      [-0.58, -0.48, 0.72, 0.52],
      [0.82, -0.52, -0.48, 0.52],
      [-0.82, -0.52, -0.48, 0.52],
      [0.02, -0.92, 0.12, 0.52],
      [0.0, 0.42, 0.88, 0.52],
    ];

    const cellPalette = [0xf4a698, 0xeb8d7e, 0xd8f3ef, 0x80cbc4, 0xf2b3a7, 0xb2dfdb, 0xe8998d, 0x99d5cf];

    for (let i = 0; i < 8; i++) {
      const cellGroup = new THREE.Group();
      const cellMat = new THREE.MeshPhysicalMaterial({
        color: cellPalette[i],
        metalness: 0.02,
        roughness: 0.28 + (i % 3) * 0.1,
        clearcoat: 0.65,
        clearcoatRoughness: 0.22,
        transparent: true,
        opacity: 0.94,
      });
      const cellMesh = new THREE.Mesh(cellGeo, cellMat);
      cellMesh.castShadow = !isSoftwareGl;
      cellMesh.receiveShadow = !isSoftwareGl;
      cellGroup.add(cellMesh);

      const nucMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x0b2545 : 0x0f766e,
        emissive: i % 2 === 0 ? 0x0f766e : 0x0b2545,
        emissiveIntensity: 0.35,
        roughness: 0.42,
        metalness: 0.15,
      });
      const nucMesh = new THREE.Mesh(nucleusGeo, nucMat);
      cellGroup.add(nucMesh);

      const [bx, by, bz, bs] = blastOffsets[i];
      const [cx, cy, cz] = cleaveOffsets[i];
      const [gx, gy, gz] = geneticsOffsets[i];

      cellGroup.position.set(bx, by, bz);
      cellGroup.scale.setScalar(bs);
      specimenGroup.add(cellGroup);

      blastomereData.push({
        group: cellGroup,
        blastPos: new THREE.Vector3(bx, by, bz),
        cleavePos: new THREE.Vector3(cx, cy, cz),
        geneticsPos: new THREE.Vector3(gx, gy, gz),
        baseScale: bs,
      });
    }

    // 4. DNA Double Helix Core (procedural TubeGeometry + base-pair rungs)
    const dnaGroup = new THREE.Group();
    const strand1Points: THREE.Vector3[] = [];
    const strand2Points: THREE.Vector3[] = [];
    const helixHeight = 1.6;
    const helixSteps = 32;
    const helixRadius = 0.26;

    for (let i = 0; i <= helixSteps; i++) {
      const t = i / helixSteps;
      const angle = t * Math.PI * 3.2;
      const y = (t - 0.5) * helixHeight;
      strand1Points.push(new THREE.Vector3(Math.cos(angle) * helixRadius, y, Math.sin(angle) * helixRadius));
      strand2Points.push(
        new THREE.Vector3(Math.cos(angle + Math.PI) * helixRadius, y, Math.sin(angle + Math.PI) * helixRadius)
      );
    }

    const backboneMat1 = new THREE.MeshStandardMaterial({
      color: 0x0d9488,
      metalness: 0.78,
      roughness: 0.22,
    });
    const backboneMat2 = new THREE.MeshStandardMaterial({
      color: 0x0b2545,
      metalness: 0.85,
      roughness: 0.2,
    });

    const strand1Geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strand1Points), 48, 0.028, 10, false);
    const strand2Geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strand2Points), 48, 0.028, 10, false);
    dnaGroup.add(new THREE.Mesh(strand1Geo, backboneMat1));
    dnaGroup.add(new THREE.Mesh(strand2Geo, backboneMat2));

    const rungGeo = new THREE.CylinderGeometry(0.014, 0.014, helixRadius * 2, 8);
    rungGeo.rotateZ(Math.PI / 2);
    const rungMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.88,
      roughness: 0.18,
    });

    for (let i = 2; i < helixSteps; i += 3) {
      const t = i / helixSteps;
      const angle = t * Math.PI * 3.2;
      const y = (t - 0.5) * helixHeight;
      const rung = new THREE.Mesh(rungGeo, rungMat);
      rung.position.y = y;
      rung.rotation.y = -angle;
      dnaGroup.add(rung);
    }

    dnaGroup.scale.setScalar(0.55);
    specimenGroup.add(dnaGroup);

    // 5. Laboratory Cryo-Stage Calibration Rings + 36 Instanced Ticks
    const stageRingGroup = new THREE.Group();
    const outerRingGeo = new THREE.TorusGeometry(1.78, 0.018, 12, 96);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.22,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI / 2.25;
    stageRingGroup.add(outerRing);

    const tickGeo = new THREE.BoxGeometry(0.016, 0.045, 0.016);
    const tickMat = new THREE.MeshStandardMaterial({
      color: 0x0d9488,
      metalness: 0.65,
      roughness: 0.3,
    });
    const tickCount = 36;
    const tickInstanced = new THREE.InstancedMesh(tickGeo, tickMat, tickCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < tickCount; i++) {
      const a = (i / tickCount) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 1.88, 0, Math.sin(a) * 1.88);
      dummy.rotation.set(0, -a, 0);
      dummy.updateMatrix();
      tickInstanced.setMatrixAt(i, dummy.matrix);
    }
    tickInstanced.instanceMatrix.needsUpdate = true;
    tickInstanced.computeBoundingSphere();
    tickInstanced.rotation.x = Math.PI / 2.25;
    stageRingGroup.add(tickInstanced);
    specimenGroup.add(stageRingGroup);

    // 6. Nutrient Medium Micro-Vesicles (InstancedMesh)
    const vesicleCount = 40;
    const vesicleGeo = new THREE.SphereGeometry(0.032, 12, 12);
    const vesicleMat = new THREE.MeshStandardMaterial({
      color: 0x5eead4,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7,
    });
    const vesicleMesh = new THREE.InstancedMesh(vesicleGeo, vesicleMat, vesicleCount);
    const vesicleAngles: number[] = [];
    const vesicleRadii: number[] = [];
    const vesicleHeights: number[] = [];
    for (let i = 0; i < vesicleCount; i++) {
      const a = (i / vesicleCount) * Math.PI * 2 + (i % 5) * 0.4;
      const r = 1.65 + (i % 7) * 0.16;
      const y = ((i % 9) - 4) * 0.28;
      vesicleAngles.push(a);
      vesicleRadii.push(r);
      vesicleHeights.push(y);
      dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      dummy.scale.setScalar(0.75 + (i % 4) * 0.25);
      dummy.updateMatrix();
      vesicleMesh.setMatrixAt(i, dummy.matrix);
    }
    vesicleMesh.instanceMatrix.needsUpdate = true;
    vesicleMesh.computeBoundingSphere();
    scene.add(vesicleMesh);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    let lastResetSignal = resetSignalRef.current;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      const activeStage = stageRef.current;
      const exp = explodeRef.current;

      // Reset camera smoothly if requested
      if (resetSignalRef.current !== lastResetSignal) {
        lastResetSignal = resetSignalRef.current;
        camera.position.copy(defaultCamPos);
        controls.target.set(0, 0.05, 0);
      }

      if (autoRotateRef.current && !userInteracting) {
        specimenGroup.rotation.y += delta * 0.28;
      }

      // Smoothly damp blastomere cluster positions & scales
      for (let i = 0; i < blastomereData.length; i++) {
        const item = blastomereData[i];
        let baseVec = item.blastPos;
        let targetScale = item.baseScale;

        if (activeStage === 'cleavage') {
          baseVec = item.cleavePos;
          targetScale = cleaveOffsets[i][3];
        } else if (activeStage === 'genetics') {
          baseVec = item.geneticsPos;
          targetScale = geneticsOffsets[i][3];
        }

        _targetVec.copy(baseVec).multiplyScalar(1 + exp * 0.65);
        item.group.position.x = THREE.MathUtils.damp(item.group.position.x, _targetVec.x, 6, delta);
        item.group.position.y = THREE.MathUtils.damp(item.group.position.y, _targetVec.y, 6, delta);
        item.group.position.z = THREE.MathUtils.damp(item.group.position.z, _targetVec.z, 6, delta);

        const nextScale = THREE.MathUtils.damp(item.group.scale.x, targetScale, 6, delta);
        item.group.scale.setScalar(nextScale);
      }

      // Zona Pellucida expansion on explode
      const targetZonaScale = activeStage === 'genetics' ? 1.12 + exp * 0.22 : 1.0 + exp * 0.22;
      const zonaScale = THREE.MathUtils.damp(zonaMesh.scale.x, targetZonaScale, 5, delta);
      zonaMesh.scale.setScalar(zonaScale);

      // DNA helix prominence in genetics mode
      const targetDnaScale = activeStage === 'genetics' ? 1.18 : 0.48 + exp * 0.35;
      const dnaScale = THREE.MathUtils.damp(dnaGroup.scale.x, targetDnaScale, 6, delta);
      dnaGroup.scale.setScalar(dnaScale);
      dnaGroup.rotation.y = elapsed * 0.7;

      // Subtle ring gyro motion
      stageRingGroup.rotation.z = Math.sin(elapsed * 0.4) * 0.14;
      stageRingGroup.rotation.y = -elapsed * 0.18;

      // Gently animate micro-vesicles
      for (let i = 0; i < vesicleCount; i++) {
        const a = vesicleAngles[i] + elapsed * (0.08 + (i % 3) * 0.03);
        const r = vesicleRadii[i];
        const y = vesicleHeights[i] + Math.sin(elapsed * 0.9 + i) * 0.07;
        dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        dummy.scale.setScalar(0.75 + (i % 4) * 0.25);
        dummy.updateMatrix();
        vesicleMesh.setMatrixAt(i, dummy.matrix);
      }
      vesicleMesh.instanceMatrix.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      zonaGeo.dispose();
      zonaMat.dispose();
      innerRimGeo.dispose();
      innerRimMat.dispose();
      cellGeo.dispose();
      nucleusGeo.dispose();
      strand1Geo.dispose();
      strand2Geo.dispose();
      rungGeo.dispose();
      backboneMat1.dispose();
      backboneMat2.dispose();
      rungMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      tickGeo.dispose();
      tickMat.dispose();
      vesicleGeo.dispose();
      vesicleMat.dispose();
      shadowTex.dispose();
      shadowMat.dispose();
      envTex.dispose();
      renderer.dispose();
    };
  }, []);

  const currentInfo = STAGE_INFO[stage];

  return (
    <div className="relative h-full min-h-[460px] lg:min-h-[540px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#EDF4F7]">
      {/* Top minimal stage label */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-4">
        <div className="max-w-md rounded-xl border border-slate-200/80 bg-white/95 px-3.5 py-2.5 shadow-sm">
          <div className="text-[11px] font-medium tracking-wide text-[#0D9488]">
            Интерактивный 3D-атлас ВРТ
          </div>
          <div className="mt-0.5 text-sm font-semibold text-[#0B2545]">{currentInfo.title}</div>
          <div className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
            {currentInfo.metric}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHudCollapsed((prev) => !prev)}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          {hudCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Панель 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Скрыть</span>
            </>
          )}
        </button>
      </div>

      {/* Isolated WebGL mount container */}
      {webglError ? (
        <div className="flex h-full min-h-[460px] flex-col items-center justify-center p-8 text-center">
          <div className="text-base font-semibold text-[#0B2545]">3D-модель эмбриогенеза</div>
          <p className="mt-2 max-w-sm text-sm text-slate-600">{currentInfo.subtitle}</p>
        </div>
      ) : (
        <div ref={mountRef} className="h-full min-h-[460px] lg:min-h-[540px] w-full cursor-grab active:cursor-grabbing" />
      )}

      {/* Collapsible bottom control dock (solid bg, no backdrop-filter over WebGL) */}
      <div
        className={`absolute bottom-3 left-1/2 z-10 w-[calc(100%-24px)] max-w-[600px] -translate-x-1/2 transition-transform duration-200 ${
          hudCollapsed ? 'translate-y-[130%]' : 'translate-y-0'
        }`}
      >
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(Object.keys(STAGE_INFO) as EmbryoStage[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStage(key)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    stage === key
                      ? 'bg-[#0B2545] text-white'
                      : 'text-slate-600 hover:text-[#0B2545]'
                  }`}
                >
                  {STAGE_INFO[key].label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAutoRotate((prev) => !prev)}
                aria-label={autoRotate ? 'Остановить вращение' : 'Запустить вращение'}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{autoRotate ? 'Пауза' : 'Вращать'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExplode(0);
                  resetSignalRef.current += 1;
                }}
                aria-label="Сбросить ракурс"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Сброс</span>
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-3 border-t border-slate-100 pt-2">
            <label htmlFor="embryo-explode" className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Разбор слоев
            </label>
            <input
              id="embryo-explode"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explode}
              onChange={(e) => setExplode(parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-[#0D9488]"
            />
            <span className="w-10 text-right font-mono text-xs text-slate-600 tabular-nums">
              {Math.round(explode * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
