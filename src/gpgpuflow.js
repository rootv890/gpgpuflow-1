import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import GUI from 'lil-gui';
import particlesVertexShader from './shaders/particles/vertex.glsl';
import particlesFragmentShader from './shaders/particles/fragment.glsl';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import gpgpuParticlesShader from './shaders/gpgpu/particles.glsl';

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 });
// close by default
// gui.close();
const debugObject = {};

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
	pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;
	sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

	// Materials
	particles.material.uniforms.uResolution.value.set(
		sizes.width * sizes.pixelRatio,
		sizes.height * sizes.pixelRatio,
	);

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	35,
	sizes.width / sizes.height,
	0.1,
	100,
);
camera.position.set(4.5, 4, 11);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

debugObject.clearColor = '#1f1f1f';
renderer.setClearColor(debugObject.clearColor);

/**
 * ^ Load Model
 **/

const gltf = await gltfLoader.loadAsync('./model.glb');

/**
 * Base Geometry
 **/

const baseGeometry = {};
baseGeometry.instance = gltf.scene.children[0].geometry;
baseGeometry.count = baseGeometry.instance.attributes.position.count;
console.log(baseGeometry.instance.attributes.color);

/**
 * GPU Compute
 **/

const GPGPU = {};

GPGPU.size = Math.ceil(Math.sqrt(baseGeometry.count)); //For FBO // 24
GPGPU.computation = new GPUComputationRenderer(
	GPGPU.size,
	GPGPU.size,
	renderer,
);

// Each data type handeled in computationRenderer is called a //^'variable'

// Base Particles
const baseParticlesTexture = GPGPU.computation.createTexture(); // creates texture for use in computation

// Fill  Particles

for (let i = 0; i < baseGeometry.count; i++) {
	// positions
	// baseGeometry.instance.attributes.position.
	const i3 = i * 3;
	const i4 = i * 4;

	// Positions base don geoemetry
	baseParticlesTexture.image.data[i4 + 0] =
		baseGeometry.instance.attributes.position.array[i3 + 0];

	baseParticlesTexture.image.data[i4 + 1] =
		baseGeometry.instance.attributes.position.array[i3 + 1];

	baseParticlesTexture.image.data[i4 + 2] =
		baseGeometry.instance.attributes.position.array[i3 + 2];

	baseParticlesTexture.image.data[i4 + 3] = Math.random(); //alpha
}

// Particles Variable
GPGPU.particlesVariable = GPGPU.computation.addVariable(
	'uParticles', // Name of the variable
	gpgpuParticlesShader, // Shader to be used
	baseParticlesTexture, // Texture to be used
);

console.log(GPGPU.particlesVariable.material);

GPGPU.computation.setVariableDependencies(
	GPGPU.particlesVariable,
	/* Dependencies */
	[GPGPU.particlesVariable],
); //self-dependency

// Uniforms
GPGPU.particlesVariable.material.uniforms.uTime = new THREE.Uniform(0);
GPGPU.particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0);
GPGPU.particlesVariable.material.uniforms.uBase = new THREE.Uniform(
	baseParticlesTexture,
);
GPGPU.particlesVariable.material.uniforms.uFlowFlieldInfluence =
	new THREE.Uniform(0.5);
GPGPU.particlesVariable.material.uniforms.uFlowFlieldStrength =
	new THREE.Uniform(2);
GPGPU.particlesVariable.material.uniforms.uFlowFlieldFrequency =
	new THREE.Uniform(0.5);

// init
GPGPU.computation.init();

// Debug
GPGPU.debug = new THREE.Mesh(
	// new THREE.PlaneGeometry(3, 3),
	baseGeometry.instance,
	new THREE.MeshBasicMaterial({
		map: GPGPU.computation.getCurrentRenderTarget(GPGPU.particlesVariable)
			.texture,
	}),
);

GPGPU.debug.position.x = 5;
GPGPU.debug.position.y = 2;
// scene.add(GPGPU.debug);

/**
 * Particles
 */
const particles = {};

// Geometry

const particlesUvArray = new Float32Array(baseGeometry.count * 2);
const sizesArray = new Float32Array(baseGeometry.count);

for (let y = 0; y < GPGPU.size; y++) {
	for (let x = 0; x < GPGPU.size; x++) {
		const i = y * GPGPU.size + x;
		const i2 = i * 2;

		// Particles UV
		const uvX = (x + 0.5) / GPGPU.size;
		const uvY = (y + 0.5) / GPGPU.size;
		particlesUvArray[i2 + 0] = uvX;
		particlesUvArray[i2 + 1] = uvY;

		// Size
		sizesArray[i] = Math.random();
	}
}

// console.log(particlesUvArray);

particles.geometry = new THREE.BufferGeometry();
particles.geometry.setDrawRange(0, baseGeometry.count); //TODO Change the range for experimentation later
particles.geometry.setAttribute(
	'aParticlesUv',
	new THREE.BufferAttribute(particlesUvArray, 2),
);
particles.geometry.setAttribute(
	'aColor',
	baseGeometry.instance.attributes.color,
);
particles.geometry.setAttribute(
	'aSize',
	new THREE.BufferAttribute(sizesArray, 1),
);

// Material
particles.material = new THREE.ShaderMaterial({
	vertexShader: particlesVertexShader,
	fragmentShader: particlesFragmentShader,
	uniforms: {
		uSize: new THREE.Uniform(0.07),
		uResolution: new THREE.Uniform(
			new THREE.Vector2(
				sizes.width * sizes.pixelRatio,
				sizes.height * sizes.pixelRatio,
			),
		),
		uParticlesTexture: new THREE.Uniform(),
	},
});

// Points
particles.points = new THREE.Points(particles.geometry, particles.material);
scene.add(particles.points);

/**
 * Tweaks
 */
gui.addColor(debugObject, 'clearColor').onChange(() => {
	renderer.setClearColor(debugObject.clearColor);
});
gui
	.add(particles.material.uniforms.uSize, 'value')
	.min(0)
	.max(1)
	.step(0.001)
	.name('uSize');

gui
	.add(GPGPU.particlesVariable.material.uniforms.uFlowFlieldInfluence, 'value')
	.min(0)
	.max(1)
	.step(0.001)
	.name('FlowFlieldInfluence');

gui
	.add(GPGPU.particlesVariable.material.uniforms.uFlowFlieldStrength, 'value')
	.min(0)
	.max(10)
	.step(0.1)
	.name('FlowFlieldStrength');

gui
	.add(GPGPU.particlesVariable.material.uniforms.uFlowFlieldFrequency, 'value')
	.min(0)
	.max(1)
	.step(0.001)
	.name('FlowFlieldFrequency');

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
	const elapsedTime = clock.getElapsedTime();
	// const deltaTime = Math.min(elapsedTime - previousTime, 1 / 30);
	const deltaTime = elapsedTime - previousTime;

	previousTime = elapsedTime;

	// Update controls
	controls.update();

	// Update Time
	GPGPU.particlesVariable.material.uniforms.uTime.value = elapsedTime;
	GPGPU.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime;

	// Update GPU Compute
	GPGPU.computation.compute();
	particles.material.uniforms.uParticlesTexture.value =
		GPGPU.computation.getCurrentRenderTarget(GPGPU.particlesVariable).texture;

	// Render normal scene
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
