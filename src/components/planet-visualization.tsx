"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { AnalysisStatus, ExoplanetData } from '@/lib/types';
import { Check, AlertTriangle } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface PlanetVisualizationProps {
  status: AnalysisStatus;
  data: ExoplanetData | null;
  onPlanetClick: () => void;
}

const statusConfig = {
  initial: { planetColor: 0xaaaaaa, orbitColor: 0x666666, opacity: 0.7 },
  analyzing: { planetColor: 0xaaaaaa, orbitColor: 0x666666, opacity: 1.0 },
  confirmed: { planetColor: 0x00ff88, orbitColor: 0x00ff88, opacity: 1.0 },
  false_positive: { planetColor: 0xff3366, orbitColor: 0xff3366, opacity: 0.5 },
};

export function PlanetVisualization({ status, data, onPlanetClick }: PlanetVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const planetRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 10;
    camera.position.y = 3;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const starTexture = textureLoader.load(PlaceHolderImages.find(p => p.id === 'star-texture')?.imageUrl || '');
    const neutralPlanetTexture = textureLoader.load(PlaceHolderImages.find(p => p.id === 'planet-texture-neutral')?.imageUrl || '');
    const confirmedPlanetTexture = textureLoader.load(PlaceHolderImages.find(p => p.id === 'planet-texture-confirmed')?.imageUrl || '');

    // Star - adjust size and color based on stellar parameters
    const stellarRadius = data?.st_rad || 1;
    const stellarTemp = data?.st_teff || data?.koi_steff || 5778; // Default to Sun's temperature
    const starSize = Math.max(1, Math.min(stellarRadius * 1.5, 2.5));

    // Color based on temperature (simplified blackbody approximation)
    let starColor = 0xffff00; // Default yellow
    if (stellarTemp < 3700) starColor = 0xff6600; // Red
    else if (stellarTemp < 5200) starColor = 0xffaa00; // Orange
    else if (stellarTemp < 6000) starColor = 0xffff00; // Yellow
    else if (stellarTemp < 7500) starColor = 0xffffaa; // Yellow-white
    else if (stellarTemp < 10000) starColor = 0xaaaaff; // White-blue
    else starColor = 0x6666ff; // Blue

    const starGeometry = new THREE.SphereGeometry(starSize, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({ map: starTexture, color: starColor });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(star);
    const starLight = new THREE.PointLight(starColor, 20, 100);
    star.add(starLight);

    // Planet - use pl_rade or koi_prad for radius
    const planetRadius = data?.pl_rade || data?.koi_prad || 4;
    const planetScale = Math.max(0.2, Math.min(planetRadius / 10, 0.8));
    const planetGeometry = new THREE.SphereGeometry(planetScale, 32, 32);
    const planetMaterial = new THREE.MeshStandardMaterial({
        color: statusConfig[status].planetColor,
        transparent: true,
        opacity: statusConfig[status].opacity,
        roughness: 0.5,
        metalness: 0.1,
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planetRef.current = planet;
    scene.add(planet);

    // Orbit - use pl_orbper or koi_period for orbital radius calculation
    const orbitalPeriod = data?.pl_orbper || data?.koi_period || 10;
    const orbitRadius = Math.max(3, Math.min(orbitalPeriod / 2, 7));

    // Eccentricity based on insolation (higher insolation = more elliptical)
    const insolation = data?.pl_insol || 1000;
    const eccentricity = Math.min(0.3, insolation / 10000); // 0 to 0.3

    // Create elliptical orbit path
    const orbitPoints = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = orbitRadius * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));
      orbitPoints.push(new THREE.Vector3(
        Math.cos(angle) * r,
        0,
        Math.sin(angle) * r
      ));
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineDashedMaterial({
        color: statusConfig[status].orbitColor,
        linewidth: 1,
        scale: 1,
        dashSize: 0.2,
        gapSize: 0.1
    });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    orbit.computeLineDistances();

    // Orbital inclination based on equilibrium temperature (hotter = more inclined)
    const eqTemp = data?.pl_eqt || data?.koi_teq || 300;
    const orbitalInclination = Math.min(Math.PI / 6, (eqTemp / 3000) * (Math.PI / 4)); // Max 45 degrees
    orbit.rotation.x = Math.PI / 2 + orbitalInclination;

    scene.add(orbit);

    // Starfield
    const starfieldGeometry = new THREE.BufferGeometry();
    const starfieldVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        if(new THREE.Vector3(x,y,z).length() > 100) starfieldVertices.push(x, y, z);
    }
    starfieldGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starfieldVertices, 3));
    const starfieldMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const starfield = new THREE.Points(starfieldGeometry, starfieldMaterial);
    scene.add(starfield);

    // Raycaster for clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([planet]);
      if (intersects.length > 0) {
        onPlanetClick();
      }
    };
    renderer.domElement.addEventListener('click', onCanvasClick);


    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        // Use pl_orbper or koi_period for orbit speed calculation
        const orbitSpeed = orbitalPeriod ? 50 / orbitalPeriod : 1;
        const angle = elapsedTime * orbitSpeed;

        // Elliptical orbital motion
        const r = orbitRadius * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));
        const baseX = Math.cos(angle) * r;
        const baseZ = Math.sin(angle) * r;

        // Apply orbital inclination
        planet.position.x = baseX;
        planet.position.y = baseZ * Math.sin(orbitalInclination);
        planet.position.z = baseZ * Math.cos(orbitalInclination);

        // Planet self-rotation - vary based on planet size (larger planets rotate slower)
        const rotationSpeed = planetRadius ? 0.01 / Math.sqrt(planetRadius) : 0.005;
        planet.rotation.y += rotationSpeed;

        starfield.rotation.y += 0.0001;

        if (status === 'analyzing') {
            const pulse = (Math.sin(elapsedTime * 5) + 1) / 2 * 0.2 + 0.9;
            planet.scale.set(pulse, pulse, pulse);
        } else {
            planet.scale.set(1, 1, 1);
        }

        renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onCanvasClick);
      currentMount.removeChild(renderer.domElement);
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  useEffect(() => {
    const config = statusConfig[status];
    if (planetRef.current) {
        const material = planetRef.current.material as THREE.MeshStandardMaterial;
        material.color.set(config.planetColor);
        material.opacity = config.opacity;
        if(status === 'confirmed') material.map = textureLoader.load(PlaceHolderImages.find(p => p.id === 'planet-texture-confirmed')?.imageUrl || '');
        else material.map = textureLoader.load(PlaceHolderImages.find(p => p.id === 'planet-texture-neutral')?.imageUrl || '');
        if (status === 'confirmed') {
            material.emissive.set(config.planetColor);
            material.emissiveIntensity = 0.5;
        } else {
            material.emissive.set(0x000000);
        }
    }
    const orbit = scene.getObjectByProperty('type', 'Line') as THREE.Line | undefined;
    if (orbit) {
      (orbit.material as THREE.LineDashedMaterial).color.set(config.orbitColor);
      orbit.visible = status !== 'false_positive';
    }

    if (status === 'confirmed') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 800);
    }

  }, [status]);

  const getStatusIndicator = () => {
    switch (status) {
        case 'confirmed':
            return <Check className="w-16 h-16 text-primary glowing-shadow-primary rounded-full p-2" />;
        case 'false_positive':
            return <AlertTriangle className="w-16 h-16 text-destructive glowing-shadow-destructive rounded-full p-2 animate-shake" />;
        default:
            return null;
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" data-ai-hint="space galaxy" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {showConfetti && Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                background: i % 2 === 0 ? 'hsl(var(--primary))' : 'white',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                top: '50%',
                left: '50%',
                transform: `rotate(${Math.random() * 360}deg) translateX(${Math.random() * 80}px) rotate(${Math.random() * 360}deg)`,
                animationDelay: `${Math.random() * 0.2}s`,
              }}
            />
          ))}
          {status !== 'initial' && status !== 'analyzing' && (
             <div className="absolute -top-32 left-1/2 -translate-x-1/2">{getStatusIndicator()}</div>
          )}
      </div>
      {status === 'analyzing' && <div className="absolute inset-0 bg-background/30 flex items-center justify-center"><div className="w-32 h-32 rounded-full border-4 border-primary/50 border-t-primary animate-spin"></div></div>}
    </div>
  );
}

// Re-creating minimal THREE objects to avoid scope issues in useEffect cleanup
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();

