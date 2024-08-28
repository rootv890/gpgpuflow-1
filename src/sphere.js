import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import GUI from 'lil-gui';

import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

import wobbleVertexShader from './shaders/wobble/vertex.glsl';
import wobbleFragmentShader from './shaders/wobble/fragment.glsl';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 325 });
const debugObject = {};

// Canvas
const canvas = document.querySelector('canvas.sphereWebgl');

// Scene
const scene = new THREE.Scene();

// Loaders
const rgbeLoader = new RGBELoader(); // For environment map
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Environment map
 */
rgbeLoader.load('./urban_alley_01_1k.hdr', (environmentMap) => {
	environmentMap.mapping = THREE.EquirectangularReflectionMapping;

	scene.background = environmentMap;
	scene.environment = environmentMap;
});

/**
 * Wobble
 */

// Uniforms

debugObject.colorA = '#fffd4b';
debugObject.colorB = '#e9650a';

const uniforms = {
	uTime: new THREE.Uniform(0),
	uPositionFrequency: new THREE.Uniform(0.42),
	uTimeFrequency: new THREE.Uniform(0.4),
	uStrength: new THREE.Uniform(0.3),

	// Warpped Positions
	uWarppedPositionFrequency: new THREE.Uniform(0.38),
	uWarppedTimeFrequency: new THREE.Uniform(0.12),
	uWarppedStrength: new THREE.Uniform(1.7),

	uColorA: new THREE.Uniform(new THREE.Color(debugObject.colorA)),
	uColorB: new THREE.Uniform(new THREE.Color(debugObject.colorB)),
};

// Material

const material = new CustomShaderMaterial({
	// CSM
	baseMaterial: THREE.MeshPhysicalMaterial,
	vertexShader: wobbleVertexShader,
	fragmentShader: wobbleFragmentShader,
	silent: true,

	uniforms: {
		uShift: new THREE.Uniform(0.01),
		// time , PositionFreuqncy, TimeFrequence, Strength
		...uniforms, // spread the uniforms
	},

	// Mesh Physical Material
	metalness: 0,
	roughness: 0.5,
	color: '#ffffff',
	transmission: 0, // How much light passes through
	ior: 1.5, // Index of refraction
	thickness: 1.5,
	// transparent: true,
	// wireframe: true,
});

const depthMaterial = new CustomShaderMaterial({
	// CSM
	baseMaterial: THREE.MeshDepthMaterial,
	vertexShader: wobbleVertexShader,
	silent: true,

	uniforms: uniforms,
	// Mesh Depth Material
	depthPacking: THREE.RGBADepthPacking, // encodes depth in RGBA channel
});

// Tweaks
gui
	.addColor(debugObject, 'colorA')
	.name('Color A')
	.onChange(() => {
		uniforms.uColorA.value.set(debugObject.colorA);
	});
gui
	.addColor(debugObject, 'colorB')
	.name('Color B')
	.onChange(() => {
		uniforms.uColorB.value.set(debugObject.colorB);
	});

gui
	.add(uniforms.uPositionFrequency, 'value')
	.min(0.1)
	.max(2.0)
	.step(0.001)
	.name('Position Frequency');

gui
	.add(uniforms.uTimeFrequency, 'value')
	.min(0.1)
	.max(2.0)
	.step(0.001)
	.name('Time Frequency');

gui
	.add(uniforms.uStrength, 'value')
	.min(0.1)
	.max(2.0)
	.step(0.001)
	.name('Strength');

gui
	.add(uniforms.uWarppedPositionFrequency, 'value')
	.min(0.1)
	.max(2.0)
	.step(0.001)
	.name('Position Warpped Frequency');

gui
	.add(uniforms.uWarppedTimeFrequency, 'value')
	.min(0.1)
	.max(2.0)
	.step(0.001)
	.name('Time Warpped Frequency');

gui
	.add(uniforms.uWarppedStrength, 'value')
	.min(0.1)
	.max(2.0)
	.step(0.001)
	.name(' WarppedStrength');

gui.add(material, 'metalness', 0, 1, 0.001);
gui.add(material, 'roughness', 0, 1, 0.001);
gui.add(material, 'transmission', 0, 1, 0.001);
gui.add(material, 'ior', 0, 10, 0.001);
gui.add(material, 'thickness', 0, 10, 0.001);

gui
	.add(material.uniforms.uShift, 'value')
	.min(0.1)
	.max(1.0)
	.step(0.001)
	.name('Shift');

// // ^ Geometry
// let geometry = new THREE.IcosahedronGeometry(2.5, 50);

// geometry = mergeVertices(geometry); // We get the indexed geometry

// geometry.computeTangents(); // gives us the tangents
// // console.log(geometry.attributes); tangents are added

// // Mesh
// const wobble = new THREE.Mesh(geometry, material);
// wobble.customDepthMaterial = depthMaterial; // for shadow
// wobble.receiveShadow = true;
// mergeVertices;
// wobble.castShadow = true;
// scene.add(wobble);

let models = {
	names: ['suzanne', 'icosahedron'],
};

const loadModel = (model, type) => {
	if (type === 'gltf') {
		gltfLoader.load(model, (gltf) => {
			const wobble = gltf.scene.children[0];
			wobble.receiveShadow = true;
			wobble.castShadow = true;
			wobble.material = material;
			wobble.customDepthMaterial = depthMaterial;
			wobble.rotation.y = Math.PI * 0.5;
			scene.add(wobble);
		});
	} else if (type === 'geometry') {
		let geometry = new THREE.IcosahedronGeometry(2.5, 50);
		geometry = mergeVertices(geometry);
		geometry.computeTangents();

		const wobble = new THREE.Mesh(geometry, material);
		wobble.receiveShadow = true;
		wobble.castShadow = true;
		wobble.material = material;
		wobble.customDepthMaterial = depthMaterial;
		wobble.rotation.y = Math.PI * 0.5;
		scene.add(wobble);
	}
};

gui
	.add(models, 'names', models.names)
	.name('Models')
	.onChange((value) => {
		// Remove the current model

		// Load the new model
		if (value === 'suzanne') {
			scene.remove(scene.children[scene.children.length - 1]);
			loadModel('./suzanne.glb', 'gltf');
		} else if (value === 'icosahedron') {
			scene.remove(scene.children[scene.children.length - 1]);

			loadModel(models.names[1], 'geometry');
		} else {
			console.log('No model found');
		}
	});

/**
 * Plane
 */
const plane = new THREE.Mesh(
	new THREE.PlaneGeometry(15, 15, 15),
	new THREE.MeshStandardMaterial(),
);
plane.receiveShadow = true;
plane.rotation.y = Math.PI;
plane.position.y = -5;
plane.position.z = 5;
scene.add(plane);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 2, -2.25);
scene.add(directionalLight);

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
camera.position.set(13, -3, -5);
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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// Materials
	uniforms.uTime.value = elapsedTime;

	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
