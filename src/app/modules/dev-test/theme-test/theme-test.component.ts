import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-theme-test',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
  ],
  templateUrl: './theme-test.component.html',
  styleUrls: ['./theme-test.component.scss']
})
export class ThemeTestComponent implements OnInit {
  selectedValue = '';
  checkboxValue = false;
  radioValue = 'option1';
  slideToggleValue = false;
  sliderValue = 50;

  ngOnInit() {
    // Demonstrate dynamic theming
    this.applyCustomTheme();
  }

  applyCustomTheme() {
    // This simulates what your AppService does
    const root = document.documentElement;
    
    // Example: Apply a green theme
    root.style.setProperty('--custom-verifik-primary-500', '#16a34a');
    root.style.setProperty('--custom-verifik-primary-contrast-500', '#ffffff');
    root.style.setProperty('--custom-verifik-primary-600', '#15803d');
    root.style.setProperty('--custom-verifik-primary-700', '#166534');
    root.style.setProperty('--custom-verifik-primary-100', '#dcfce7');
    root.style.setProperty('--custom-verifik-primary-200', '#bbf7d0');
    root.style.setProperty('--custom-verifik-primary-300', '#86efac');
    
    // Update accent colors
    root.style.setProperty('--custom-verifik-accent-500', '#f97316');
    root.style.setProperty('--custom-verifik-accent-600', '#ea580c');
    root.style.setProperty('--custom-verifik-accent-700', '#c2410c');
    
    // Update warn colors
    root.style.setProperty('--custom-verifik-warn-500', '#ef4444');
    root.style.setProperty('--custom-verifik-warn-600', '#dc2626');
    root.style.setProperty('--custom-verifik-warn-700', '#b91c1c');
  }

  resetTheme() {
    // Reset to default theme
    const root = document.documentElement;
    root.style.removeProperty('--custom-verifik-primary-500');
    root.style.removeProperty('--custom-verifik-primary-contrast-500');
    root.style.removeProperty('--custom-verifik-primary-600');
    root.style.removeProperty('--custom-verifik-primary-700');
    root.style.removeProperty('--custom-verifik-primary-100');
    root.style.removeProperty('--custom-verifik-primary-200');
    root.style.removeProperty('--custom-verifik-primary-300');
    root.style.removeProperty('--custom-verifik-accent-500');
    root.style.removeProperty('--custom-verifik-accent-600');
    root.style.removeProperty('--custom-verifik-accent-700');
    root.style.removeProperty('--custom-verifik-warn-500');
    root.style.removeProperty('--custom-verifik-warn-600');
    root.style.removeProperty('--custom-verifik-warn-700');
  }
}