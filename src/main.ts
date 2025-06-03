import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// ============= WŁASNA IMPLEMENTACJA ŚWIATŁA =============

class CustomLight {
  position: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
  
  constructor(color: number = 0x000000, intensity: number = 1) {
    this.position = new THREE.Vector3(0, 0, 0);
    this.color = new THREE.Color(color);
    this.intensity = intensity;
  }
  
  // Oblicz oświetlenie w danym punkcie
  calculateLighting(
    worldPosition: THREE.Vector3, 
    normal: THREE.Vector3, 
    viewDirection: THREE.Vector3,
    material: any
  ): { diffuse: number; specular: number; attenuation: number } {
    
    const lightDirection = this.position.clone().sub(worldPosition).normalize();
    const distance = this.position.distanceTo(worldPosition);
    
    const attenuation = 1.0 / (1.0 + 0.1 * distance + 0.01 * distance * distance);
    
    const diffuseStrength = Math.max(0, normal.dot(lightDirection));
    const diffuse = diffuseStrength * this.intensity * attenuation;
    
    const reflectDirection = lightDirection.clone().negate().reflect(normal);
    const specularStrength = Math.pow(Math.max(0, viewDirection.dot(reflectDirection)), 32);
    const specular = specularStrength * this.intensity * attenuation;
    
    return { diffuse, specular, attenuation };
  }
}
 

 
// ============= SCENA THREE.JS (ZACHOWANA) =============

// Scena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0.5, 0.7, 1.0);
//tu
// Kamera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5); // X=0, Y=2, Z=5

// Renderer z zachowanymi ustawieniami
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = false;  // USUNIĘTE - nie używamy shadow mapping
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Kontroler kamery
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 20;

 

// USUNIĘTE - Three.js DirectionalLight dla cieni - zastąpione własnym światłem

//   Ambient Light
//const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
//scene.add(ambientLight);

//   Hemisphere Light
//const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
//scene.add(hemisphereLight);

 
//tu1
// WŁASNE ŚWIATŁO  
const customLight = new CustomLight(0xffffff, 2.0);
customLight.position.set(5, 8, 5); // X=5, Y=8, Z=5

// Mała kula reprezentująca nasze własne słońce
const sunSphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sunSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sunSphere = new THREE.Mesh(sunSphereGeometry, sunSphereMaterial);
scene.add(sunSphere);

// UI kontrolki (zachowane)
const angleXInput = document.getElementById('angleX') as HTMLInputElement;
const angleYInput = document.getElementById('angleY') as HTMLInputElement;
const angleZInput = document.getElementById('angleZ') as HTMLInputElement;
const lightDistanceInput = document.getElementById('lightDistance') as HTMLInputElement;

//   Zmienne dla environment reflections
let cubeRenderTarget: THREE.WebGLCubeRenderTarget;
let cubeCamera: THREE.CubeCamera;
let envScene: THREE.Scene;
let lightSphere: THREE.Mesh;
let materialsToUpdate: THREE.Material[] = [];
let customMaterials: THREE.ShaderMaterial[] = [];

//   Environment reflections
function initEnvironmentReflections() {
  cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
  
  envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0.5, 0.7, 1.0);
  
  lightSphere = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 32),
    new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: false,
      opacity: 1.0
    })
  );
  envScene.add(lightSphere);
  
   
}

//  Update environment reflections
function updateEnvironmentReflections() {
  if (!cubeCamera || !envScene || !lightSphere) return;
  //tu2
  lightSphere.position.copy(customLight.position);
  cubeCamera.position.set(0, 1, 0);
  cubeCamera.update(renderer, envScene);
  
  materialsToUpdate.forEach(material => {
    if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
      material.envMap = cubeRenderTarget.texture;
      material.needsUpdate = true;
    }
  });
}

//   HDR loading
async function loadHDR() {
  const rgbeLoader = new RGBELoader();
  const hdrTexture = await rgbeLoader.loadAsync('https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr');
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdrTexture;
  return hdrTexture;
}

function updateLightPositionFromControls() {
  const angleX = parseFloat(angleXInput?.value || '30');
  const angleY = parseFloat(angleYInput?.value || '45');
  const angleZ = parseFloat(angleZInput?.value || '0');
  const distance = parseFloat(lightDistanceInput?.value || '8');
  updateSunPosition(angleX, angleY, angleZ, distance);
}

angleXInput?.addEventListener('input', updateLightPositionFromControls);
angleYInput?.addEventListener('input', updateLightPositionFromControls);
angleZInput?.addEventListener('input', updateLightPositionFromControls);
lightDistanceInput?.addEventListener('input', updateLightPositionFromControls);

