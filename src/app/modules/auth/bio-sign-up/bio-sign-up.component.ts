import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'bio-sign-up',
    templateUrl: './bio-sign-up.component.html',
    styleUrls: ['../auth.module.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthBioSignUpComponent implements OnInit, OnDestroy {
    config: any = {
        colors:{
            bgColor: '#01236D',
            borderColor: '#B2BDD3',
            txtColor: '#8091B6',
            titleColor: '#FFFFFF',
        },
        logo: '',

    };
    img: any;
    method: any = 'phone';
    previewImg: any = false;
    color: any = '#6851FF';
    colorMap: any = {
        bgColor: '#01236D',
        borderColor: '#B2BDD3',
        txtColor: '#8091B6',
        titleColor: '#FFFFFF',
    };
    dialogRef: any;
    checked = false;
    disabled = false;
    frontURL: any;
    theme: any;
    name: any;
    logo: any;
    requires2fa: any;
    phone: any;
    email: any;
    selectedProject: any;
    loading: boolean = false;
    activePreview: any = 'redirect';
    countries: any;
    countryCode: string;
    selectedCountry: any;
    tabletMode: boolean;
    phoneMode: boolean;
    laptopMode: boolean;
    bigScreenMode: boolean;
    projectFlow: any;
    projectId: any;
    flowId: any;
    otp: any;
    otp2fa: any;
    sendOTP: any = false;
    unsetAuthenticator: any;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _httpClient: HttpClient,
        private _snackBar: MatSnackBar,
        private dialog: MatDialog,
        private _fuseMediaWatcherService: FuseMediaWatcherService
    ) {
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.phoneMode = Boolean(
                    !matchingAliases.includes('lg') &&
                        !matchingAliases.includes('md') &&
                        !matchingAliases.includes('sm')
                );
                this.tabletMode = Boolean(
                    !matchingAliases.includes('lg') &&
                        !matchingAliases.includes('md') &&
                        matchingAliases.includes('sm')
                );
                this.laptopMode = Boolean(
                    !matchingAliases.includes('lg') &&
                        matchingAliases.includes('md') &&
                        matchingAliases.includes('sm')
                );
                this.bigScreenMode = Boolean(
                    matchingAliases.includes('lg') &&
                        matchingAliases.includes('md') &&
                        matchingAliases.includes('sm')
                );
                if (this.phoneMode) {
                    console.log('phone');
                }
                if (this.tabletMode) {
                    console.log('tablet');
                }
                if (this.laptopMode) {
                    console.log('laptop');
                }
                if (this.bigScreenMode) {
                    console.log('big');
                }
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    selectMethod(data): void {
        this.method = data;
    }

    onChange(data) {
        console.log(data);
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

    keyPressNumbers(event): Boolean {
        var charCode = event.which ? event.which : event.keyCode;
        // Only Numbers 0-9
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            event.preventDefault();
            return false;
        } else {
            return true;
        }
    }

    selectMethodToLog(method): void {
        switch (method) {
            case 'phone':
                break;
            case 'email':
                this.postEmailValidation();
                break;

            default:
                break;
        }
    }

    postEmailValidation(): void {
        if (this.loading) {
            return;
        }

        if (!this.flowId || !this.projectId || !this.email) {
            this.errorHandler(
                'Este servicio no esta disponible en este momento',
                'error',
                3000
            );
            return;
        }
        this.loading = false;

        let payload = {
            id: this.projectId,
            email: this.email,
        };

        this._projectService
            .createEmailValidation(payload)
            .subscribe((result) => {
                this.requires2fa = result.data.requires2FA;
                this.sendOTP = true;
                this._changeDetectorRef.markForCheck();
            });
    }
}
