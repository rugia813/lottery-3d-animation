import * as THREE from "three";
import * as CANNON from "cannon";
import { Ball } from "./Ball";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { HDRCubeTextureLoader } from "./HDRCubeTextureLoader";
import { RoughnessMipmapper } from './RoughnessMipmapper.js';
import { RGBELoader } from './RGBELoader.js';
import hdr from './royal_esplanade_1k.hdr'
import Stats from './stats.module.js';
import { GUI } from 'dat.gui';

let world, scene, camera, renderer, pmremGenerator
let stats;
let envMap;

const balls = []

const guiData = {
    isRunning: false,
    timeStep: 1.0 / 72.0,
    hdr: true,
}
let isRunning = guiData.isRunning
let hdrBg = guiData.hdr
let timeStep = guiData.timeStep

window['t'] = THREE

function init() {
    // STATS
    stats = Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize, false);

    var gui = new GUI();
    gui.add(guiData, 'isRunning').onChange(() => isRunning = !isRunning);
    gui.add(guiData, 'timeStep').min(0).max(0.030).step(0.001).onChange((val) => timeStep = val);
    gui.add(guiData, 'hdr').onChange(() => {
        hdrBg = !hdrBg
        if (hdrBg && envMap) {
            scene.background = envMap;
            scene.environment = envMap;
        } else {
            scene.background = new THREE.Color('gray')
            scene.environment = null;
        }
    })
    gui.open();

    initGraphics()
    initPhysics()
    createBalls()
}

function createBalls() {
    for (let i = 0; i < 49; i++) {
        setTimeout(() => {
            const b = new Ball(i+1)
            balls.push(b)
            scene.add(b.sphere)
            world.add(b.sphereBody)
        }, 25 * i);
    }
}

