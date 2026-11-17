import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "environments/environment";

export interface ChallengeTicket {
    ticketId: string;
    nonce: string;
    difficulty: number;
    timestamp: number;
    hmac?: string;
    clientBinding?: string;
}

export interface PoWSolution {
    counter: number;
    hash: string;
    durationMs: number;
    iterations: number;
}

export interface ClientHardwareAttestation {
    canvasFingerprint: string;
    webglRenderer: {
        vendor: string;
        renderer: string;
        isSoftwareRenderer: boolean;
    };
    hardwareConcurrency: number;
    deviceMemory: number | null;
    touchSupport: boolean;
    webdriver: boolean;
    audioFingerprint: string;
    screen: {
        width: number;
        height: number;
        colorDepth: number;
        devicePixelRatio: number;
    };
    timezone: string;
    platform: string;
    language: string;
    timestamp: number;
}

export interface TurnstileFallbackData {
    turnstileSiteKey: string;
    challengeId?: string;
}

@Injectable({
    providedIn: "root",
})
export class AntiBotChallengeService {
    static readonly STORAGE_KEY_PREFIX = "verifik_antibot_headers_";
    static readonly HEADER_NAMES = [
        "X-Bot-Ticket",
        "X-Bot-Proof",
        "X-Bot-Attestation",
        "X-Turnstile-Token",
    ] as const;

    private _worker: Worker | null = null;
    private _workerUrl: string | null = null;

    constructor(private _http: HttpClient) {}

    /**
     * Build the canonical sessionStorage key for a project's anti-bot headers
     */
    static getStorageKey(projectId: string): string {
        return `${AntiBotChallengeService.STORAGE_KEY_PREFIX}${projectId}`;
    }

    /**
     * Filter and validate a candidate header map for anti-bot challenge headers
     */
    static extractValidHeaders(source: unknown): Record<string, string> | null {
        if (!source || typeof source !== "object") return null;

        const record = source as Record<string, unknown>;
        const ticket = record["X-Bot-Ticket"];
        const proof = record["X-Bot-Proof"];

        if (typeof ticket !== "string" || !ticket || typeof proof !== "string" || !proof) {
            return null;
        }

        const headers: Record<string, string> = {
            "X-Bot-Ticket": ticket,
            "X-Bot-Proof": proof,
        };

        if (typeof record["X-Bot-Attestation"] === "string" && record["X-Bot-Attestation"]) {
            headers["X-Bot-Attestation"] = record["X-Bot-Attestation"];
        }

        if (typeof record["X-Turnstile-Token"] === "string" && record["X-Turnstile-Token"]) {
            headers["X-Turnstile-Token"] = record["X-Turnstile-Token"];
        }

        return headers;
    }

    /**
     * Read and consume previously prepared anti-bot headers from sessionStorage
     * so single-use nonces are never replayed.
     */
    consumeStoredHeaders(projectId: string): Record<string, string> | null {
        if (!projectId || typeof sessionStorage === "undefined") return null;

        const key = AntiBotChallengeService.getStorageKey(projectId);
        try {
            const raw = sessionStorage.getItem(key);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            const headers = AntiBotChallengeService.extractValidHeaders(parsed);
            if (headers) {
                sessionStorage.removeItem(key);
            }
            return headers;
        } catch {
            return null;
        }
    }

    /**
     * Return stored headers if available, otherwise prepare a fresh challenge handshake.
     */
    async getOrPrepareVerificationHeaders(projectId: string): Promise<Record<string, string>> {
        const stored = this.consumeStoredHeaders(projectId);
        if (stored) {
            return stored;
        }
        return this.prepareVerificationHeaders(projectId);
    }

    /**
     * Request an anti-bot challenge ticket from the backend
     */
    async requestChallenge(projectId: string, clientSessionId?: string): Promise<ChallengeTicket> {
        const url = `${environment.apiUrl}/v2/anti-bot/challenge`;
        const body = {
            projectId,
            clientSessionId: clientSessionId || this._generateSessionId(),
        };

        const response: any = await firstValueFrom(this._http.post(url, body));
        return response?.data || response;
    }

