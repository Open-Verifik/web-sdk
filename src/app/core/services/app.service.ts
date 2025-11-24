import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export interface Project {
    branding?: {
        bgColor?: string;
        buttonColor?: string;
        titleColor?: string;
        txtColor?: string;
        buttonTextColor?: string;
    };
}

export interface DeviceDetails {
    // Browser information
    userAgent: string;
    language: string;
    languages: string[];
    onLine: boolean;
    onlineStatus: string;
    cookiesEnabled: boolean;
    javaEnabled: boolean;

    // Screen and display
    screenResolution: string;
    screenAvailableResolution: string;
    colorDepth: number;
    pixelDepth: number;
    devicePixelRatio: number;

    // Window dimensions
    innerHeight: number;
    innerWidth: number;
    outerHeight: number;
    outerWidth: number;

    // Hardware capabilities
    touchSupported: boolean;
    maxTouchPoints: number;
    hardwareConcurrency: number;
    deviceMemory?: number; // Optional as not all browsers support this

    // Network and connectivity
    geolocationSupported: boolean;
    connectionEffectiveType?: string; // Optional
    connectionDownlink?: number; // Optional
    connectionRtt?: number; // Optional

    // Platform detection (using modern detection methods)
    operatingSystem: string;
    browserName: string;
    browserVersion: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;

    // Privacy and preferences
    timezoneOffset: number;
    prefersDarkMode: boolean;
    prefersReducedMotion: boolean;

    // User-Agent Client Hints (when available)
    userAgentData?: {
        brands: Array<{ brand: string; version: string }>;
        mobile: boolean;
        platform: string;
    };
}

@Injectable({
    providedIn: "root",
})
export class AppService {
    private originalTheme: string | null = null;
    private _geoLocation: BehaviorSubject<any> = new BehaviorSubject(null);

    /**
     * Get geolocation observable
     */
    get geoLocation$(): Observable<any> {
        return this._geoLocation.asObservable();
    }

    /**
     * Update CSS variables for the custom theme
     */
    private _updateCustomThemeVariables(branding: any): void {
        const root = document.documentElement;

        // Generate color palette from buttonColor
        const primaryColor = branding.buttonColor || "#4f46e5";
        const accentColor = branding.titleColor || "#ff4081";
        const warnColor = "#f44336";

        // Generate primary color variants
        const primaryPalette = this.generateColorPalette(primaryColor);
        const accentPalette = this.generateColorPalette(accentColor);
        const warnPalette = this.generateColorPalette(warnColor);

        // Update primary color variables
        Object.keys(primaryPalette).forEach((key) => {
            if (key !== "contrast") {
                root.style.setProperty(`--custom-verifik-primary-${key}`, primaryPalette[key]);

                if (primaryPalette.contrast && primaryPalette.contrast[key]) {
                    root.style.setProperty(`--custom-verifik-primary-contrast-${key}`, primaryPalette.contrast[key]);
                }
            }
        });

        // Update accent color variables
        Object.keys(accentPalette).forEach((key) => {
            if (key !== "contrast") {
                root.style.setProperty(`--custom-verifik-accent-${key}`, accentPalette[key]);

                if (accentPalette.contrast && accentPalette.contrast[key]) {
                    root.style.setProperty(`--custom-verifik-accent-contrast-${key}`, accentPalette.contrast[key]);
                }
            }
        });

        // Update warn color variables
        Object.keys(warnPalette).forEach((key) => {
            if (key !== "contrast") {
                root.style.setProperty(`--custom-verifik-warn-${key}`, warnPalette[key]);

                if (warnPalette.contrast && warnPalette.contrast[key]) {
                    root.style.setProperty(`--custom-verifik-warn-contrast-${key}`, warnPalette.contrast[key]);
                }
            }
        });

        // Update main color variables
        root.style.setProperty("--custom-verifik-primary", primaryColor);
        root.style.setProperty("--custom-verifik-accent", accentColor);
        root.style.setProperty("--custom-verifik-warn", warnColor);

        // Update contrast variables
        root.style.setProperty("--custom-verifik-primary-contrast", primaryPalette.contrast?.DEFAULT || "#FFFFFF");
        root.style.setProperty("--custom-verifik-accent-contrast", accentPalette.contrast?.DEFAULT || "#FFFFFF");
        root.style.setProperty("--custom-verifik-warn-contrast", warnPalette.contrast?.DEFAULT || "#FFFFFF");

        root.style.setProperty("--custom-verifik-background", branding.backgroundColor || "#FFFFFF");
        root.style.setProperty("--custom-theme-background-color", branding.backgroundColor || "#FFFFFF");
        root.style.setProperty("--custom-verifik-text-color", branding.textColor || "#181818");
        root.style.setProperty("--custom-verifik-title-color", branding.titleColor || "#181818");
        root.style.setProperty("--custom-verifik-button-color", branding.buttonColor || "#181818");
        root.style.setProperty("--custom-verifik-button-text-color", branding.buttonTextColor || "#FFFFFF");
    }

