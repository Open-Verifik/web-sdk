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
  Subject
} from 'rxjs';
import {
  skip,
  takeUntil
} from 'rxjs/operators';
import {
  TutorialsService
} from '../tutorials.service';

@Component({
  selector: 'app-tutorial-results-step',
  templateUrl: './tutorial-results-step.component.html',
  styleUrls: ['./tutorial-results-step.component.scss']
})
export class TutorialResultsStepComponent implements OnInit {
  private _unsubscribeAll: Subject < any > = new Subject < any > ();

  step = 3
  tutorial: any;
  results: any;
  resultstxt: string;
  ocrData: void;
  navData: any;

  constructor(
    private _tutorialService: TutorialsService,
    private _route: ActivatedRoute,
    private _changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.navData = this._tutorialService.navData;
    this._getTutorial()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
  }

  async _getTutorial(): Promise < any > {
    const routeParams = await this._route.params['_value'];

    this.tutorial = this._tutorialService.getTutorial(routeParams.id);

    this.resultstxt = localStorage.getItem(this.tutorial.route)

    if (!this.resultstxt) {
      this._tutorialService.navData.currentStep = 2
      return
    }

    this._observeNavigationChanges()

    this.results = JSON.parse(this.resultstxt)

    if (this.results.documentData) {
      const key = this.results.documentData.userConfirmedValues ? 'userConfirmedValues' : 'scannedValues'
      this.ocrData = this.results.documentData[key]
    }

    this._changeDetectorRef.detectChanges()
  }

  _observeNavigationChanges(): void {
    this._tutorialService.navigationHandler$
      .pipe(takeUntil(this._unsubscribeAll))
      .pipe(skip(1))
      .subscribe((changes: any) => {
        if (!changes || this.navData.currentStep !== this.step || changes.variable === 1) return;

        this.navData.currentStep += changes.variable;
      });
  }


}