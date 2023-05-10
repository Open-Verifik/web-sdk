import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { DemoayoutComponent } from './demo.component';
@NgModule({
    declarations: [
        DemoayoutComponent
    ],
    imports     : [
        RouterModule,
        SharedModule
    ],
    exports     : [
        DemoayoutComponent
    ]
})
export class DemoLayoutModule
{
}