    /**
     * Generate a color palette from a base color
     */
    private generateColorPalette(baseColor: string): any {
        const hex = this.ensureHexFormat(baseColor);
        const variants = this.generateColorVariants(hex);
        const contrast = this.generateContrastColors(variants);

        return {
            50: variants[50],
            100: variants[100],
            200: variants[200],
            300: variants[300],
            400: variants[400],
            500: variants[500],
            600: variants[600],
            700: variants[700],
            800: variants[800],
            900: variants[900],
            950: variants[950],
            DEFAULT: baseColor,
            contrast: {
                50: contrast[50],
                100: contrast[100],
                200: contrast[200],
                300: contrast[300],
                400: contrast[400],
                500: contrast[500],
                600: contrast[600],
                700: contrast[700],
                800: contrast[800],
                900: contrast[900],
                950: contrast[950],
                DEFAULT: contrast.DEFAULT,
            },
        };
    }

    /**
     * Generate color variants for a palette
     */
    private generateColorVariants(baseColor: string): any {
        const rgb = this.hexToRgb(baseColor);

        if (!rgb) return {};

        return {
            50: this.adjustBrightness(baseColor, 0.95),
            100: this.adjustBrightness(baseColor, 0.9),
            200: this.adjustBrightness(baseColor, 0.8),
            300: this.adjustBrightness(baseColor, 0.7),
            400: this.adjustBrightness(baseColor, 0.6),
            500: baseColor,
            600: this.adjustBrightness(baseColor, 0.4),
            700: this.adjustBrightness(baseColor, 0.3),
            800: this.adjustBrightness(baseColor, 0.2),
            900: this.adjustBrightness(baseColor, 0.1),
            950: this.adjustBrightness(baseColor, 0.05),
        };
    }

    /**
     * Generate contrast colors for accessibility
     */
    private generateContrastColors(variants: any): any {
        const contrast: any = {};

        Object.keys(variants).forEach((key) => {
            const color = variants[key];

            contrast[key] = this.getContrastColor(color);
        });

        return contrast;
    }

    private _switchToCustomTheme(): void {
        // Remove existing theme classes
        document.body.classList.remove("theme-default", "theme-brand", "theme-teal", "theme-rose", "theme-purple", "theme-amber");

        // Add custom theme class
        document.body.classList.add("theme-custom");
    }

    private _switchToTheme(themeName: string): void {
        document.body.classList.remove("theme-default", "theme-brand", "theme-teal", "theme-rose", "theme-purple", "theme-amber", "theme-custom");
        document.body.classList.add(themeName);
    }

