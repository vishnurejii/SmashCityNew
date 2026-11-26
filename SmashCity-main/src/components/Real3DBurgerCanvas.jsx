import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Real 3D WebGL Burger Canvas with interactive orbit drag, lighting,
 * and procedural 3D geometric meshes (Buns, Patties, Melted Cheese, Toppings, Sauces).
 */
const Real3DBurgerCanvas = ({ 
  selectedBun, 
  pattyType, 
  pattyCount, 
  selectedCheese, 
  cheeseCount, 
  selectedToppings, 
  selectedSauces, 
  viewMode // 'stacked' | 'exploded' | 'rotating'
}) => {
  const mountRef = useRef(null);
  const burgerGroupRef = useRef(null);
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const rotationTargetRef = useRef({ x: 0.35, y: -0.45 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = null; // transparent background

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.5);
    keyLight.position.set(5, 10, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xff9922, 1.2);
    fillLight.position.set(-6, -2, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.6);
    rimLight.position.set(0, 6, -6);
    scene.add(rimLight);

    // 3. Ground / Shadow plane
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.2;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    // 4. Main Burger Root Group
    const burgerGroup = new THREE.Group();
    scene.add(burgerGroup);
    burgerGroupRef.current = burgerGroup;

    // 5. Interactive Mouse/Touch Drag Controls
    const onMouseDown = (e) => {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevMousePosRef.current.x;
      const deltaY = e.clientY - prevMousePosRef.current.y;
      rotationTargetRef.current.y += deltaX * 0.008;
      rotationTargetRef.current.x += deltaY * 0.008;
      // Clamp vertical tilt
      rotationTargetRef.current.x = Math.max(-0.6, Math.min(0.8, rotationTargetRef.current.x));
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch support
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMousePosRef.current.x;
      const deltaY = e.touches[0].clientY - prevMousePosRef.current.y;
      rotationTargetRef.current.y += deltaX * 0.01;
      rotationTargetRef.current.x += deltaY * 0.01;
      rotationTargetRef.current.x = Math.max(-0.6, Math.min(0.8, rotationTargetRef.current.x));
      prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 6. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (burgerGroupRef.current) {
        // Smooth rotation interpolation
        burgerGroupRef.current.rotation.y += (rotationTargetRef.current.y - burgerGroupRef.current.rotation.y) * 0.1;
        burgerGroupRef.current.rotation.x += (rotationTargetRef.current.x - burgerGroupRef.current.rotation.x) * 0.1;

        // Auto slow idle spin if not dragging
        if (!isDraggingRef.current && viewMode !== 'exploded') {
          rotationTargetRef.current.y += 0.003;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 360;
      const newH = container.clientHeight || 450;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, []);

  // Re-build 3D Meshes dynamically when ingredients or viewMode changes
  useEffect(() => {
    const burgerGroup = burgerGroupRef.current;
    if (!burgerGroup) return;

    // Clear previous 3D meshes
    while (burgerGroup.children.length > 0) {
      const obj = burgerGroup.children[0];
      burgerGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    const isExploded = viewMode === 'exploded';
    const spacing = isExploded ? 0.75 : 0.04;
    let currentY = isExploded ? -1.8 : -1.0;

    // Helper: Add mesh with shadow
    const addMesh = (mesh, heightOffset = 0.25) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.y = currentY + heightOffset;
      burgerGroup.add(mesh);
      currentY += (heightOffset * 2) + spacing;
    };

    // -------------------------------------------------------------
    // 1. Bottom Bun (Heel)
    // -------------------------------------------------------------
    const bunColor = selectedBun?.color || '#D97706';
    const heelMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bunColor).multiplyScalar(0.92),
      roughness: 0.65,
      metalness: 0.05
    });
    // Truncated cylinder for bottom bun
    const heelGeo = new THREE.CylinderGeometry(1.65, 1.45, 0.45, 32);
    const heelMesh = new THREE.Mesh(heelGeo, heelMat);
    addMesh(heelMesh, 0.22);

    // -------------------------------------------------------------
    // 2. Base Sauce (if any)
    // -------------------------------------------------------------
    if (selectedSauces && selectedSauces.length > 0) {
      const sauceColor = selectedSauces.includes('habanero-hot') ? 0xDC2626 :
                         selectedSauces.includes('truffle-mayo') ? 0xFDE68A : 0xF97316;
      const sauceMat = new THREE.MeshStandardMaterial({
        color: sauceColor,
        roughness: 0.2,
        metalness: 0.1
      });
      const sauceGeo = new THREE.CylinderGeometry(1.5, 1.55, 0.08, 24);
      const sauceMesh = new THREE.Mesh(sauceGeo, sauceMat);
      addMesh(sauceMesh, 0.05);
    }

    // -------------------------------------------------------------
    // 3. Smash Patties & Melted Cheese Slices
    // -------------------------------------------------------------
    const pattyColor = pattyType?.color || '#451A03';
    const pattyMat = new THREE.MeshStandardMaterial({
      color: pattyColor,
      roughness: 0.9,
      metalness: 0.08,
      bumpScale: 0.05
    });

    const cheeseColor = selectedCheese?.color || '#FBBF24';
    const cheeseMat = new THREE.MeshStandardMaterial({
      color: cheeseColor,
      roughness: 0.35,
      metalness: 0.05
    });

    for (let i = 0; i < pattyCount; i++) {
      // Smashed Patty with irregular crispy edges
      const pattyGeo = new THREE.CylinderGeometry(1.82, 1.86, 0.32, 28);
      // add slight random surface distortion to simulate smashed grill lace
      const pos = pattyGeo.attributes.position;
      for (let pIdx = 0; pIdx < pos.count; pIdx++) {
        const vx = pos.getX(pIdx);
        const vy = pos.getY(pIdx);
        const vz = pos.getZ(pIdx);
        if (Math.abs(vy) < 0.1) {
          pos.setX(pIdx, vx + (Math.random() - 0.5) * 0.08);
          pos.setZ(pIdx, vz + (Math.random() - 0.5) * 0.08);
        }
      }
      pattyGeo.computeVertexNormals();
      const pattyMesh = new THREE.Mesh(pattyGeo, pattyMat);
      pattyMesh.rotation.y = i * 0.6;
      addMesh(pattyMesh, 0.16);

      // Melted Cheese draped over this patty
      if (i < cheeseCount) {
        const cheeseBox = new THREE.BoxGeometry(2.35, 0.06, 2.35);
        const cheeseMesh = new THREE.Mesh(cheeseBox, cheeseMat);
        cheeseMesh.rotation.y = 0.78 + (i * 0.5); // 45-degree draped corners
        addMesh(cheeseMesh, 0.04);
      }
    }

    // -------------------------------------------------------------
    // 4. Fresh Toppings (Pickles, Onions, Tomatoes, Bacon)
    // -------------------------------------------------------------
    if (selectedToppings && selectedToppings.length > 0) {
      // Pickles
      if (selectedToppings.includes('house-pickles')) {
        const pickleMat = new THREE.MeshStandardMaterial({ color: 0x65A30D, roughness: 0.4 });
        const pickleGroup = new THREE.Group();
        for (let p = 0; p < 3; p++) {
          const angle = (p * Math.PI * 2) / 3;
          const pGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.08, 16);
          const pMesh = new THREE.Mesh(pGeo, pickleMat);
          pMesh.position.set(Math.cos(angle) * 0.75, 0, Math.sin(angle) * 0.75);
          pMesh.rotation.x = 0.1;
          pickleGroup.add(pMesh);
        }
        addMesh(pickleGroup, 0.08);
      }

      // Caramelized Onions
      if (selectedToppings.includes('caramelized-onions')) {
        const onionMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.5 });
        const onionGeo = new THREE.TorusGeometry(1.1, 0.09, 8, 24);
        const onionMesh = new THREE.Mesh(onionGeo, onionMat);
        onionMesh.rotation.x = Math.PI / 2;
        addMesh(onionMesh, 0.06);
      }

      // Bacon Strips
      if (selectedToppings.includes('smoky-bacon')) {
        const baconMat = new THREE.MeshStandardMaterial({ color: 0x991B1B, roughness: 0.6 });
        const baconGroup = new THREE.Group();
        const bGeo = new THREE.BoxGeometry(2.6, 0.08, 0.65);
        const b1 = new THREE.Mesh(bGeo, baconMat);
        const b2 = new THREE.Mesh(bGeo, baconMat);
        b1.rotation.y = 0.4;
        b2.rotation.y = -0.4;
        baconGroup.add(b1);
        baconGroup.add(b2);
        addMesh(baconGroup, 0.08);
      }

      // Sliced Tomatoes
      if (selectedToppings.includes('ripe-tomato')) {
        const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.25 });
        const tomatoGroup = new THREE.Group();
        for (let t = 0; t < 2; t++) {
          const tGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.12, 20);
          const tMesh = new THREE.Mesh(tGeo, tomatoMat);
          tMesh.position.x = t === 0 ? -0.55 : 0.55;
          tMesh.rotation.z = t === 0 ? 0.08 : -0.08;
          tomatoGroup.add(tMesh);
        }
        addMesh(tomatoGroup, 0.1);
      }

      // Crisp Lettuce
      if (selectedToppings.includes('crisp-lettuce')) {
        const lettuceMat = new THREE.MeshStandardMaterial({ 
          color: 0x22C55E, 
          roughness: 0.7, 
          side: THREE.DoubleSide 
        });
        const lettuceGeo = new THREE.CylinderGeometry(2.0, 1.8, 0.1, 24);
        const lettuceMesh = new THREE.Mesh(lettuceGeo, lettuceMat);
        addMesh(lettuceMesh, 0.08);
      }
    }

    // -------------------------------------------------------------
    // 5. Crown Bun (Top Brioche Dome + Sesame Seeds)
    // -------------------------------------------------------------
    const crownMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bunColor),
      roughness: 0.5,
      metalness: 0.05
    });

    // Solid brioche dome with capped bottom
    const crownGeo = new THREE.SphereGeometry(
      1.75,       // radius
      32,         // widthSegments
      24,         // heightSegments
      0,          // phiStart
      Math.PI * 2,// phiLength
      0,          // thetaStart
      Math.PI * 0.48 // thetaLength (dome curve)
    );
    // Flatten dome slightly to resemble authentic brioche bun
    crownGeo.scale(1.0, 0.65, 1.0);
    const crownMesh = new THREE.Mesh(crownGeo, crownMat);
    crownMesh.castShadow = true;
    crownMesh.receiveShadow = true;

    // Flat bottom seal disk for crown bun
    const crownBaseGeo = new THREE.CircleGeometry(1.72, 32);
    const crownBaseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bunColor).multiplyScalar(0.85),
      roughness: 0.7
    });
    const crownBaseMesh = new THREE.Mesh(crownBaseGeo, crownBaseMat);
    crownBaseMesh.rotation.x = Math.PI / 2;
    crownBaseMesh.position.y = 0.01;

    // Sesame Seeds scattered accurately across top dome surface
    const sesameGroup = new THREE.Group();
    const seedGeo = new THREE.ConeGeometry(0.035, 0.09, 5);
    const seedMat = new THREE.MeshStandardMaterial({ color: 0xFFFBEB, roughness: 0.6 });
    
    for (let s = 0; s < 40; s++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = 0.15 + Math.random() * 0.75; // stay on upper hemisphere
      const r = 1.76;
      const seedMesh = new THREE.Mesh(seedGeo, seedMat);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (r * Math.cos(phi) * 0.65);
      const z = r * Math.sin(phi) * Math.sin(theta);
      
      seedMesh.position.set(x, y, z);
      seedMesh.lookAt(x * 1.5, y * 1.5, z * 1.5);
      seedMesh.rotation.x += Math.PI / 2;
      sesameGroup.add(seedMesh);
    }

    const topBunCompound = new THREE.Group();
    topBunCompound.add(crownMesh);
    topBunCompound.add(crownBaseMesh);
    topBunCompound.add(sesameGroup);
    addMesh(topBunCompound, 0.45);

    // Center the whole burger vertically
    burgerGroup.position.y = - (currentY / 2) + 0.15;

  }, [selectedBun, pattyType, pattyCount, selectedCheese, cheeseCount, selectedToppings, selectedSauces, viewMode]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      {/* 3D WebGL Canvas Mount */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center relative touch-none"
      />
      
      {/* Subtle interaction cue badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] text-white/50 tracking-wider uppercase font-medium flex items-center gap-1.5 backdrop-blur-sm">
        <span>🖱️ Drag to rotate 3D view</span>
      </div>
    </div>
  );
};

export default Real3DBurgerCanvas;
