import {
    Component,
    OnInit,
    ChangeDetectorRef
} from '@angular/core';
import {
    BehaviorSubject,
    Subject,
    combineLatest
} from 'rxjs';
import {
    ActivatedRoute,
    Router
} from '@angular/router';
import {
    takeUntil
} from 'rxjs/operators';
import {
    MatSelectChange
} from '@angular/material/select';
import {
    MatSlideToggleChange
} from '@angular/material/slide-toggle';
import {
    TutorialsService
} from '../tutorials.service';
import { textBiometrics } from 'app/modules/biometrics/biometrics.es';

@Component({
    selector: 'app-tutorials-list',
    templateUrl: './tutorials-list.component.html',
    styleUrls: ['./tutorials-list.component.scss']
})
export class TutorialsListComponent implements OnInit {
    tutorials: Array < any > ;

    private _unsubscribeAll: Subject < any > = new Subject < any > ();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _tutorialService: TutorialsService
    ) {
        this._tutorialService.navData.currentStep = 0;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.tutorials = this._tutorialService.tutorials;
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Filter by search query
     *
     * @param query
     */
    filterByQuery(query: string): void {
        // this.filters.query$.next(query);
    }

    /**
     * Filter by category
     *
     * @param change
     */
    filterByCategory(change: MatSelectChange): void {
        // this.filters.categorySlug$.next(change.value);
    }

    /**
     * Show/hide completed courses
     *
     * @param change
     */
    toggleCompleted(change: MatSlideToggleChange): void {
        // this.filters.hideCompleted$.next(change.checked);
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    seeTutorial(route: string): void {
        this._router.navigate(['tutorials', route]);
    }

}