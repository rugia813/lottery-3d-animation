import * as THREE from "three";
import * as CANNON from 'cannon'
export class Ball {
    static sphereCM
    static atLeft = true
    sphere;
    sphereBody;
    /** @type {THREE.Scene} */
    scene;
    world;
    radius;
    /** @param scene {THREE.Scene} */
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.radius = Math.max(Math.random(), .5);
        this.initGraphics();
        this.initPhysics();
    }
    initGraphics() {
        let sphereGeometry = new THREE.SphereGeometry(this.radius, 32, 32);
        let sphereMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x33aaaa,
            emissive: 0x364a55,
            roughness: 0,
            metalness: .65,
            reflectivity: 1,
            transparent: true,
            opacity: .9,
            clearCoat: 1,
            clearCoatRoughness: .5,
        });
        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.sphere.castShadow = true;
        this.scene.add(this.sphere);
    }
    initPhysics() {
        let sphereShape = new CANNON.Sphere(this.radius);
        // let sphereCM = new CANNON.Material()
        const speed = 40;
        this.sphereBody = new CANNON.Body({
            mass: 5,
            shape: sphereShape,
            position: new CANNON.Vec3(0, 5, (Ball.atLeft) ? 10 : -10),
            material: Ball.sphereCM,
            velocity: new CANNON.Vec3(1, 0, (Ball.atLeft) ? -speed : speed)
        });
        Ball.atLeft = !Ball.atLeft;
        this.world.add(this.sphereBody);
    }
}