    private _getCurrentTheme(): string {
        const themeClasses = ["theme-default", "theme-brand", "theme-teal", "theme-rose", "theme-purple", "theme-amber", "theme-custom"];

        for (const themeClass of themeClasses) {
            if (!document.body.classList.contains(themeClass)) continue;

            return themeClass;
        }

        return "theme-default";
    }

    applyDynamicTheming(project: Project): void {
        if (!project?.branding) {
            this.resetTheming();

            return;
        }

        if (!this.originalTheme) this.originalTheme = this._getCurrentTheme();

        this._updateCustomThemeVariables(project.branding);

        this._switchToCustomTheme();
    }

    resetTheming(): void {
        if (!this.originalTheme) return;

        this._switchToTheme(this.originalTheme);

        this.originalTheme = null;
    }

    getDeviceDetails(): DeviceDetails {
        // Get platform and browser information using modern detection
        const platformInfo = this._detectPlatformAndBrowser();

        // Get User-Agent Client Hints if available
        const userAgentData = this._getUserAgentClientHints();

        // Get network information if available
        const networkInfo = this._getNetworkInformation();

        // Get media preferences
        const mediaPreferences = this._getMediaPreferences();

        const details: DeviceDetails = {
            // Browser information
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
            onLine: navigator.onLine,
            onlineStatus: navigator.onLine ? "Online" : "Offline",
            cookiesEnabled: navigator.cookieEnabled,
            javaEnabled: typeof navigator.javaEnabled === "function" ? navigator.javaEnabled() : false,

            // Screen and display
            screenResolution: `${screen.width} x ${screen.height}`,
            screenAvailableResolution: `${screen.availWidth} x ${screen.availHeight}`,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            devicePixelRatio: window.devicePixelRatio || 1,

            // Window dimensions
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,

            // Hardware capabilities
            touchSupported: "ontouchstart" in window || navigator.maxTouchPoints > 0,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            hardwareConcurrency: navigator.hardwareConcurrency || 1,
            deviceMemory: (navigator as any).deviceMemory,

            // Network and connectivity
            geolocationSupported: "geolocation" in navigator,
            connectionEffectiveType: networkInfo.effectiveType,
            connectionDownlink: networkInfo.downlink,
            connectionRtt: networkInfo.rtt,

            // Platform detection
            operatingSystem: platformInfo.os,
            browserName: platformInfo.browser,
            browserVersion: platformInfo.version,
            isMobile: platformInfo.isMobile,
            isTablet: platformInfo.isTablet,
            isDesktop: platformInfo.isDesktop,

            // Privacy and preferences
            timezoneOffset: new Date().getTimezoneOffset(),
            prefersDarkMode: mediaPreferences.prefersDarkMode,
            prefersReducedMotion: mediaPreferences.prefersReducedMotion,

            // User-Agent Client Hints (when available)
            userAgentData: userAgentData,
        };

        this.getLocation();

        return details;
    }

    getLocation(): void {
        localStorage.removeItem("locationError");

        const lat = localStorage.getItem("lat");
        const lng = localStorage.getItem("lng");

        if (lat && lng) this._geoLocation.next({ lat, lng });

        if (navigator.geolocation) {
            const isEdge = navigator.userAgent?.includes("Edg") || navigator.userAgent?.includes("Edge");

            if (isEdge) {
                // MicrosoftEdge bug: https://answers.microsoft.com/en-us/microsoftedge/forum/all/microsoft-edge-for-mac-is-not-able-to-get/7e27322b-7125-4f5f-90e0-3a9416d67cfe
                // Cannot retrieve location from Microsoft Edge browser on MacOS
                return;
            }

            navigator.geolocation.getCurrentPosition(this.showPosition, this.showGeolocationError);
        } else {
            console.info("Geolocation is not supported by this browser.");
        }
    }

    /**
     * Handle successful geolocation
     */
    private showPosition = (position: GeolocationPosition): void => {
        if (!this._geoLocation || !position?.coords) return;

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        localStorage.setItem("lat", lat.toString());
        localStorage.setItem("lng", lng.toString());

        this._geoLocation.next({ lat, lng });
    };

