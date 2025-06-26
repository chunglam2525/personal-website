'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Color {
  top: THREE.Color;
  bottom: THREE.Color;
  ambient: {
    color: number;
    intensity: number;
  };
}
function getTimeBasedColors(time: number) {
  const hour = time % 24;
  
  const colors: Record<string, Color> = {
    night: {
      top: new THREE.Color(0x000033),
      bottom: new THREE.Color(0x000066),
      ambient: { color: 0x222244, intensity: 0.3 }
    },
    sunrise: {
      top: new THREE.Color(0xff6600),
      bottom: new THREE.Color(0xffaa33),
      ambient: { color: 0xffaa88, intensity: 0.6 }
    },
    day: {
      top: new THREE.Color(0x0077ff),
      bottom: new THREE.Color(0xffffff),
      ambient: { color: 0xffffff, intensity: 1.0 }
    },
    sunset: {
      top: new THREE.Color(0xff3300),
      bottom: new THREE.Color(0xff9933),
      ambient: { color: 0xff8866, intensity: 0.7 }
    },
    evening: {
      top: new THREE.Color(0x330066),
      bottom: new THREE.Color(0x663399),
      ambient: { color: 0x443366, intensity: 0.4 }
    }
  };

  // Interpolation function
  function interpolateColors(color1: Color, color2: Color, factor: number) {
    return {
      top: new THREE.Color().lerpColors(color1.top, color2.top, factor),
      bottom: new THREE.Color().lerpColors(color1.bottom, color2.bottom, factor),
      ambient: {
        color: new THREE.Color().lerpColors(
          new THREE.Color(color1.ambient.color),
          new THREE.Color(color2.ambient.color),
          factor
        ).getHex(),
        intensity: color1.ambient.intensity + (color2.ambient.intensity - color1.ambient.intensity) * factor
      }
    };
  }

  if (hour >= 0 && hour < 6) {
    const factor = (hour - 0) / 6;
    return interpolateColors(colors.evening, colors.night, factor);
  } else if (hour >= 6 && hour < 8) {
    const factor = (hour - 6) / 2;
    return interpolateColors(colors.night, colors.sunrise, factor);
  } else if (hour >= 8 && hour < 16) {
    const factor = (hour - 8) / 6;
    return interpolateColors(colors.sunrise, colors.day, Math.min(factor * 2, 1));
  } else if (hour >= 16 && hour < 18) {
    const factor = (hour - 16) / 2;
    return interpolateColors(colors.day, colors.sunset, factor);
  } else {
    const factor = (hour - 18) / 6;
    return interpolateColors(colors.sunset, colors.evening, factor);
  }
}

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const frameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    currentMount.appendChild(renderer.domElement);

    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `;

    // Create gradient sky with initial colors
    const gradientSkyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const gradientSkyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide
    });
    const gradientSkyMesh = new THREE.Mesh(gradientSkyGeometry, gradientSkyMaterial);
    scene.add(gradientSkyMesh);

    // Create ambient light with initial values
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const loader = new GLTFLoader();
    loader.load(
      '/class_room.glb',
      (gltf) => {
        const classroomModel = gltf.scene;
        classroomModel.scale.setScalar(0.1);
        classroomModel.position.set(0, 0, 0);
        scene.add(classroomModel);
      }
    );

    camera.position.set(-8, 13, -25);
    camera.lookAt(0, 5, 5);

    const animate = () => {
      frameId.current = requestAnimationFrame(animate);
      
      const now = new Date();
      const currentTime = now.getHours() + now.getMinutes() / 60;
      
      const timeColors = getTimeBasedColors(currentTime);
      
      gradientSkyMaterial.uniforms.topColor.value = timeColors.top;
      gradientSkyMaterial.uniforms.bottomColor.value = timeColors.bottom;
      
      ambientLight.color.setHex(timeColors.ambient.color);
      ambientLight.intensity = timeColors.ambient.intensity;
      
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      window.removeEventListener('resize', handleResize);
      
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-1"
    />
  );
}