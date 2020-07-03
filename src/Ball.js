import * as THREE from "three";
import * as CANNON from 'cannon'
export class Ball {
    static sphereCM
    sphere;
    sphereBody;
    /** @type {THREE.Scene} */
    // scene;
    // world;
    radius;
    /** @param scene {THREE.Scene} */
    constructor() {
        // this.scene = scene;
        // this.world = world;
        this.radius = 0.6
        this.initGraphics();
        this.initPhysics();
    }
    initGraphics() {
        let sphereGeometry = new THREE.SphereGeometry(this.radius, 32, 32);
        let sphereMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('orange'),
            // emissive: 0x364a55,
            roughness: .1,
            metalness: .7,
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
