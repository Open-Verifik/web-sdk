import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import * as THREE from "three";

@Component({
	selector: "neural-face",
	standalone: true,
	template: ` <div #container class="w-full h-full relative overflow-hidden rounded-full"></div> `,
	styles: [
		`
			:host {
				display: block;
				width: 100%;
				height: 100%;
			}
		`,
	],
})
export class NeuralFaceComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild("container", { static: true }) containerRef: ElementRef<HTMLDivElement>;
	@Input() color: string = "#6366f1"; // Default fallback (Indigo-500)

	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private animationId: number;
	private particles: THREE.Points;
	private geometry: THREE.BufferGeometry;
	private material: THREE.PointsMaterial;
	private sphere: THREE.Line;

	ngOnInit(): void {
		// Moved to ngAfterViewInit
	}

	ngAfterViewInit(): void {
		// Small timeout to ensure measuring works if inside complex layout
		setTimeout(() => this.initThree(), 100);
	}

	ngOnDestroy(): void {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
		}
		if (this.renderer) {
			this.renderer.dispose();
		}
	}

	private initThree() {
		if (!this.containerRef?.nativeElement) return;

		let width = this.containerRef.nativeElement.clientWidth;
		let height = this.containerRef.nativeElement.clientHeight;

		if (width === 0 || height === 0) {
			width = 144;
			height = 144;
		}

		// Scene
		this.scene = new THREE.Scene();
		this.scene.background = null;

		// Camera
		this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
		this.camera.position.z = 5.5;

		// Renderer
		this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		this.renderer.setSize(width, height);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.containerRef.nativeElement.appendChild(this.renderer.domElement);

		// --- Create Minimalist Face Mask ---
		// Much lower density for cleaner look
		const segW = 12;
		const segH = 16;
		const geometry = new THREE.PlaneGeometry(2.4, 3.2, segW, segH);

		const posAttribute = geometry.attributes.position;
		const vertexCount = posAttribute.count;

		// Very minimal sculpting - just gentle curves
		for (let i = 0; i < vertexCount; i++) {
			const x = posAttribute.getX(i);
			const y = posAttribute.getY(i);
			let z = 0;

			// Gentle overall curvature only
			z -= Math.pow(x * 0.5, 2);
			z -= Math.pow(y * 0.25, 2);

			posAttribute.setZ(i, z);
		}

		geometry.computeVertexNormals();

		// Cut the oval shape and eye holes
		const indices = geometry.index.array as Uint16Array;
		const newIndices = [];
		const keptVertices = new Set<number>();

		for (let i = 0; i < indices.length; i += 3) {
			const a = indices[i];
			const b = indices[i + 1];
			const c = indices[i + 2];

			if (isValidFace(a) && isValidFace(b) && isValidFace(c)) {
				newIndices.push(a, b, c);
				keptVertices.add(a);
				keptVertices.add(b);
				keptVertices.add(c);
			}
		}
		geometry.setIndex(newIndices);

		function isValidFace(idx: number) {
			const x = posAttribute.getX(idx);
			const y = posAttribute.getY(idx);

			// Overall face oval
			const inOval = (x * x) / (1.2 * 1.2) + (y * y) / (1.6 * 1.6) <= 1.0;
			if (!inOval) return false;

			// Eye holes
			const eyeY = 0.4;
			const eyeX = 0.45;

			const inLeftEye = Math.pow(x - -eyeX, 2) / 0.08 + Math.pow(y - eyeY, 2) / 0.05 <= 1;
			const inRightEye = Math.pow(x - eyeX, 2) / 0.08 + Math.pow(y - eyeY, 2) / 0.05 <= 1;

			if (inLeftEye || inRightEye) return false;

			return true;
		}

		// --- Mesh Setup ---
		const group = new THREE.Group();
		this.scene.add(group);
		this.sphere = group as any;

		// Wireframe with higher opacity for cleaner look
		const wireMat = new THREE.MeshBasicMaterial({
			color: this.color,
			wireframe: true,
			transparent: true,
			opacity: 0.5, // More visible
		});
		const wireMesh = new THREE.Mesh(geometry, wireMat);
		group.add(wireMesh);

		// Strategic landmark points only - not all vertices
		const landmarkCoords = [];

		// Only add points at key positions (corners, feature areas)
		keptVertices.forEach((idx) => {
			const x = posAttribute.getX(idx);
			const y = posAttribute.getY(idx);
			const z = posAttribute.getZ(idx);

			// Only show points on outer edges and around eyes for cleaner look
			const isEdge = Math.abs(x) > 0.9 || Math.abs(y) > 1.2;
			const nearEyes = (Math.abs(x - 0.45) < 0.3 || Math.abs(x + 0.45) < 0.3) && Math.abs(y - 0.4) < 0.3;

			// Add every 3rd point on edges, or points near eyes
			if ((isEdge && Math.random() > 0.7) || nearEyes) {
				landmarkCoords.push(x, y, z);
			}
		});

		const pointGeo = new THREE.BufferGeometry();
		pointGeo.setAttribute("position", new THREE.Float32BufferAttribute(landmarkCoords, 3));
		const pointMat = new THREE.PointsMaterial({
			color: this.color,
			size: 0.06, // Slightly larger for visibility
			transparent: true,
			opacity: 0.9,
		});
		const points = new THREE.Points(pointGeo, pointMat);
		group.add(points);

		// Animation Loop
		this.animate();

		// Handle resize
		new ResizeObserver(() => {
			if (!this.containerRef?.nativeElement || !this.renderer || !this.camera) return;
			const newWidth = this.containerRef.nativeElement.clientWidth;
			const newHeight = this.containerRef.nativeElement.clientHeight;
			if (newWidth === 0 || newHeight === 0) return;

			this.camera.aspect = newWidth / newHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(newWidth, newHeight);
		}).observe(this.containerRef.nativeElement);
	}

	private animate = () => {
		this.animationId = requestAnimationFrame(this.animate);

		const time = Date.now() * 0.001;

		if (this.sphere) {
			// Very gentle, slow sway
			this.sphere.rotation.y = Math.sin(time * 0.3) * 0.15;
			this.sphere.rotation.x = Math.sin(time * 0.2) * 0.08;
		}

		this.renderer.render(this.scene, this.camera);
	};
}
