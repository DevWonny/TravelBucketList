"use client";

import { useEffect, useRef } from "react";
import * as Three from "three/webgpu";
import { texture, uv } from "three/tsl";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export default function Earth() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) {
      console.log("Mount Ref Null");
      return;
    }

    // Camera
    const camera = new Three.PerspectiveCamera(
      25,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(4.5, 2, 3);

    // Scene
    const scene = new Three.Scene();

    // Light
    const sun = new Three.DirectionalLight("#fff", 2);
    sun.position.set(0, 0, 3);
    scene.add(sun);

    // Texture Loader
    const textureLoader = new Three.TextureLoader();
    const dayTexture = textureLoader.load("/earth.jpg");
    dayTexture.colorSpace = Three.SRGBColorSpace;
    dayTexture.anisotropy = 8;

    // Material
    const globeMaterial = new Three.MeshBasicNodeMaterial();
    globeMaterial.colorNode = texture(dayTexture, uv());

    // Sphere
    const sphereGeometry = new Three.SphereGeometry(1, 64, 64);
    const globe = new Three.Mesh(sphereGeometry, globeMaterial);
    scene.add(globe);

    // Renderer
    const renderer = new Three.WebGPURenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;

    // Resize
    const onResize = () => {
      camera.aspect =
        mountRef.current!.clientWidth / mountRef.current!.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current!.clientWidth,
        mountRef.current!.clientHeight
      );
    };
    window.addEventListener("resize", onResize);

    // Animation Loop
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return <div ref={mountRef} className="w-full h-screen" />;
}