    /**
     * Handle geolocation error
     */
    private showGeolocationError = (error: GeolocationPositionError): void => {
        console.error("Geolocation error:", error);
        localStorage.setItem("locationError", error.message);
    };

    /**
     * Get User-Agent Client Hints data if available
     */
    private _getUserAgentClientHints(): any {
        if ("userAgentData" in navigator) {
            const uaData = (navigator as any).userAgentData;
            return {
                brands: uaData.brands || [],
                mobile: uaData.mobile || false,
                platform: uaData.platform || "Unknown",
            };
        }
        return undefined;
    }

    /**
     * Get network information if available
     */
    private _getNetworkInformation(): any {
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
            };
        }

        return {
            effectiveType: undefined,
            downlink: undefined,
            rtt: undefined,
        };
    }

    /**
     * Get media preferences using modern CSS media queries
     */
    private _getMediaPreferences(): any {
        return {
            prefersDarkMode: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches,
            prefersReducedMotion: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        };
    }

    /**
     * Detect platform and browser using modern user agent parsing
     */
    private _detectPlatformAndBrowser(): any {
        const userAgent = navigator.userAgent.toLowerCase();

        // Operating System Detection
        let os = "Unknown";
        if (userAgent.includes("windows nt")) {
            os = "Windows";
        } else if (userAgent.includes("mac os x")) {
            os = "macOS";
        } else if (userAgent.includes("linux")) {
            os = "Linux";
        } else if (userAgent.includes("android")) {
            os = "Android";
        } else if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ipod")) {
            os = "iOS";
        }

        // Browser Detection
        let browser = "Unknown";
        let version = "Unknown";

        if (userAgent.includes("firefox/")) {
            browser = "Firefox";
            const match = userAgent.match(/firefox\/(\d+\.\d+)/);
            version = match ? match[1] : "Unknown";
        } else if (userAgent.includes("chrome/") && !userAgent.includes("edg/")) {
            browser = "Chrome";
            const match = userAgent.match(/chrome\/(\d+\.\d+)/);
            version = match ? match[1] : "Unknown";
        } else if (userAgent.includes("edg/")) {
            browser = "Edge";
            const match = userAgent.match(/edg\/(\d+\.\d+)/);
            version = match ? match[1] : "Unknown";
        } else if (userAgent.includes("safari/") && !userAgent.includes("chrome/")) {
            browser = "Safari";
            const match = userAgent.match(/version\/(\d+\.\d+)/);
            version = match ? match[1] : "Unknown";
        }

        // Device Type Detection
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
        const isDesktop = !isMobile && !isTablet;

        return {
            os,
            browser,
            version,
            isMobile,
            isTablet,
            isDesktop,
        };
    }

    // Utility methods
    private ensureHexFormat(color: string): string {
        if (color.startsWith("#")) return color;

        if (color.startsWith("rgb")) return this.rgbToHex(...this.parseRgb(color));

        return `#${color}`;
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : null;
    }

    private rgbToHex(r: number, g: number, b: number): string {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    private parseRgb(rgb: string): [number, number, number] {
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

        if (match) return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];

        return [0, 0, 0];
    }

    private getContrastColor(hexColor: string): string {
        const rgb = this.hexToRgb(hexColor);

        if (!rgb) return "#000000";

        const { r, g, b } = rgb;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        return brightness > 128 ? "#000000" : "#ffffff";
    }

    private adjustBrightness(hex: string, factor: number): string {
        const rgb = this.hexToRgb(hex);

        if (!rgb) return hex;

        const { r, g, b } = rgb;

        const newR = Math.round(r + (255 - r) * factor);
        const newG = Math.round(g + (255 - g) * factor);
        const newB = Math.round(b + (255 - b) * factor);

        return this.rgbToHex(newR, newG, newB);
    }
}
