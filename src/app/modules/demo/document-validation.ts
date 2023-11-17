export class OCR {
	details: any;
	_id: string;
	documentNumber: string;
	firstName: string;
	lastName: string;
	secondLastName: string;
	dateOfBirth: string;

	constructor(data) {
		if (!data) return;

		this.documentNumber = data.documentNumber;
		this.firstName = data.firstName;
		this.lastName = data.lastName;
	}
}

export class DocumentValidation {
	_id: string;
	documentType: string;
	documentNumber: string;
	url: string;
	status: string;
	validationMethod: string;
	namesMatch: boolean;
	OCRExtraction: OCR;
	scoreValidated: boolean;
	scoreValidation: any;
	arrayFields: Array<any>;

	constructor(data) {
		if (!data) return;

		this._id = data._id;
		this.documentType = data.documentType;
		this.documentNumber = data.documentNumber;
		this.url = data.url;
		this.status = data.status;
		this.validationMethod = data.validationMethod;
		this.namesMatch = data.namesMatch;

		this.OCRExtraction = new OCR(data.OCRExtraction);

		// loop for the array fields

		this.scoreValidated = data.scoreValidated;
		this.scoreValidation = data.scoreValidation;
	}
}
