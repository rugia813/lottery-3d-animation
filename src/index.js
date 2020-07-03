import * as THREE from "three";
import * as CANNON from "cannon";
import { Ball } from "./Ball";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import { GLTFLoader } from "./GLTFLoader";
import { HDRCubeTextureLoader } from "./HDRCubeTextureLoader";
import { RoughnessMipmapper } from './RoughnessMipmapper.js';
import { RGBELoader } from './RGBELoader.js';
// import hollowBall from "./halfsphere.gltf";
import hdr from './royal_esplanade_1k.hdr'
import Stats from './stats.module.js';
import { GUI } from 'dat.gui';

let world, scene, camera, renderer, pmremGenerator
let stats;
const timeStep = 1.0 / 60.0

const balls = []

const guiData = {
    isRunning: false
}
let isRunning = false

window['t'] = THREE

function init() {
    // STATS
    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize, false);

    var gui = new GUI();
    gui.add(guiData, 'isRunning').onChange(() => isRunning = !isRunning);
    gui.open();

    initGraphics()
    initPhysics()
    createBalls()
}

function createBalls() {
    for (let i = 0; i <= 49; i++) {
        setTimeout(() => {
            const b = new Ball()
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
    camera.lookAt(scene.position)

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
    let pointLight = new THREE.PointLight(0xccffcc, 4, 30)
    pointLight.castShadow = true
    pointLight.position.set(0, 10, 0)
    scene.add(pointLight)

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
    ground.position.y = -16
    ground.receiveShadow = true
    scene.add(ground)

    let glassGeo = new THREE.SphereGeometry(12, 32, 32);
    let glassMat = new THREE.MeshPhysicalMaterial({
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
    glassMesh.castShadow = true;
    scene.add(glassMesh);

    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );
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
            var envMap = pmremGenerator.fromEquirectangular(texture).texture;

            scene.background = envMap;
            scene.environment = envMap;

            texture.dispose();
            pmremGenerator.dispose();

            render();

            // model

            // use of RoughnessMipmapper is optional
            var roughnessMipmapper = new RoughnessMipmapper(renderer);
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