    /**
     * Solve the Proof-of-Work challenge using an inline Blob Web Worker.
     * Keeps Angular main UI thread silky smooth and prevents frame drops.
     */
    async solvePoW(
        nonce: string,
        difficulty: number = 4,
        maxIterations: number = 2000000
    ): Promise<PoWSolution> {
        return new Promise<PoWSolution>((resolve, reject) => {
            const worker = this._getOrCreateWorker();

            const onMessage = (event: MessageEvent) => {
                worker.removeEventListener("message", onMessage);
                worker.removeEventListener("error", onError);

                if (event.data?.success) {
                    resolve({
                        counter: event.data.counter,
                        hash: event.data.hash,
                        durationMs: event.data.durationMs,
                        iterations: event.data.iterations,
                    });
                } else {
                    reject(new Error(event.data?.error || "Proof of work computation failed"));
                }
            };

            const onError = (error: ErrorEvent) => {
                worker.removeEventListener("message", onMessage);
                worker.removeEventListener("error", onError);
                reject(new Error(`PoW Worker error: ${error.message}`));
            };

            worker.addEventListener("message", onMessage);
            worker.addEventListener("error", onError);

            worker.postMessage({
                action: "solve",
                nonce,
                difficulty,
                maxIterations,
            });
        });
    }