//  logika rotacji + aktualizacja cieni
function updateSunPosition(angleX: number, angleY: number, angleZ: number, distance: number) {
  const radX = THREE.MathUtils.degToRad(angleX);
  const radY = THREE.MathUtils.degToRad(angleY);
  const radZ = THREE.MathUtils.degToRad(angleZ);

  let position = new THREE.Vector3(0, 0, distance);
  
  if (angleX !== 0) {
    const rotationX = new THREE.Matrix4().makeRotationX(radX);
    position.applyMatrix4(rotationX);
  }
  
  if (angleY !== 0) {
    const rotationY = new THREE.Matrix4().makeRotationY(radY);
    position.applyMatrix4(rotationY);
  }
  
  if (angleZ !== 0) {
    const rotationZ = new THREE.Matrix4().makeRotationZ(radZ);
    position.applyMatrix4(rotationZ);
  }
  
 // if (position.y < 1) {
 //   position.y = Math.abs(position.y) + 1;
 // }

  // Aktualizuj tylko własne światło
  customLight.position.copy(position);
  sunSphere.position.copy(position);
  
 
  // Aktualizuj własne materiały
  customMaterials.forEach(material => {
    material.uniforms.customLightPosition.value.copy(customLight.position);
  });
  
  //   Environment reflections
  updateEnvironmentReflections();
  
  console.log('Angles (deg) - X:', angleX, 'Y:', angleY, 'Z:', angleZ);
  console.log('Sun position:', position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2));
}

 
// Tworzenie materiałów - hybrydowe (własne + Three.js)
async function createMaterials() {
  const hdrTexture = await loadHDR();  //  
  
  // Materiały Three.js dla standardowych obiektów (zachowują environment mapping)
  const matteMaterial = new THREE.MeshStandardMaterial({
    color: 0x98fb98, 
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.3,
    envMap: cubeRenderTarget.texture
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xC0C0C0,
    metalness: 0.6,
    roughness: 0.1,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 1.2
});

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    transparent: true,
    opacity: 0.6,
    reflectivity: 0.9,
    ior: 1.5,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 2.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    thickness: 0.5
  });

  const plasticMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x003366,
    metalness: 0.0,
    roughness: 0.5,
    clearcoat: 0.5,
    clearcoatRoughness: 0.4,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 1.5
  });

  //   materials to update
  materialsToUpdate = [goldMaterial, glassMaterial, plasticMaterial,matteMaterial];

  return {
    matte: matteMaterial,
    gold: goldMaterial,
    glass: glassMaterial,
    plastic: plasticMaterial
  };
}

// Tworzenie obiektów (zachowane)
async function createObjects() {
  const materials = await createMaterials();
  
  const radius = 3;
  const angleStep = (Math.PI * 2) / 4;
  
  const positions = [];
  for (let i = 0; i < 4; i++) {
    const angle = i * angleStep;
    positions.push(new THREE.Vector3(
      Math.cos(angle) * radius, 
      1, 
      Math.sin(angle) * radius
    ));
  }
  
  const sphereGeometry = new THREE.SphereGeometry(0.7, 64, 64);
  
  const matteSphere = new THREE.Mesh(sphereGeometry, materials.matte);
  matteSphere.position.copy(positions[0]);
  matteSphere.castShadow = false;  // USUNIĘTE - bez shadow mapping
  matteSphere.receiveShadow = false;
  scene.add(matteSphere);
  
  const goldSphere = new THREE.Mesh(sphereGeometry, materials.gold);
  goldSphere.position.copy(positions[1]);
  goldSphere.castShadow = false;  // USUNIĘTE - bez shadow mapping
  goldSphere.receiveShadow = false;
  scene.add(goldSphere);
  
  const glassSphere = new THREE.Mesh(sphereGeometry, materials.glass);
  glassSphere.position.copy(positions[2]);
  glassSphere.castShadow = false;  // USUNIĘTE - bez shadow mapping
  glassSphere.receiveShadow = false;
  scene.add(glassSphere);

  const plasticSphere = new THREE.Mesh(sphereGeometry, materials.plastic);
  plasticSphere.position.copy(positions[3]);
  plasticSphere.castShadow = false;  // USUNIĘTE - bez shadow mapping
  plasticSphere.receiveShadow = false;
  scene.add(plasticSphere);
  
  //   Labels
  createLabel("Matte", positions[0]);
  createLabel("Silver", positions[1]);
  createLabel("Glass", positions[2]);
  createLabel("Plastic", positions[3]);
  
  return {
    matteSphere,
    goldSphere,
    glassSphere,
    plasticSphere
  };
}

//  Labels
function createLabel(text: string, position: THREE.Vector3) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  
  if (context) {
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '24px Arial';
    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position).add(new THREE.Vector3(0, 1.2, 0));
    sprite.scale.set(1, 0.5, 1);
    scene.add(sprite);
  }
}

 
async function init() {
  initEnvironmentReflections();  
  
  const initialAngleX = parseFloat(angleXInput?.value || '30');
  const initialAngleY = parseFloat(angleYInput?.value || '45');
  const initialAngleZ = parseFloat(angleZInput?.value || '0');
  const initialDistance = parseFloat(lightDistanceInput?.value || '8');
  updateSunPosition(initialAngleX, initialAngleY, initialAngleZ, initialDistance);
  
  const objects = await createObjects();
  
  updateEnvironmentReflections();   
  
  
  function animateObjects() {
    objects.matteSphere.rotation.y += 0.01;
    objects.goldSphere.rotation.y += 0.01;
    objects.glassSphere.rotation.y += 0.01;
    objects.plasticSphere.rotation.y += 0.01;
  }
  
  function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    animateObjects();
    
    renderer.render(scene, camera);
  }
  
  animate();
}

init();

 
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

 
const style = document.createElement('style');
style.textContent = `
  body {
    margin: 0;
    overflow: hidden;
    font-family: Arial, sans-serif;
  }
  canvas {
    display: block;
  }
  select, input {
    margin-top: 5px;
  }
`;
document.head.appendChild(style);