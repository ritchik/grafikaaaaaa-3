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
const sun = new THREE.DirectionalLight(0xffffff, 2);
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
const sunSphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
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
const intensityInput = document.getElementById('intensity') as HTMLInputElement;
const angleXInput = document.getElementById('angleX') as HTMLInputElement;
const angleYInput = document.getElementById('angleY') as HTMLInputElement;

 

intensityInput?.addEventListener('input', () => {
  sun.intensity = parseFloat(intensityInput.value);
});

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
  
  // 1. ZŁOTO - metaliczne złoto z Phong
  const goldMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xFFD700,           // Pure gold color
    metalness: 1.0,            // Fully metallic
    roughness: 0.1,            // Very smooth for high reflection
    reflectivity: 1.0,         // Maximum reflectivity
    envMapIntensity: 2.0,      // Strong environment reflections
    clearcoat: 0.3,            // Slight clearcoat for extra shine
    clearcoatRoughness: 0.2,   // Slightly rough clearcoat
  });
   
// 2. Materiał z teksturą
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

// Add subtle aberration and distortion
glassMaterial.attenuationColor = new THREE.Color(0xEEFFFF); // Slight blue tint for edge effects
glassMaterial.attenuationDistance = 5.0;                    // Attenuation distance


   
  // 6. HOLOGRAFICZNY - efekt tęczy
  const holographicMaterial = new THREE.MeshPhongMaterial({
    color: 0xd4af37,
    specular: 0xffd700,  // biały połysk
    emissive: 0x332700,
    shininess: 100,      // maksymalny połysk
    envMap: hdrTexture,
    reflectivity: 1.0,   // maksymalna refleksyjność
    transparent: false,
    opacity: 0.8,
    emissiveIntensity: 0.5 
  });
  
  // Dodanie tekstury tęczy dla efektu holograficznego
  //const rainbowTexture = createRainbowTexture(512, 512);
  //holographicMaterial.map = rainbowTexture;
  
  // Marble Material - Polished marble with veins
const marbleMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xF5F5F5,         // Off-white base
  roughness: 0.2,          // Quite smooth
  metalness: 0.0,          // Non-metallic
  clearcoat: 1.0,          // High polish
  clearcoatRoughness: 0.1, // Smooth clearcoat
  envMapIntensity: 0.5     // Moderate reflections
});

// Add marble veining
marbleMaterial.map = (function() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // White background
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const noise = new SimplexNoise();
    
    // Draw veins
    for (let i = 0; i < 5; i++) {
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * canvas.height;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      // Create curvy veins
      let x = startX;
      let y = startY;
      for (let j = 0; j < 30; j++) {
        const noiseVal = noise.noise(i * 0.5, j * 0.1);
        x += Math.cos(noiseVal * Math.PI * 2) * 20;
        y += Math.sin(noiseVal * Math.PI * 2) * 20;
        ctx.lineTo(x, y);
      }
      
      // Set vein color - light gray with transparency
      ctx.strokeStyle = 'rgba(180, 180, 180, 0.6)';
      ctx.lineWidth = 2 + Math.random() * 3;
      ctx.stroke();
    }
    
    // Add secondary veins
    for (let i = 0; i < 15; i++) {
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * canvas.height;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      let x = startX;
      let y = startY;
      for (let j = 0; j < 10; j++) {
        const noiseVal = noise.noise((i + 10) * 0.5, j * 0.2);
        x += Math.cos(noiseVal * Math.PI * 2) * 10;
        y += Math.sin(noiseVal * Math.PI * 2) * 10;
        ctx.lineTo(x, y);
      }
      
      // Thinner, darker veins
      ctx.strokeStyle = 'rgba(120, 120, 120, 0.4)';
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.stroke();
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
})();

const stoneMaterial = new THREE.MeshStandardMaterial({
  color: 0x5A5A5A,          // Medium gray
  roughness: 0.9,           // Very rough
  metalness: 0.0,           // Non-metallic
  bumpScale: 0.8,           // Strong bump effect
});

