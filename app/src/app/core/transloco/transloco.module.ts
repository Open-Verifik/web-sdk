import {
    Translation,
    TRANSLOCO_CONFIG,
    TRANSLOCO_LOADER,
    translocoConfig,
    TranslocoModule,
    TranslocoService
} from '@ngneat/transloco';
import {
    APP_INITIALIZER,
    NgModule
} from '@angular/core';
import {
    environment
} from 'environments/environment';
import {
    TranslocoHttpLoader
} from 'app/core/transloco/transloco.http-loader';

@NgModule({
    exports: [
        TranslocoModule
    ],
    providers: [{
            // Provide the default Transloco configuration
            provide: TRANSLOCO_CONFIG,
            useValue: translocoConfig({
                availableLangs: [{
                        id: 'es',
                        label: 'Spanish'
                    },
                    {
                        id: 'en',
                        label: 'English'
                    },
                ],
                defaultLang: 'es',
                fallbackLang: 'es',
                reRenderOnLangChange: true,
                prodMode: environment.production
            })
        },
        {
            // Provide the default Transloco loader
            provide: TRANSLOCO_LOADER,
            useClass: TranslocoHttpLoader
        },
        {
            // Preload the default language before the app starts to prevent empty/jumping content
            provide: APP_INITIALIZER,
            deps: [TranslocoService],
            useFactory: (translocoService: TranslocoService): any => (): Promise < Translation > => {
                const _lang = localStorage.getItem('lang');
                const defaultLang = _lang || translocoService.getDefaultLang();

                if (!_lang) localStorage.setItem('lang', defaultLang);

                console.log({
                    lang: localStorage.getItem('lang'),
                })

                translocoService.setActiveLang(defaultLang);

                return translocoService.load(defaultLang).toPromise();
            },
            multi: true
        }
    ]
})
export class TranslocoCoreModule {}