    /**
     * Collect client hardware attestation and rendering telemetry
     */
    async collectHardwareAttestation(): Promise<ClientHardwareAttestation> {
        const [canvasHash, audioHash, webgl] = await Promise.all([
            this._getCanvasFingerprint(),
            this._getAudioFingerprint(),
            this._getWebGLRendererInfo(),
        ]);

        return {
            canvasFingerprint: canvasHash,
            webglRenderer: webgl,
            hardwareConcurrency: navigator.hardwareConcurrency || 1,
            deviceMemory: (navigator as any).deviceMemory || null,
            touchSupport: "ontouchstart" in window || (navigator.maxTouchPoints > 0),
            webdriver: Boolean(navigator.webdriver),
            audioFingerprint: audioHash,
            screen: {
                width: window.screen ? window.screen.width : 0,
                height: window.screen ? window.screen.height : 0,
                colorDepth: window.screen ? window.screen.colorDepth : 0,
                devicePixelRatio: window.devicePixelRatio || 1,
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
            platform: navigator.platform || "",
            language: navigator.language || "en",
            timestamp: Date.now(),
        };
    }

    /**
     * Coordinate full challenge handshake: request ticket, solve PoW in background Worker,
     * and gather client attestation telemetry into standard headers.
     */
    async prepareVerificationHeaders(projectId: string): Promise<Record<string, string>> {
        const ticket = await this.requestChallenge(projectId);

        const [proof, attestation] = await Promise.all([
            this.solvePoW(ticket.nonce, ticket.difficulty),
            this.collectHardwareAttestation(),
        ]);

        return {
            "X-Bot-Ticket": JSON.stringify(ticket),
            "X-Bot-Proof": JSON.stringify({
                counter: proof.counter,
                hash: proof.hash,
            }),
            "X-Bot-Attestation": JSON.stringify(attestation),
        };
    }

    /**
     * Check if a backend error is HTTP 428 Precondition Required (FALLBACK_CHALLENGE)
     */
    isFallbackRequired(error: any): boolean {
        if (!error) return false;
        return (
            error.status === 428 ||
            error.statusCode === 428 ||
            error.error?.code === "FALLBACK_CHALLENGE" ||
            error.code === "FALLBACK_CHALLENGE"
        );
    }

    /**
     * Extract fallback data from HTTP 428 response
     */
    extractFallbackData(error: any): TurnstileFallbackData | null {
        if (!this.isFallbackRequired(error)) return null;
        const data = error.error?.data || error.data || error.error || {};
        return {
            turnstileSiteKey: data.turnstileSiteKey || data.siteKey || "",
            challengeId: data.challengeId,
        };
    }

    /**
     * Interactive or invisible Cloudflare Turnstile fallback handler for HTTP 428
     */
    async handleTurnstileFallback(
        siteKey: string,
        targetContainer?: HTMLElement | string
    ): Promise<string> {
        await this._loadTurnstileScript();

        return new Promise<string>((resolve, reject) => {
            let container: HTMLElement;
            let createdModal = false;

            if (typeof targetContainer === "string") {
                const found = document.getElementById(targetContainer);
                if (!found) throw new Error(`Turnstile container #${targetContainer} not found`);
                container = found;
            } else if (targetContainer instanceof HTMLElement) {
                container = targetContainer;
            } else {
                // Create an overlay container
                createdModal = true;
                container = document.createElement("div");
                container.id = "cf-turnstile-overlay";
                container.style.position = "fixed";
                container.style.top = "0";
                container.style.left = "0";
                container.style.width = "100vw";
                container.style.height = "100vh";
                container.style.zIndex = "99999";
                container.style.backgroundColor = "rgba(0, 0, 0, 0.45)";
                container.style.display = "flex";
                container.style.alignItems = "center";
                container.style.justifyContent = "center";
                container.style.backdropFilter = "blur(4px)";

                const card = document.createElement("div");
                card.id = "cf-turnstile-card";
                card.style.background = "#ffffff";
                card.style.padding = "24px";
                card.style.borderRadius = "12px";
                card.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
                card.style.display = "flex";
                card.style.flexDirection = "column";
                card.style.alignItems = "center";
                card.style.gap = "16px";

                const title = document.createElement("p");
                title.innerText = "Security Verification";
                title.style.margin = "0";
                title.style.fontWeight = "600";
                title.style.fontSize = "16px";
                title.style.color = "#0f172a";

                const widgetSlot = document.createElement("div");
                widgetSlot.id = "cf-turnstile-widget-slot";

                card.appendChild(title);
                card.appendChild(widgetSlot);
                container.appendChild(card);
                document.body.appendChild(container);
            }

            const cleanup = () => {
                if (createdModal && container && container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            };

            const turnstile = (window as any).turnstile;
            if (!turnstile) {
                cleanup();
                reject(new Error("Turnstile SDK unavailable"));
                return;
            }

            const target = createdModal
                ? document.getElementById("cf-turnstile-widget-slot") || container
                : container;

            try {
                turnstile.render(target, {
                    sitekey: siteKey,
                    theme: "auto",
                    callback: (token: string) => {
                        cleanup();
                        resolve(token);
                    },
                    "error-callback": (errCode: any) => {
                        cleanup();
                        reject(new Error(`Turnstile verification failed (${errCode})`));
                    },
                });
            } catch (err) {
                cleanup();
                reject(err);
            }
        });
    }

    /**
     * Terminate the background Web Worker and clean up object URLs
     */
    destroyWorker(): void {
        if (this._worker) {
            this._worker.terminate();
            this._worker = null;
        }
        if (this._workerUrl) {
            URL.revokeObjectURL(this._workerUrl);
            this._workerUrl = null;
        }
    }

    // ==========================================
    // Internal Telemetry & Worker Implementations
    // ==========================================

    private _getOrCreateWorker(): Worker {
        if (!this._worker) {
            const workerCode = `
                var SHA256_K = new Int32Array([
                    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
                    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
                    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
                    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
                    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
                    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
                    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
                    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
                ]);
                var SHA256_W = new Int32Array(64);
                var HEX_CHARS = "0123456789abcdef";

                function wordToHex(word) {
                    var out = "";
                    for (var s = 28; s >= 0; s -= 4) {
                        out += HEX_CHARS[(word >>> s) & 0x0f];
                    }
                    return out;
                }

                function encodeUtf8(str) {
                    if (typeof TextEncoder !== "undefined") {
                        return new TextEncoder().encode(str);
                    }
                    var bytes = [];
                    for (var i = 0; i < str.length; i++) {
                        var code = str.charCodeAt(i);
                        if (code < 0x80) {
                            bytes.push(code);
                        } else if (code < 0x800) {
                            bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
                        } else if (code < 0xd800 || code >= 0xe000) {
                            bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
                        } else {
                            i++;
                            code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                            bytes.push(
                                0xf0 | (code >> 18),
                                0x80 | ((code >> 12) & 0x3f),
                                0x80 | ((code >> 6) & 0x3f),
                                0x80 | (code & 0x3f)
                            );
                        }
                    }
                    return new Uint8Array(bytes);
                }

                self.onmessage = function(e) {
                    var data = e.data || {};
                    if (data.action !== "solve") return;

                    var diff = data.difficulty === undefined || data.difficulty === null
                        ? 4
                        : Math.max(0, Math.floor(Number(data.difficulty)));
                    var max = data.maxIterations || 2000000;
                    var prefix = "0".repeat(diff);
                    var startTime = performance.now();

                    try {
                        var nonceBytes = encodeUtf8(typeof data.nonce === "string" ? data.nonce : String(data.nonce || ""));
                        var nonceLen = nonceBytes.length;
                        var maxPaddedLen = Math.ceil((nonceLen + 21 + 9) / 64) * 64;
                        var buf = new Uint8Array(maxPaddedLen);
                        buf.set(nonceBytes, 0);

                        var K = SHA256_K;
                        var W = SHA256_W;
                        var shiftCheck = diff >= 1 && diff <= 8 ? (8 - diff) * 4 : 0;
                        var digitsLen = 0;
                        var nextThreshold = 0;
                        var paddedLen = 0;
                        var lastDigitPos = nonceLen;

                        for (var counter = 0; counter < max; counter++) {
                            if (counter === nextThreshold) {
                                if (counter === 0) {
                                    digitsLen = 1;
                                    nextThreshold = 10;
                                    buf[nonceLen] = 48;
                                } else {
                                    digitsLen++;
                                    nextThreshold *= 10;
                                    buf[nonceLen] = 49;
                                    for (var z = 1; z < digitsLen; z++) {
                                        buf[nonceLen + z] = 48;
                                    }
                                }
                                lastDigitPos = nonceLen + digitsLen - 1;
                                var totalLen = nonceLen + digitsLen;
                                paddedLen = ((totalLen + 9 + 63) >> 6) << 6;
                                buf.fill(0, totalLen, paddedLen);
                                buf[totalLen] = 0x80;

                                var bitLenHi = Math.floor(totalLen / 0x20000000);
                                var bitLenLo = (totalLen << 3) >>> 0;
                                buf[paddedLen - 8] = (bitLenHi >>> 24) & 0xff;
                                buf[paddedLen - 7] = (bitLenHi >>> 16) & 0xff;
                                buf[paddedLen - 6] = (bitLenHi >>> 8) & 0xff;
                                buf[paddedLen - 5] = bitLenHi & 0xff;
                                buf[paddedLen - 4] = (bitLenLo >>> 24) & 0xff;
                                buf[paddedLen - 3] = (bitLenLo >>> 16) & 0xff;
                                buf[paddedLen - 2] = (bitLenLo >>> 8) & 0xff;
                                buf[paddedLen - 1] = bitLenLo & 0xff;
                            } else {
                                var p = lastDigitPos;
                                while (buf[p] === 57) {
                                    buf[p--] = 48;
                                }
                                buf[p]++;
                            }

                            var h0 = 0x6a09e667 | 0;
                            var h1 = 0xbb67ae85 | 0;
                            var h2 = 0x3c6ef372 | 0;
                            var h3 = 0xa54ff53a | 0;
                            var h4 = 0x510e527f | 0;
                            var h5 = 0x9b05688c | 0;
                            var h6 = 0x1f83d9ab | 0;
                            var h7 = 0x5be0cd19 | 0;

                            for (var offset = 0; offset < paddedLen; offset += 64) {
                                for (var t = 0; t < 16; t++) {
                                    var j = offset + (t << 2);
                                    W[t] = (buf[j] << 24) | (buf[j + 1] << 16) | (buf[j + 2] << 8) | buf[j + 3];
                                }
                                for (var t2 = 16; t2 < 64; t2++) {
                                    var w15 = W[t2 - 15];
                                    var w2 = W[t2 - 2];
                                    var s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
                                    var s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
                                    W[t2] = (W[t2 - 16] + s0 + W[t2 - 7] + s1) | 0;
                                }

                                var a = h0, b = h1, c = h2, d = h3, e2 = h4, f = h5, g = h6, h = h7;
                                for (var r = 0; r < 64; r++) {
                                    var S1 = ((e2 >>> 6) | (e2 << 26)) ^ ((e2 >>> 11) | (e2 << 21)) ^ ((e2 >>> 25) | (e2 << 7));
                                    var ch = (e2 & f) ^ ((~e2) & g);
                                    var temp1 = (h + S1 + ch + K[r] + W[r]) | 0;
                                    var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
                                    var maj = (a & b) ^ (a & c) ^ (b & c);
                                    var temp2 = (S0 + maj) | 0;

                                    h = g;
                                    g = f;
                                    f = e2;
                                    e2 = (d + temp1) | 0;
                                    d = c;
                                    c = b;
                                    b = a;
                                    a = (temp1 + temp2) | 0;
                                }

                                h0 = (h0 + a) | 0;
                                h1 = (h1 + b) | 0;
                                h2 = (h2 + c) | 0;
                                h3 = (h3 + d) | 0;
                                h4 = (h4 + e2) | 0;
                                h5 = (h5 + f) | 0;
                                h6 = (h6 + g) | 0;
                                h7 = (h7 + h) | 0;
                            }

                            if (diff === 0 || (h0 >>> shiftCheck) === 0) {
                                var hex = wordToHex(h0) + wordToHex(h1) + wordToHex(h2) + wordToHex(h3) +
                                          wordToHex(h4) + wordToHex(h5) + wordToHex(h6) + wordToHex(h7);
                                if (diff === 0 || hex.startsWith(prefix)) {
                                    self.postMessage({
                                        success: true,
                                        counter: counter,
                                        hash: hex,
                                        durationMs: Math.round(performance.now() - startTime),
                                        iterations: counter + 1
                                    });
                                    return;
                                }
                            }
                        }

                        self.postMessage({
                            success: false,
                            error: "MAX_ITERATIONS_EXCEEDED"
                        });
                    } catch (err) {
                        self.postMessage({
                            success: false,
                            error: err ? err.message : "PoW Worker error"
                        });
                    }
                };
            `;

            const blob = new Blob([workerCode], { type: "application/javascript" });
            this._workerUrl = URL.createObjectURL(blob);
            this._worker = new Worker(this._workerUrl);
        }
        return this._worker;
    }

    private async _getCanvasFingerprint(): Promise<string> {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = 200;
            canvas.height = 50;
            const ctx = canvas.getContext("2d");
            if (!ctx) return "canvas-unsupported";

            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial', sans-serif";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);

            ctx.fillStyle = "#069";
            ctx.fillText("Verifik AntiBot 🔒", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("Verifik AntiBot 🔒", 4, 17);

            const dataUrl = canvas.toDataURL();
            return this._hashString(dataUrl);
        } catch {
            return "canvas-error";
        }
    }

    private async _getWebGLRendererInfo(): Promise<{
        vendor: string;
        renderer: string;
        isSoftwareRenderer: boolean;
    }> {
        try {
            const canvas = document.createElement("canvas");
            const gl = (canvas.getContext("webgl") ||
                canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

            if (!gl) {
                return {
                    vendor: "unsupported",
                    renderer: "unsupported",
                    isSoftwareRenderer: true,
                };
            }

            const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            let vendor = "unknown";
            let renderer = "unknown";

            if (debugInfo) {
                vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "unknown";
                renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "unknown";
            } else {
                vendor = gl.getParameter(gl.VENDOR) || "unknown";
                renderer = gl.getParameter(gl.RENDERER) || "unknown";
            }

            // Flag pure software rasterizers without penalizing hardware Mesa or Apple GPU masking
            const isSoftwareRenderer =
                /SwiftShader|llvmpipe|softpipe|Mesa OffScreen|VirtualBox Graphics/i.test(
                    renderer
                );

            return { vendor, renderer, isSoftwareRenderer };
        } catch {
            return { vendor: "error", renderer: "error", isSoftwareRenderer: false };
        }
    }

    private async _getAudioFingerprint(): Promise<string> {
        try {
            const AudioContextClass =
                window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return "audio-unsupported";

            const OfflineContext =
                window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
            if (!OfflineContext) return "audio-offline-unsupported";

            const context = new OfflineContext(1, 44100, 44100);
            const oscillator = context.createOscillator();
            oscillator.type = "triangle";
            oscillator.frequency.value = 5000;

            const compressor = context.createDynamicsCompressor();
            compressor.threshold.value = -50;
            compressor.knee.value = 40;
            compressor.ratio.value = 12;
            compressor.attack.value = 0;
            compressor.release.value = 0.25;

            oscillator.connect(compressor);
            compressor.connect(context.destination);
            oscillator.start(0);

            const renderedBuffer = await context.startRendering();
            const channelData = renderedBuffer.getChannelData(0);
            let sum = 0;
            for (let i = 4500; i < 5000; i++) {
                sum += Math.abs(channelData[i]);
            }
            return sum.toFixed(6);
        } catch {
            return "audio-error";
        }
    }

    private async _loadTurnstileScript(): Promise<void> {
        if ((window as any).turnstile) return;

        return new Promise((resolve, reject) => {
            const existing = document.querySelector('script[src*="turnstile/v0/api.js"]');
            if (existing) {
                existing.addEventListener("load", () => resolve());
                existing.addEventListener("error", (e) => reject(e));
                return;
            }

            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = (e) => reject(new Error("Failed to load Cloudflare Turnstile script"));
            document.head.appendChild(script);
        });
    }

    private _hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
    }

    private _generateSessionId(): string {
        return (
            "sess_" +
            Math.random().toString(36).substring(2, 12) +
            Date.now().toString(36)
        );
    }
}
