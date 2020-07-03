import * as THREE from "three";
import * as CANNON from 'cannon'

const radius = 0.6
const sharedGeo = new THREE.SphereGeometry(radius, 32, 32)

var imageCanvas = document.createElement("canvas"),
    context = imageCanvas.getContext("2d");
function makeTexture(num) {
    const size = 128
    imageCanvas.width = imageCanvas.height = size;

    context.fillStyle = "rgb(255,255,255)";
    context.fillRect(0, 0, size, size);
    context.fillStyle = "rgb(0,0,0)";
    context.font = '50px fantasy'

    context.fillText(num+'', size/2, size/2)

    var textureCanvas = new THREE.CanvasTexture(imageCanvas);
    // textureCanvas.mapping = THREE.CubeUVReflectionMapping
    textureCanvas.repeat.set(2, 2);
    textureCanvas.wrapS = THREE.RepeatWrapping;
    textureCanvas.wrapT = THREE.RepeatWrapping;

    return textureCanvas
}

export class Ball {
    static sphereCM
    sphere;
    sphereBody;
    /** @type {THREE.Scene} */
    // scene;
    // world;
    radius;
    number
    /** @param scene {THREE.Scene} */
    constructor(num) {
        // this.scene = scene;
        // this.world = world;
        this.radius = radius
        this.number = num
        this.initGraphics();
        this.initPhysics();
    }
    initGraphics() {
        let sphereGeometry = sharedGeo;
        let sphereMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('orange'),
            map: makeTexture(this.number),
            // emissive: 0x364a55,
            roughness: .1,
            metalness: .07,
            reflectivity: .5,
            // transparent: true,
            // opacity: .9,
            clearcoat: .5,
            clearcoatRoughness: .0,
        });
        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.sphere.castShadow = true;
        this.sphere.receiveShadow = true;
        // this.scene.add(this.sphere);
    }
    initPhysics() {
        let sphereShape = new CANNON.Sphere(this.radius);
        // let sphereCM = new CANNON.Material()
        const speed = -12;
        this.sphereBody = new CANNON.Body({
            mass: 2,
            shape: sphereShape,
            position: new CANNON.Vec3(0, -8, 0),
            material: Ball.sphereCM,
            velocity: new CANNON.Vec3((Math.random() - 0.5), Math.random() * speed, (Math.random() - 0.5))
        });
        // this.world.add(this.sphereBody);
    }
}
