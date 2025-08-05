import { Injectable } from "@angular/core";

export interface Project {
    branding?: {
        bgColor?: string;
        buttonColor?: string;
        titleColor?: string;
        txtColor?: string;
        borderColor?: string;
    };
}

@Injectable({
    providedIn: "root",
})
export class AppService {
    private originalTheme: string | null = null;

    /**
     * Apply dynamic theming based on project branding
     */
    applyDynamicTheming(project: Project): void {
        if (!project?.branding) {
            this.resetTheming();
            return;
        }

        // Store original theme if not already stored
        if (!this.originalTheme) {
            this.originalTheme = this.getCurrentTheme();
        }

        // Update CSS variables for the custom theme
        this.updateCustomThemeVariables(project.branding);

        // Switch to custom theme
        this.switchToCustomTheme();
    }

    /**
     * Reset theming to original state
     */
    resetTheming(): void {
        if (this.originalTheme) {
            this.switchToTheme(this.originalTheme);
            this.originalTheme = null;
        }
    }

    /**
     * Update CSS variables for the custom theme
     */
    private updateCustomThemeVariables(branding: any): void {
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

    /**
     * Switch to custom theme
     */
    private switchToCustomTheme(): void {
        // Remove existing theme classes
        document.body.classList.remove("theme-default", "theme-brand", "theme-teal", "theme-rose", "theme-purple", "theme-amber");

        // Add custom theme class
        document.body.classList.add("theme-custom");
    }

    /**
     * Switch to a specific theme
     */
    private switchToTheme(themeName: string): void {
        // Remove all theme classes
        document.body.classList.remove("theme-default", "theme-brand", "theme-teal", "theme-rose", "theme-purple", "theme-amber", "theme-custom");

        // Add the specified theme class
        document.body.classList.add(themeName);
    }

    /**
     * Get current theme from body classes
     */
    private getCurrentTheme(): string {
        const themeClasses = ["theme-default", "theme-brand", "theme-teal", "theme-rose", "theme-purple", "theme-amber", "theme-custom"];

        for (const themeClass of themeClasses) {
            if (!document.body.classList.contains(themeClass)) continue;

            return themeClass;
        }

        return "theme-default"; // Default fallback
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
