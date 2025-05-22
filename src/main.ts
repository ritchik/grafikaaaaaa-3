import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
 


// Scena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0.5, 0.7, 1.0); // kolor nieba

// Kamera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

// Renderer z zaawansowanymi ustawieniami
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
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

// Animacja rotacji obiektów
  
  controls.update();
  renderer.render(scene, camera);
 ;


// Podłoże
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x777777,
  roughness: 0.8,
  metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Słońce - Directional Light
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(3, 5, 2);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 50;
sun.shadow.camera.left = -10;
sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10;
sun.shadow.camera.bottom = -10;
scene.add(sun);

// Ambient Light dla lepszego wypełnienia cieni
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Hemisphere Light dla lepszego oświetlenia z góry/dołu
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 0.3);
scene.add(hemisphereLight);

// Mała kula reprezentująca Słońce
const sunSphereGeometry = new THREE.SphereGeometry(1, 64, 64);
const sunSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sunSphere = new THREE.Mesh(sunSphereGeometry, sunSphereMaterial);
scene.add(sunSphere);

// Aktualizacja pozycji światła i słońca
function updateSunPosition(angleX: number, angleY: number) {
  const radX = THREE.MathUtils.degToRad(angleX);
  const radY = THREE.MathUtils.degToRad(angleY);

  const x = Math.cos(radX) * Math.cos(radY);
  const y = Math.sin(radY);
  const z = Math.sin(radX) * Math.cos(radY);

  sun.position.set(x * 10, y * 10, z * 10);
  sunSphere.position.copy(sun.position);
}

// UI - kontrolki
const angleXInput = document.getElementById('angleX') as HTMLInputElement;
const angleYInput = document.getElementById('angleY') as HTMLInputElement;

angleXInput?.addEventListener('input', () => {
  updateSunPosition(parseFloat(angleXInput.value), parseFloat(angleYInput.value));
});

angleYInput?.addEventListener('input', () => {
  updateSunPosition(parseFloat(angleXInput.value), parseFloat(angleYInput.value));
});

// -----------------------------------------
// REALISTYCZNE MATERIAŁY
// -----------------------------------------

// Funkcja ładująca HDR dla IBL (Image Based Lighting)
async function loadHDR() {
  const rgbeLoader = new RGBELoader();
  const hdrTexture = await rgbeLoader.loadAsync('https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr');
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdrTexture;
  return hdrTexture;
}
 
  

// Tworzymy wszystkie materiały
async function createMaterials() {
  const hdrTexture = await loadHDR();
  
  // Matte Material - Dull, non-reflective surface
  const matteMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,          // Medium gray
    roughness: 1.0,           // Maximum roughness for matte look
    metalness: 0.0,           // Non-metallic
    envMapIntensity: 0.0      // No environment reflections
  });

  // Gold Material
  const goldMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xFFD700,           // Pure gold color
    metalness: 1.0,            // Fully metallic
    roughness: 0.1,            // Very smooth for high reflection
    reflectivity: 1.0,         // Maximum reflectivity
    envMapIntensity: 2.0,      // Strong environment reflections
    clearcoat: 0.3,            // Slight clearcoat for extra shine
    clearcoatRoughness: 0.2    // Slightly rough clearcoat
  });

  // Glass Material
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,          // Clear glass
    metalness: 0.0,           // Non-metallic
    roughness: 0.05,          // Very slight roughness for realism
    transmission: 0.95,       // High transmission for transparency
    transparent: true,        // Enable transparency
    opacity: 0.6,             // Slight opacity
    reflectivity: 0.9,        // High reflectivity
    ior: 1.5,                 // Index of refraction for glass
    envMapIntensity: 1.5,     // Strong environment reflections
    clearcoat: 1.0,           // Add clearcoat for more realistic reflections
    clearcoatRoughness: 0.1,  // Slight roughness on the clearcoat
    thickness: 0.5            // Material thickness for refraction
  });

  // Plastic Material
  const plasticMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x003366,          // Dark blue color
    metalness: 0.0,            // Non-metallic
    roughness: 0.5,            // Semi-glossy
    clearcoat: 0.5,            // Moderate clearcoat
    clearcoatRoughness: 0.4,   // Slightly rough clearcoat
    envMapIntensity: 0.8       // Moderate environment reflections
  });

  return {
    matte: matteMaterial,
    gold: goldMaterial,
    glass: glassMaterial,
    plastic: plasticMaterial
  };
}

// Tworzenie obiektów z materiałami 
async function createObjects() {
  // Uzyskaj materiały
  const materials = await createMaterials();
  
  // Rozmieszczenie obiektów w okręgu
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
  
  // Geometria kuli - używamy tej samej dla wszystkich materiałów
  const sphereGeometry = new THREE.SphereGeometry(0.7, 64, 64);
  
  // Tworzenie obiektów
  const matteSphere = new THREE.Mesh(sphereGeometry, materials.matte);
  matteSphere.position.copy(positions[0]);
  matteSphere.castShadow = true;
  matteSphere.receiveShadow = true;
  scene.add(matteSphere);
  
  const goldSphere = new THREE.Mesh(sphereGeometry, materials.gold);
  goldSphere.position.copy(positions[1]);
  goldSphere.castShadow = true;
  goldSphere.receiveShadow = true;
  scene.add(goldSphere);
  
  const glassSphere = new THREE.Mesh(sphereGeometry, materials.glass);
  glassSphere.position.copy(positions[2]);
  glassSphere.castShadow = true;
  glassSphere.receiveShadow = true;
  scene.add(glassSphere);

  const plasticSphere = new THREE.Mesh(sphereGeometry, materials.plastic);
  plasticSphere.position.copy(positions[3]);
  plasticSphere.castShadow = true;
  plasticSphere.receiveShadow = true;
  scene.add(plasticSphere);
  
  // Dodaj etykiety
  createLabel("Matte", positions[0]);
  createLabel("Gold", positions[1]);
  createLabel("Glass", positions[2]);
  createLabel("Plastic", positions[3]);
  
  return {
    matteSphere,
    goldSphere,
    glassSphere,
    plasticSphere
  };
}

// Funkcja do tworzenia etykiet nad obiektami
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

// Funkcja dodająca kontrolki HTML do strony
function addControlsToPage() {
  // Tworzymy div dla kontrolek
  const controlsDiv = document.createElement('div');
  controlsDiv.style.position = 'absolute';
  controlsDiv.style.top = '10px';
  controlsDiv.style.left = '10px';
  controlsDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
  controlsDiv.style.padding = '10px';
  controlsDiv.style.borderRadius = '5px';
  
   
  
  document.body.appendChild(controlsDiv);
}

// Inicjalizacja sceny i obiektów
async function init() {
  // Dodanie kontrolek HTML
  addControlsToPage();
  
  // Inicjalne ustawienie światła
  updateSunPosition(45, 45);
  
  // Tworzenie obiektów z materiałami
  const objects = await createObjects();
  
  // Animacja obiektów - delikatne obracanie się
  function animateObjects() {
    objects.matteSphere.rotation.y += 0.01;
    objects.goldSphere.rotation.y += 0.01;
    objects.glassSphere.rotation.y += 0.01;
    objects.plasticSphere.rotation.y += 0.01;
  }
  
  // Animacja
  function animate() {
    requestAnimationFrame(animate);
    
    // Aktualizacja kontroli orbitowania
    controls.update();
    
    // Animacja obiektów
    animateObjects();
    
    // Render
    renderer.render(scene, camera);
  }
  
  animate();
}

// Uruchom inicjalizację
init();

// Obsługa zmiany rozmiaru okna
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Dodanie stylów CSS do strony
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