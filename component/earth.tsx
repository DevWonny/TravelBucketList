"use client";

import { useEffect, useRef } from "react";
import * as Three from "three/webgpu";
import { texture, uv } from "three/tsl";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";
import * as worldData from "world-atlas/countries-110m.json";

export default function Earth() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) {
      console.log("Mount Ref Null");
      return;
    }

    // Camera (fov, aspect, near, far)
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

    // World Data
    const world = feature(
      worldData as any,
      (worldData as any).objects.countries
    );

    // Raycaster
    const raycaster = new Three.Raycaster();
    const mouse = new Three.Vector2();

    // Click Event
    const onEarthClick = (event: MouseEvent) => {
      if (!mountRef.current) {
        console.log("Earth Click Event Error");
        return;
      }

      // 좌표 (-1 ~ 1)
      mouse.x = (event.clientX / mountRef.current.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / mountRef.current.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(globe);

      if (intersects.length > 0) {
        const point = intersects[0].point.clone().normalize(); // 단위 벡터
        const lat = Math.asin(point.y) * (180 / Math.PI); // 위도
        console.log("🚀 ~ onEarthClick ~ lat:", lat);
        const lon = Math.atan2(point.z, point.x) * (180 / Math.PI); // 경도
        console.log("🚀 ~ onEarthClick ~ lon:", lon);

        // d3-geo로 국가 찾기
        const found = (world as any).features.find((f: any) => {
          geoContains(f, [lon, lat]);
        });

        if (found) {
          console.log(found);
          alert(`국가 : ${found.properties.name || "Unknown"}`);
        } else {
          alert("찾을 수 없음.");
        }
      } else {
        console.log("intersects is Empty Array");
      }
    };
    renderer.domElement.addEventListener("click", onEarthClick);

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
