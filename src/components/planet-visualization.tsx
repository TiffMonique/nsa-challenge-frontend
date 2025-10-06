"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { AnalysisStatus, ExoplanetData } from '@/lib/types';
import { Check, AlertTriangle } from 'lucide-react';

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

// Calculate semi-major axis from orbital period using Kepler's third law
// a^3 = (G * M * T^2) / (4 * π^2)
// Simplified: a ≈ (T/365.25)^(2/3) AU for Sun-like stars
const calculateSemiMajorAxis = (orbitalPeriodDays: number, stellarMass: number = 1): number => {
  // Convert period to years and apply Kepler's third law
  const periodYears = orbitalPeriodDays / 365.25;
  const semiMajorAxisAU = Math.pow(periodYears * periodYears * stellarMass, 1/3);
  return semiMajorAxisAU;
};

export function PlanetVisualization({ status, data, onPlanetClick }: PlanetVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const planetRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const orbitRef = useRef<THREE.Line | null>(null);
  const [lightCurveData, setLightCurveData] = useState<number[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Reset light curve data when new data is loaded
    setLightCurveData([]);
    
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene; // Store reference
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    // Position camera to view orbit from slightly above - adjusted for larger scale
    camera.position.z = -15; // Behind the scene looking toward star
    camera.position.y = 3;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Force initial render
    renderer.render(scene, camera);

    // Stellar and planetary parameters
    const stellarRadiusSolarRadii = data?.st_rad || 1; // In solar radii
    const stellarTemp = data?.st_teff || data?.koi_steff || 5778;
    const planetRadiusEarthRadii = data?.pl_rade || data?.koi_prad || 1; // In Earth radii
    const orbitalPeriodDays = data?.pl_orbper || data?.koi_period || 10;
    const transitDepth = data?.pl_trandep || 0.01; // Transit depth in ppm or percent
    const transitDurationHours = data?.pl_trandurh || 2; // Transit duration in hours

    // Calculate derived values for logging
    const semiMajorAxisAU = calculateSemiMajorAxis(orbitalPeriodDays, 1);
    const orbitRadiusScaled = Math.max(3.5, Math.min(semiMajorAxisAU * 5, 8));

    // Determine star color name (will be set later with actual classification)

    // We'll log after planet type is calculated (moved to after planet creation)

    // Convert Earth radii to Solar radii (1 R☉ = 109.2 R⊕)
    const planetRadiusSolarRadii = planetRadiusEarthRadii / 109.2;

    // Star size in scene (base unit) - increased for better visibility
    const starSize = 2.5;

    // Planet size to scale with star
    const planetSize = starSize * (planetRadiusSolarRadii / stellarRadiusSolarRadii);
    const scaledPlanetSize = Math.max(0.1, planetSize * 1.5); // Ensure planet is visible and scaled up

    // Use the orbit radius calculated earlier (from line 74)
    const orbitRadius = orbitRadiusScaled;

    // Star color based on stellar classification temperature
    // M type: 2400-3700K (Red), K type: 3700-5200K (Orange), G type: 5200-6000K (Yellow)
    // F type: 6000-7500K (Yellow-White), A type: 7500-10000K (White)
    // B type: 10000-30000K (Blue-White), O type: 30000+ K (Blue)
    let starColor = 0xffeb3b; // Default yellow (G-type like Sun)
    let stellarClass = 'G';

    if (stellarTemp < 2400) {
      starColor = 0xd32f2f; // Dark red (very cool) - more saturated
      stellarClass = 'L/T';
    } else if (stellarTemp < 3700) {
      starColor = 0xff5722; // Red-orange (M-type) - brighter
      stellarClass = 'M';
    } else if (stellarTemp < 5200) {
      starColor = 0xff9800; // Orange (K-type) - more vibrant
      stellarClass = 'K';
    } else if (stellarTemp < 6000) {
      starColor = 0xffeb3b; // Yellow (G-type, like Sun) - brighter
      stellarClass = 'G';
    } else if (stellarTemp < 7500) {
      starColor = 0xffffe0; // Yellow-white (F-type) - more contrast
      stellarClass = 'F';
    } else if (stellarTemp < 10000) {
      starColor = 0xfafafa; // White (A-type) - cleaner white
      stellarClass = 'A';
    } else if (stellarTemp < 30000) {
      starColor = 0x64b5f6; // Blue-white (B-type) - more blue
      stellarClass = 'B';
    } else {
      starColor = 0x2196f3; // Blue (O-type) - brighter blue
      stellarClass = 'O';
    }

    const starGeometry = new THREE.SphereGeometry(starSize, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({ color: starColor }); // Solo color, sin textura
    const star = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(star);
    const starLight = new THREE.PointLight(starColor, 30, 150); // Increased intensity and range
    star.add(starLight);

    // Add ambient light for better contrast
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Soft white ambient light
    scene.add(ambientLight);

    // Store star reference for animation
    const starRef = star;

    // Planet color based on physical characteristics
    const planetTemp = data?.pl_eqt || 300; // Equilibrium temperature
    const planetInsolation = data?.pl_insol || 1;
    let planetColor = 0x2196f3; // Default blue
    let planetType = 'Unknown';

    // Determine planet type and color based on radius and temperature
    if (planetRadiusEarthRadii < 1.5) {
      // Rocky planet (Mercury/Mars-like to Earth-like)
      if (planetTemp > 600) {
        planetColor = 0xc62828; // Hot rocky (dark red)
        planetType = 'Hot Rocky';
      } else if (planetTemp > 273 && planetTemp < 373) {
        planetColor = 0x1976d2; // Earth-like (medium blue)
        planetType = 'Earth-like';
      } else {
        planetColor = 0x5d4037; // Cold rocky (dark brown)
        planetType = 'Cold Rocky';
      }
    } else if (planetRadiusEarthRadii < 3.5) {
      // Super-Earth or small Neptune
      if (planetTemp > 1000) {
        planetColor = 0xe64a19; // Hot (dark red-orange)
        planetType = 'Hot Super-Earth';
      } else if (planetTemp > 400) {
        planetColor = 0xf57c00; // Warm (dark orange)
        planetType = 'Warm Super-Earth';
      } else {
        planetColor = 0x1976d2; // Cool (darker blue)
        planetType = 'Cold Super-Earth';
      }
    } else if (planetRadiusEarthRadii < 8) {
      // Neptune-like - darker colors for better contrast
      if (planetTemp > 1000) {
        planetColor = 0xd84315; // Hot Neptune (dark orange-red)
        planetType = 'Hot Neptune';
      } else {
        planetColor = 0x0d47a1; // Cool Neptune (dark blue) - much darker
        planetType = 'Neptune-like';
      }
    } else {
      // Jupiter-like gas giant - darker, more opaque colors
      if (planetTemp > 1500) {
        planetColor = 0xbf360c; // Hot Jupiter (very dark orange/brown)
        planetType = 'Hot Jupiter';
      } else if (planetTemp > 1000) {
        planetColor = 0xf57f17; // Warm Jupiter (dark amber)
        planetType = 'Warm Jupiter';
      } else {
        planetColor = 0x6d4c41; // Cool Jupiter (dark brown) - much darker
        planetType = 'Jupiter-like';
      }
    }

    const planetGeometry = new THREE.SphereGeometry(scaledPlanetSize, 32, 32);

    // Make larger planets more opaque and darker
    const isLargePlanet = planetRadiusEarthRadii >= 3.5; // Neptune-like or Jupiter-like
    const planetRoughness = isLargePlanet ? 0.8 : 0.5; // More matte for gas giants
    const planetMetalness = isLargePlanet ? 0.0 : 0.1; // No metallic for gas giants

    const planetMaterial = new THREE.MeshStandardMaterial({
        color: planetColor, // Always use physical color
        transparent: true,
        opacity: statusConfig[status].opacity,
        roughness: planetRoughness, // More opaque/matte for large planets
        metalness: planetMetalness,
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planetRef.current = planet;
    scene.add(planet);

    // Get star color name from classification
    let starColorName = 'Yellow';
    if (stellarClass === 'L/T') starColorName = 'Dark Red';
    else if (stellarClass === 'M') starColorName = 'Red-Orange';
    else if (stellarClass === 'K') starColorName = 'Orange';
    else if (stellarClass === 'G') starColorName = 'Yellow';
    else if (stellarClass === 'F') starColorName = 'Yellow-White';
    else if (stellarClass === 'A') starColorName = 'White';
    else if (stellarClass === 'B') starColorName = 'Blue-White';
    else if (stellarClass === 'O') starColorName = 'Blue';

    // Log visualization parameters with stellar classification and planet type
    console.log('🪐 Visualization Parameters Updated:', {
      planetName: data?.kepler_name || data?.kepoi_name || 'Unknown',
      star: {
        class: stellarClass,
        radius: `${stellarRadiusSolarRadii.toFixed(2)} R☉`,
        temp: `${stellarTemp} K`,
        color: starColorName,
        sceneSize: starSize
      },
      planet: {
        type: planetType,
        radius: `${planetRadiusEarthRadii.toFixed(2)} R⊕`,
        temperature: `${planetTemp.toFixed(0)} K`,
        radiusToStarRatio: `1:${(stellarRadiusSolarRadii / (planetRadiusEarthRadii / 109.2)).toFixed(1)}`,
        sceneSize: scaledPlanetSize,
        insolation: `${planetInsolation.toFixed(2)} S⊕`
      },
      orbit: {
        period: `${orbitalPeriodDays.toFixed(2)} days (60s animation)`,
        semiMajorAxis: `${semiMajorAxisAU.toFixed(3)} AU`,
        orbitRadius: `${orbitRadiusScaled.toFixed(2)} scene units`
      },
      transit: {
        depth: `${transitDepth.toFixed(0)} ppm`,
        depthFraction: `${(transitDepth / 1000000).toFixed(6)}`,
        duration: `${transitDurationHours.toFixed(2)} hours`,
        detectionRadius: `${(starSize + scaledPlanetSize).toFixed(2)} units`
      }
    });

    // Orbit removed - no visual orbit line displayed
    orbitRef.current = null;

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
    const starfieldMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 }); // Slightly larger stars
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


    // Light curve tracking
    const lightCurveHistory: number[] = [];
    const maxLightCurvePoints = 200;

    // Animation loop
    const clock = new THREE.Clock();
    let animationFrameId: number;
    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Orbital period scaled to 60 seconds
        const scaledPeriod = 60; // seconds
        const orbitSpeed = (Math.PI * 2) / scaledPeriod; // radians per second
        const angle = -(elapsedTime * orbitSpeed); // Negative for counter-clockwise rotation

        // Circular orbital motion (counter-clockwise when viewed from above)
        planet.position.x = Math.cos(angle) * orbitRadius;
        planet.position.y = 0;
        planet.position.z = Math.sin(angle) * orbitRadius;

        // Check if planet is transiting (blocking star from camera view)
        // Camera is at z = -15, star is at z = 0
        // Transit occurs when planet is between camera and star (z < 0)
        // and planet is close enough to star's center from our viewpoint
        const distanceFromCenter = Math.sqrt(planet.position.x * planet.position.x + planet.position.y * planet.position.y);
        const isInFront = planet.position.z < 0; // Between camera and star
        const isOverlapping = distanceFromCenter < (starSize + scaledPlanetSize);
        const isTransiting = isInFront && isOverlapping;

        // Calculate brightness (1.0 = full brightness, less during transit)
        let brightness = 1.0;
        if (isTransiting) {
          // During transit, brightness drops by transit depth
          // Transit depth is in ppm (parts per million)
          const depthFraction = transitDepth / 1000000;
          brightness = 1.0 - depthFraction;

          // Log transit events occasionally for debugging
          if (Math.random() < 0.01) {
            console.log(`🌑 Transit detected! Brightness: ${brightness.toFixed(6)}, Depth: ${transitDepth} ppm, Distance: ${distanceFromCenter.toFixed(2)}`);
          }
        }

        // Update light curve history every frame
        lightCurveHistory.push(brightness);
        if (lightCurveHistory.length > maxLightCurvePoints) {
          lightCurveHistory.shift();
        }

        // Update state every frame for real-time display
        setLightCurveData([...lightCurveHistory]);

        // Star rotation - hotter stars rotate faster (simplified)
        // Stellar rotation based on temperature (approximation)
        const stellarRotationSpeed = stellarTemp > 6000 ? 0.005 : 0.002;
        starRef.rotation.y += stellarRotationSpeed;

        // Planet self-rotation - larger planets rotate slower
        // Use actual planet radius to calculate rotation speed
        const rotationSpeed = planetRadiusEarthRadii > 0 ? 0.02 / Math.sqrt(planetRadiusEarthRadii) : 0.01;
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
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
    };
    window.addEventListener('resize', handleResize);

    // Trigger initial resize after a small delay to ensure DOM is ready
    const resizeTimeout = setTimeout(() => {
      handleResize();
      renderer.render(scene, camera);
    }, 100);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onCanvasClick);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
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
  }, [data]); // Rebuild scene when data changes

  useEffect(() => {
    const config = statusConfig[status];
    if (planetRef.current) {
        const material = planetRef.current.material as THREE.MeshStandardMaterial;

        // Keep physical colors - only adjust opacity and emissive
        material.opacity = config.opacity;

        // No textures, only adjust emissive glow for status
        if(status === 'confirmed') {
            // Add subtle green glow for confirmed planets
            material.emissive.set(0x00ff88);
            material.emissiveIntensity = 0.2;
        } else if (status === 'false_positive') {
            // Add subtle red glow for false positives
            material.emissive.set(0xff3366);
            material.emissiveIntensity = 0.15;
        } else {
            material.emissive.set(0x000000);
            material.emissiveIntensity = 0;
        }
    }

    // Orbit visibility based on status (orbit disabled)
    // if (orbitRef.current) {
    //   orbitRef.current.visible = status !== 'false_positive';
    // }

    if (status === 'confirmed') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 800);
    }

  }, [status]);

  // Draw light curve
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas completely
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, width, height);

    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    const padding = 35;
    const graphHeight = height - padding * 2;

    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * graphHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Title
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LIGHT CURVE', width / 2, 22);

    // Y-axis labels
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('1.000', padding - 5, padding + 5);
    ctx.fillText('0.995', padding - 5, padding + graphHeight / 2);
    ctx.fillText('0.990', padding - 5, padding + graphHeight);

    // Show transit info if data available
    if (data) {
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '10px monospace';
      const period = data.pl_orbper?.toFixed(1) || 'N/A';
      const depth = data.pl_trandep?.toFixed(0) || 'N/A';
      ctx.fillText(`Period: ${period}d`, 10, height - 25);
      ctx.fillText(`Depth: ${depth} ppm`, 10, height - 10);
    }

    // Draw light curve
    if (lightCurveData.length >= 2) {
      const graphWidth = width - padding * 2;

      ctx.strokeStyle = status === 'confirmed' ? '#00ff88' : '#ffeb3b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      // Use fixed scale around 1.0 for better visibility
      const minScale = 0.990;
      const maxScale = 1.000;
      const range = maxScale - minScale;

      lightCurveData.forEach((brightness, index) => {
        const x = padding + (index / Math.max(lightCurveData.length - 1, 1)) * graphWidth;
        // Clamp brightness to scale
        const clampedBrightness = Math.max(minScale, Math.min(maxScale, brightness));
        const normalizedValue = (clampedBrightness - minScale) / range;
        const y = padding + graphHeight - (normalizedValue * graphHeight);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw current brightness value
      if (lightCurveData.length > 0) {
        const currentBrightness = lightCurveData[lightCurveData.length - 1];
        ctx.textAlign = 'right';
        ctx.fillStyle = status === 'confirmed' ? '#00ff88' : '#ffeb3b';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`${currentBrightness.toFixed(6)}`, width - 10, height - 10);
      }

      // Draw points at transit dips
      ctx.fillStyle = status === 'confirmed' ? '#00ff88' : '#ffeb3b';
      lightCurveData.forEach((brightness, index) => {
        if (brightness < 0.9999) {
          const x = padding + (index / Math.max(lightCurveData.length - 1, 1)) * graphWidth;
          const clampedBrightness = Math.max(minScale, Math.min(maxScale, brightness));
          const normalizedValue = (clampedBrightness - minScale) / range;
          const y = padding + graphHeight - (normalizedValue * graphHeight);

          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    } else {
      // Show "Waiting for data" message
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for transit data...', width / 2, height / 2);
    }

  }, [lightCurveData, status, data]);

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

      {/* Light Curve Display */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 glass-card p-2 rounded-lg shadow-lg" style={{ maxWidth: '90%' }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={140}
          className="rounded"
          style={{ display: 'block' }}
        />
      </div>
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