// Add procedural stone textures
stoneMaterial.bumpMap = (function() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const noise = new SimplexNoise();
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    
    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        // Multi-layered noise for realistic stone texture
        let value = 0;
        value += noise.noise(x/200, y/200) * 0.6;
        value += noise.noise(x/50, y/50) * 0.3;
        value += noise.noise(x/12.5, y/12.5) * 0.1;
        
        value = value * 0.5 + 0.5; // Normalize to 0-1
        const idx = (y * canvas.width + x) * 4;
        imgData.data[idx] = imgData.data[idx+1] = imgData.data[idx+2] = value * 255;
        imgData.data[idx+3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
})();

// Create normal map for stone
stoneMaterial.normalMap = (function() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const noise = new SimplexNoise();
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    
    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        // Create normal vectors from noise
        const scale = 0.02;
        const nx = noise.noise(x * scale, y * scale);
        const ny = noise.noise(x * scale + 100, y * scale);
        const nz = Math.sqrt(1 - nx*nx - ny*ny);
        
        const idx = (y * canvas.width + x) * 4;
        imgData.data[idx]   = (nx + 1) * 127.5; // R
        imgData.data[idx+1] = (ny + 1) * 127.5; // G
        imgData.data[idx+2] = nz * 255;         // B
        imgData.data[idx+3] = 255;              // A
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
})();

stoneMaterial.normalScale = new THREE.Vector2(1.5, 1.5);



 
// Polished Wood - Like high-quality furniture
 
// REALISTIC NATURAL MATERIALS
 

  return {
    gold: goldMaterial,
    stone: goldMaterial ,
    marble: glassMaterial,
    glass:  goldMaterial,
    ceramic: holographicMaterial ,
    holographic:  goldMaterial
    //barkMaterial
    //
  };
}

// Tworzenie obiektów z materiałami 
async function createObjects() {
  // Uzyskaj materiały
  const materials = await createMaterials();
  
  // Rozmieszczenie obiektów w okręgu
  const radius = 3;
  const angleStep = (Math.PI * 2) / 6;
  
  const positions = [];
  for (let i = 0; i < 6; i++) {
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
  const goldSphere = new THREE.Mesh(sphereGeometry, materials.gold);
  goldSphere.position.copy(positions[0]);
  goldSphere.castShadow = true;
  goldSphere.receiveShadow = true;
  scene.add(goldSphere);
  
  const stoneSphere = new THREE.Mesh(sphereGeometry, materials.stone);
  stoneSphere.position.copy(positions[1]);
  stoneSphere.castShadow = true;
  stoneSphere.receiveShadow = true;
  scene.add(stoneSphere);
  
  const marbleSphere = new THREE.Mesh(sphereGeometry, materials.marble);
  marbleSphere.position.copy(positions[2]);
  marbleSphere.castShadow = true;
  marbleSphere.receiveShadow = true;
  scene.add(marbleSphere);
  
  const glassSphere = new THREE.Mesh(sphereGeometry, materials.glass);
  glassSphere.position.copy(positions[3]);
  glassSphere.castShadow = true;
  glassSphere.receiveShadow = true;
  scene.add(glassSphere);
  
  const ceramicSphere = new THREE.Mesh(sphereGeometry, materials.ceramic);
  ceramicSphere.position.copy(positions[4]);
  ceramicSphere.castShadow = true;
  ceramicSphere.receiveShadow = true;
  scene.add(ceramicSphere);
  
  const holographicSphere = new THREE.Mesh(sphereGeometry, materials.holographic);
  holographicSphere.position.copy(positions[5]);
  holographicSphere.castShadow = true;
  holographicSphere.receiveShadow = true;
  scene.add(holographicSphere);
  
  // Dodaj etykiety
  createLabel("Złoto", positions[0]);
  createLabel("Kamień", positions[1]);
  createLabel("Szkło", positions[2]);
  createLabel("-", positions[3]);
  createLabel("Drzewo", positions[4]);
  createLabel("Tkanina", positions[5]);
  
  return {
    goldSphere,
    stoneSphere,
    marbleSphere,
    glassSphere,
    ceramicSphere,
    holographicSphere
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
    objects.goldSphere.rotation.y += 0.01;
    objects.stoneSphere.rotation.y += 0.01;
    objects.marbleSphere.rotation.y += 0.01;
    objects.glassSphere.rotation.y += 0.01;
    objects.ceramicSphere.rotation.y += 0.01;
    objects.holographicSphere.rotation.y += 0.01;
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