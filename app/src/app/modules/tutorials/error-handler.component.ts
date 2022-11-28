import {Component, Inject} from '@angular/core';
import {MAT_SNACK_BAR_DATA} from '@angular/material/snack-bar';

@Component({
    template: `
    <div>
      {{ data }}
    </div>`,
    styleUrls: ["./tutorials-routing-root/tutorials-routing-root.component.scss"],

  })
  export class errorHandlerComponent {
    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: string) { }
  }
  
  