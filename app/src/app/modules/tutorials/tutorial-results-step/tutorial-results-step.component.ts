import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import {
  ActivatedRoute
} from '@angular/router';
import {
  FuseHighlightService
} from '@fuse/components/highlight';
import {
  TutorialsService
} from '../tutorials.service';

@Component({
  selector: 'app-tutorial-results-step',
  templateUrl: './tutorial-results-step.component.html',
  styleUrls: ['./tutorial-results-step.component.scss']
})
export class TutorialResultsStepComponent implements OnInit {
  tutorial: any;
  results: any;
  resultstxt: string;
  ocrData: void;

  constructor(
    private _tutorialService: TutorialsService,
    private _route: ActivatedRoute,
    private _changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this._getTutorial()

  }


  async _getTutorial(): Promise < any > {
    const routeParams = await this._route.params['_value'];

    this.tutorial = this._tutorialService.getTutorial(routeParams.id);

    this.resultstxt = localStorage.getItem(this.tutorial.route)

    if(!this.resultstxt){
      this._tutorialService.navData.currentStep = 1
      return
    }

    this.results = JSON.parse(this.resultstxt)

    if(this.results.documentData){
      const key = this.results.documentData.userConfirmedValues ? 'userConfirmedValues': 'scannedValues'
      this.ocrData = this.results.documentData[key]
    }

    this._changeDetectorRef.detectChanges()
  }

}