function initGraphics() {
    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(20, 20, 20)
    camera.lookAt({x: 0, y: 0, z: 0})

    renderer = new THREE.WebGLRenderer({ antialias: true });
    // renderer.setClearColor(0xeeeeee, 1.0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = 2
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    loadENV(pmremGenerator)

    const controls = new OrbitControls(camera, renderer.domElement)

    let ambientLight = new THREE.AmbientLight(0x404040, 1)
    scene.add(ambientLight)
    // let spotLight = new THREE.SpotLight(0x999999)
    // spotLight.position.set(-10, 30, 20)
    // scene.add(spotLight)
    let pointLight = new THREE.PointLight(0xccffcc, 3, 30)
    pointLight.castShadow = true
    pointLight.position.set(0, 10, 0)
    scene.add(pointLight)

    // Ground
    let groundGeometry = new THREE.PlaneGeometry(200, 200, 32)
    let groundMaterial = new THREE.MeshPhysicalMaterial({
        side: THREE.DoubleSide,
        color: new THREE.Color('black'),
        // emissive: 0x364a55,
        roughness: .3,
        metalness: 0,
        reflectivity: .3,
        // transparent: true,
        // transparency: .7,
        clearcoat: 1,
        clearcoatRoughness: .3,
        // wireframe: true
    })
    let ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -46
    ground.receiveShadow = true
    scene.add(ground)

    // Glass
    let glassGeo = new THREE.SphereGeometry(12, 32, 32);
    let glassMat = new THREE.MeshPhysicalMaterial({
        side: THREE.DoubleSide,
        color: new THREE.Color('gray'),
        // emissive: 0x364a55,
        roughness: 0,
        metalness: .65,
        reflectivity: 1,
        transparent: true,
        transparency: .7,
        clearcoat: 1,
        clearcoatRoughness: .5,
        // wireframe: true
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    // glassMesh.castShadow = true;
    scene.add(glassMesh);

    // Axes Helper
    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    // Base Cylinder
    var cylinderGeo = new THREE.CylinderGeometry(8, 11, 38, 32, 3, true);
    var material = new THREE.MeshPhysicalMaterial({
        side: THREE.DoubleSide,
        color: new THREE.Color('rgb(60,60,60)'),
        // emissive: new THREE.Color('rgb(78,0,0)'),
        // emissiveIntensity: .1,
        roughness: .1,
        metalness: .6,
        reflectivity: 1,
        clearcoat: 1,
        clearcoatRoughness: .3,
    })
    var base = new THREE.Mesh(cylinderGeo, material);
    base.position.y -= 31.5
    scene.add(base);

    // Base Circle
    const circleGeo = new THREE.CircleGeometry(8, 18);
    const circle = new THREE.Mesh(circleGeo, material)
    circle.receiveShadow = true
    circle.rotation.x = 1.6
    circle.position.y = -12
    scene.add(circle)

    // Hollow Circle
    var arcShape = new THREE.Shape()
        .moveTo(0, 0)
        .absarc(0, 0, 60, 0, Math.PI * 2, false);

    var holePath = new THREE.Path()
        .moveTo(-0, 0)
        .absarc(0, 0, 50, 0, Math.PI * 2, true);

    arcShape.holes.push(holePath);
    var hcGeometry = new THREE.ExtrudeBufferGeometry(arcShape, { depth: 18, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 });

    var hcMesh = new THREE.Mesh(hcGeometry, material);
    hcMesh.position.set(0, -10, 0);
    hcMesh.rotation.set(1.6, 0, 0);
    hcMesh.scale.set(.1, .1, .1);
    hcMesh.receiveShadow = true
    scene.add(hcMesh)

    // Solid Circle
    arcShape = new THREE.Shape()
        .moveTo(0, 0)
        .absarc(0, 0, 120, 0, Math.PI * 2, false);

    var scGeo = new THREE.ExtrudeBufferGeometry(arcShape, { depth: 4, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 });

    var scMesh = new THREE.Mesh(scGeo, material);
    scMesh.position.set(0, -12, 0);
    scMesh.rotation.set(1.6, 0, 0);
    scMesh.scale.set(.1, .1, .1);
    scMesh.receiveShadow = true
    scene.add(scMesh)
}

function initPhysics() {
    world = new CANNON.World()
    world.gravity.set(0, -60, 0)
    world.broadphase = new CANNON.NaiveBroadphase()

    // let sphereShape = new CANNON.Sphere(1)
    Ball.sphereCM = new CANNON.Material()
    // sphereBody = new CANNON.Body({
    //     mass: 5,
    //     shape: sphereShape,
    //     position: new CANNON.Vec3(0, 10, 0),
    //     material: Ball.sphereCM
    // })
    // world.addBody(sphereBody)

    let groundShape = new CANNON.Plane()
    let groundCM = new CANNON.Material()
    let groundBody = new CANNON.Body({
        mass:0,
        shape: groundShape,
        material: groundCM
    })
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    // world.addBody(groundBody)

    // let sphereGroundContact = new CANNON.ContactMaterial(groundCM, Ball.sphereCM, {
    //     friction: 0,
    //     restitution: .7
    // })
    // world.addContactMaterial(sphereGroundContact)

}

function intersect(sphere, other) {
    // we are using multiplications because it's faster than calling Math.pow
    var distance = Math.sqrt((sphere.position.x - other.position.x) * (sphere.position.x - other.position.x) +
    (sphere.position.y - other.position.y) * (sphere.position.y - other.position.y) +
    (sphere.position.z - other.position.z) * (sphere.position.z - other.position.z));
    return distance < (sphere.shapes[0].radius + other.radius);
}

function loadENV(pmremGenerator) {
    new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .load(hdr, function (texture) {
            envMap = pmremGenerator.fromEquirectangular(texture).texture;

            if (hdrBg) {
                scene.background = envMap;
                // scene.background = new THREE.Color('rgb(45,45,90)');
                scene.environment = envMap;
            }

            texture.dispose();
            pmremGenerator.dispose();
        });
}

function render() {
    world.step(timeStep)
    if (balls) {
        balls.forEach(ball => {
            if (!intersect(ball.sphereBody, { position: {x: 0, y: 0, z: 0}, radius: 10 })) {
                // console.log(1);
                const v = ball.sphereBody.velocity
                const p = ball.sphereBody.position
                ball.sphereBody.velocity.copy(new CANNON.Vec3(-p.x, -p.y, -p.z))
            } else {
                const speed = isRunning ? 80 : 20
                if (ball.sphereBody.position.y < -9)
                    ball.sphereBody.velocity.copy(new CANNON.Vec3((Math.random() - 0.5), Math.random() * speed, (Math.random() - 0.5)))
            }

            ball.sphere.position.copy(ball.sphereBody.position)
            ball.sphere.quaternion.copy(ball.sphereBody.quaternion)
        })
    }

    requestAnimationFrame(render)
    renderer.render(scene, camera)
    stats.update();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

init()
render()