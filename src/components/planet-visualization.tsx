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

    // Star
    const starGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({ map: starTexture, emissive: 0xffff00, emissiveIntensity: 1 });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(star);
    const starLight = new THREE.PointLight(0xfff0dd, 20, 100);
    star.add(starLight);

    // Planet
    const planetScale = data?.koi_prad ? Math.max(0.2, Math.min(data.koi_prad / 10, 0.8)) : 0.4;
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

    // Orbit
    const orbitRadius = 5;
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
      new THREE.Path().absarc(0, 0, orbitRadius, 0, Math.PI * 2, false).getSpacedPoints(128)
    );
    const orbitMaterial = new THREE.LineDashedMaterial({
        color: statusConfig[status].orbitColor,
        linewidth: 1,
        scale: 1,
        dashSize: 0.2,
        gapSize: 0.1
    });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    orbit.computeLineDistances();
    orbit.rotation.x = Math.PI / 2;
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
        const orbitSpeed = data?.koi_period ? 50 / data.koi_period : 1;
        
        planet.position.x = Math.cos(elapsedTime * orbitSpeed) * orbitRadius;
        planet.position.z = Math.sin(elapsedTime * orbitSpeed) * orbitRadius;
        planet.rotation.y += 0.005;

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

