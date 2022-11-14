import {
    Component,
    OnInit
} from '@angular/core';
import {
    ActivatedRoute
} from '@angular/router';
import {
    TranslocoService
} from '@ngneat/transloco';
import {
    TutorialsService
} from '../tutorials.service';

@Component({
    selector: 'app-tutorial-instructions-step',
    templateUrl: './tutorial-instructions-step.component.html',
    styleUrls: ['./tutorial-instructions-step.component.scss']
})
export class TutorialInstructionsStepComponent implements OnInit {
    navData: any;
    tutorial: any;
    instructions: any;

    constructor(
        private _route: ActivatedRoute,
        private _tutorialService: TutorialsService,
        private translocoService: TranslocoService
    ) {
        
    }

    ngOnInit(): void {
        this._getTutorial();
    }

    async _getTutorial(): Promise < any > {
        const routeParams = await this._route.params['_value'];

        this.tutorial = this._tutorialService.getTutorial(routeParams.id);

        this.instructions = this.translocoService.translate(this.tutorial.instructions);

        console.log({tutorial: this.instructions});
    }

}