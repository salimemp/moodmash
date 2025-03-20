// Mock Three.js for testing
// This mock provides all the necessary classes and methods used by MoodAR

// Mock classes
class Vector3 {
  x: number;
  y: number;
  z: number;
  
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  
  copy(v: Vector3) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
}

class Euler {
  x: number;
  y: number;
  z: number;
  
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
}

class Color {
  r: number;
  g: number;
  b: number;
  
  constructor(r?: number | string, g?: number, b?: number) {
    this.r = typeof r === 'number' ? r : 1;
    this.g = g || 1;
    this.b = b || 1;
  }
  
  set(_color: number | string) {
    // Intentionally not implemented for mock
    return this;
  }
}

// Base classes
class Object3D {
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
  parent: Object3D | null = null;
  children: Object3D[] = [];
  
  constructor() {
    this.position = new Vector3();
    this.rotation = new Euler();
    this.scale = new Vector3(1, 1, 1);
  }
  
  add(object: Object3D) {
    if (object === this) return this;
    
    if (object.parent !== null) {
      object.parent.remove(object);
    }
    
    object.parent = this;
    this.children.push(object);
    
    return this;
  }
  
  remove(object: Object3D) {
    const index = this.children.indexOf(object);
    
    if (index !== -1) {
      object.parent = null;
      this.children.splice(index, 1);
    }
    
    return this;
  }
}

// Base Geometry class
class BufferGeometry {
  type: string = 'BufferGeometry';
  
  constructor() {
    // nothing needed
  }
  
  dispose() {
    // Clean up resources
  }
}

// Concrete geometry types
class BoxGeometry extends BufferGeometry {
  type: string = 'BoxGeometry';
  width: number;
  height: number;
  depth: number;
  
  constructor(width = 1, height = 1, depth = 1) {
    super();
    this.width = width;
    this.height = height;
    this.depth = depth;
  }
}

class SphereGeometry extends BufferGeometry {
  type: string = 'SphereGeometry';
  radius: number;
  
  constructor(radius = 1, _widthSegments = 32, _heightSegments = 16) {
    super();
    this.radius = radius;
    // Segmentation parameters not used in mock
  }
}

class ConeGeometry extends BufferGeometry {
  type: string = 'ConeGeometry';
  radius: number;
  height: number;
  
  constructor(radius = 1, height = 1, _radialSegments = 8) {
    super();
    this.radius = radius;
    this.height = height;
    // Segmentation parameter not used in mock
  }
}

class TorusGeometry extends BufferGeometry {
  type: string = 'TorusGeometry';
  radius: number;
  
  constructor(radius = 1, _tube = 0.4, _radialSegments = 8, _tubularSegments = 6) {
    super();
    this.radius = radius;
    // Other parameters not used in mock
  }
}

class OctahedronGeometry extends BufferGeometry {
  type: string = 'OctahedronGeometry';
  radius: number;
  
  constructor(radius = 1, _detail = 0) {
    super();
    this.radius = radius;
    // Detail parameter not used in mock
  }
}

// Materials
class Material {
  transparent: boolean = false;
  opacity: number = 1;
  color: Color = new Color();
  
  constructor() {
    // nothing needed
  }
  
  dispose() {
    // Clean up resources
  }
}

class MeshBasicMaterial extends Material {
  wireframe: boolean = false;
  
  constructor(_parameters: any = {}) {
    super();
    
    if (_parameters.color !== undefined) this.color = new Color(_parameters.color);
    if (_parameters.wireframe !== undefined) this.wireframe = _parameters.wireframe;
    if (_parameters.transparent !== undefined) this.transparent = _parameters.transparent;
    if (_parameters.opacity !== undefined) this.opacity = _parameters.opacity;
  }
}

class MeshStandardMaterial extends Material {
  roughness: number = 0.5;
  metalness: number = 0.5;
  
  constructor(_parameters: any = {}) {
    super();
    
    if (_parameters.color !== undefined) this.color = new Color(_parameters.color);
    if (_parameters.roughness !== undefined) this.roughness = _parameters.roughness;
    if (_parameters.metalness !== undefined) this.metalness = _parameters.metalness;
    if (_parameters.transparent !== undefined) this.transparent = _parameters.transparent;
    if (_parameters.opacity !== undefined) this.opacity = _parameters.opacity;
  }
}

// Mesh
class Mesh extends Object3D {
  geometry: BufferGeometry;
  material: Material;
  
  constructor(geometry?: BufferGeometry, material?: Material) {
    super();
    this.geometry = geometry || new BufferGeometry();
    this.material = material || new MeshBasicMaterial();
  }
}

// Renderer, scene, camera
class WebGLRenderer {
  domElement: HTMLCanvasElement;
  
  constructor(_parameters: any = {}) {
    this.domElement = document.createElement('canvas');
    // Parameters not used in mock
  }
  
  setSize(width: number, height: number) {
    this.domElement.width = width;
    this.domElement.height = height;
  }
  
  setPixelRatio(_ratio: number) {
    // Ratio parameter not used in mock
  }
  
  setClearColor(_color: any, _alpha?: number) {
    // Mock implementation
  }
  
  render(_scene: Scene, _camera: PerspectiveCamera) {
    // Scene and camera parameters not used in mock
  }
  
  dispose() {
    // Clean up
  }
}

class Scene extends Object3D {
  background: Color | null = null;
  
  constructor() {
    super();
  }
}

class PerspectiveCamera extends Object3D {
  fov: number;
  aspect: number;
  near: number;
  far: number;
  
  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    super();
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }
  
  updateProjectionMatrix() {
    // Mock update
  }
}

// Mock collection to track mesh objects for testing
const __mockMeshes = new Map();

// Create exports
const THREE = {
  Vector3,
  Euler,
  Color,
  Object3D,
  BufferGeometry,
  BoxGeometry,
  SphereGeometry,
  ConeGeometry,
  TorusGeometry,
  OctahedronGeometry,
  Material,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Mesh,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  __mockMeshes // For test verification
};

// Store created meshes to allow inspection in tests
const originalMesh = THREE.Mesh;
THREE.Mesh = function(geometry?: BufferGeometry, material?: Material) {
  const mesh = new originalMesh(geometry, material);
  __mockMeshes.set(mesh, { geometry, material });
  return mesh;
} as any;

// Export all the THREE properties
module.exports = THREE; 