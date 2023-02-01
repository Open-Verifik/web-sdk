import {
	Component,
	OnInit,
	ChangeDetectorRef,
	OnDestroy
} from '@angular/core';
import {
	takeUntil
} from 'rxjs/operators';
import {
	KycService
} from '../kyc.service';
import {
	Observable,
	Subject
} from 'rxjs';
import {
	FormGroup,
	FormBuilder,
	Validators
} from '@angular/forms';
import {
	AppRegistrationModel,
	ProjectFlowModel,
	ProjectModel
} from 'app/modules/models';
import {
	Router
} from '@angular/router';
import moment from 'moment';
@Component({
	selector: 'app-kyc-form-filling',
	templateUrl: './kyc-form-filling.component.html',
	styleUrls: ['./kyc-form-filling.component.scss']
})
export class KycFormFillingComponent implements OnInit {
	private _unsubscribeAll: Subject < any > = new Subject < any > ();

	project: ProjectModel;

	projectFlow: ProjectFlowModel;

	appRegistration: AppRegistrationModel;

	form: any;

	formAnwsers: any;

	questions: any;

	sectionOrder: any = [];

	dataToPost: any;

	saving: boolean;

	constructor(
		private _KycService: KycService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _formBuilder: FormBuilder,
	) {}

	ngOnInit(): void {
		this._observeNavigationChanges();

		this._ObserveProject();

		this.getForm();
	}


	_moveToStep(changes: any): void {
		changes.projectSteps.selectedIndex = changes.stepToGo;
	}

	_ObserveProject(): void {
		this._KycService.currentAppRegistration$
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((appRegistration: AppRegistrationModel) => {
				this.appRegistration = appRegistration;

				this.project = appRegistration.project;

				this.projectFlow = appRegistration.projectFlow;

				this._changeDetectorRef.markForCheck();

			});
	}

	_observeNavigationChanges(): void {
		this._KycService.navigationHandler$
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((changes: any) => {
				if (!changes) {
                    return;
				}

				if (this._KycService.navData.currentStep > changes.stepToGo) {
                    this._KycService.navData.currentStep = changes.stepToGo;

                    changes.projectSteps.selectedIndex = changes.stepToGo;

                    this._changeDetectorRef.markForCheck();

                    return;
                }
				
				const isValid = this._validateStep(changes);

				if (!isValid) {
					return;
				}

				this._saveChanges(changes);
			});
	}

	getForm(): void {
		let payload = {
			where_projectFlow: this.projectFlow._id,
			where_project: this.project._id,
			populates: ['formFields', 'formFields.container'],
			sort: '-createdAt',
			findOne: 1
		}
		this._KycService.getForm(payload).subscribe(
			result => {
				this.form = result.data;

				console.log({form: this.form});
				
				let currentContainter;
				
				for (let index = 0; index < result.data.formFields.length; index++) {
					const question = result.data.formFields[index];
					
					if (!this.questions && question.type != 'container') {
						this.questions = {
							starting: [question]
						}
					
						currentContainter = 'starting';
					
						this.sectionOrder.push('starting');
					
						continue;
					}
					
					if (question.type == 'container') {
						!this.questions ? this.questions = {} : 'continue';

						this.questions[question.label] = [];
						
						currentContainter = question.label;
						
						this.sectionOrder.push(question.label)
						
						continue;
					}

					if (question.type != 'container') {
						this.questions[currentContainter].push(question);
					
						continue;
					}
				}

				this.createFormgroupsForSection(this.questions);

				this._changeDetectorRef.markForCheck();

				console.log(this.questions);
			}
		)
	}

	_validateStep(changes: any = {}): boolean {
		if (!this.formAnwsers) {
			return false;
		}

		let allAnswers = [];

		for (const key in this.formAnwsers) {
			const section = this.formAnwsers[key];

			if (!section.valid) {
				return Boolean(false);
			}

			const sectionAnswers = this.getAnswersFromSection(section.controls);

			Array.prototype.push.apply(allAnswers, sectionAnswers);
		};

		this.dataToPost = {
			answers: allAnswers,
		};

		return Boolean(true);
	}

	getAnswersFromSection(sectionControls): any {
		const fieldAnswers = [];

		for (const key in sectionControls) {
			const toPromise = sectionControls[key];

			const payload = {
				formField: key,
				answer: toPromise.value,
			};

			fieldAnswers.push(payload);
		}

		return fieldAnswers;
	}

	async _saveChanges(changes: any) {
		if (this.saving) {
			return;
		}

		this.saving = true;

		this._KycService.postSubmitionForm(this.dataToPost).subscribe(
			result => {
				this.saving = false;

				this.changeAppRegistration(result.data);
			}, err => {
				console.error({
					err
				});

				this.saving = false;
			}
		);
	}

	changeAppRegistration(formSubmittion): void {
		this._KycService.updateAppRegistration(this.appRegistration._id, {
			status: 'COMPLETED',
			formSubmittion: formSubmittion._id,
		}).subscribe(response => {
			localStorage.removeItem('accessToken')
			window.location.href = `${this.projectFlow.redirectUrl}?type=${this.projectFlow.type}&token=${response.data.token}`;
		});
	}

	createFormgroupsForSection(sections): void {
		let group = {}
		for (const key in sections) {
			group[key] = this.createQuestions(sections[key])
		}
		this.formAnwsers = group;
	}

	createQuestions(questionsArray): FormGroup {
		let subgroup = {}
		for (let index = 0; index < questionsArray.length; index++) {
			const question = questionsArray[index];
			subgroup[question._id] = ['', Validators.required]
		}
		return this._formBuilder.group(subgroup);
	}

	returnQuestionData(section, id, key): any {
		return this.questions[section].find(element => element._id == id)[key]
	}
}