export class OCR {
	details: any;
	_id: string;
	documentNumber: string;
	firstName: string;
	lastName: string;
	secondLastName: string;
	fullName: string;
	dateOfBirth: string;
	placeOfBirth: string;
	country: string;
	gender: string;
	nationality: string;
	issueDate: string;
	expirationDate: string;
	issuingAuthority: string;
	maritalStatus: string;
	observations: string;
	code: string;
	organDonor: string;
	bloodType: string;
	locationCode: string;
	inscriptionDate;
	notMapped: Array<any>;

	constructor(data) {
		if (!data) return;

		this.documentNumber = data.documentNumber;
		this.firstName =
			`${data.firstName || ""} ${data.middleName || ""}`.trim() ||
			`${data.name1 || ""} ${data.name2 || ""} ${data.name3 || ""}`.trim() ||
			`${data.givenNames || ""}`.trim();

		this.lastName = `${data.lastName || ""} ${data.secondLastName || ""}`.trim() || `${data.surname || ""}`.trim();
		this.fullName = `${this.firstName || ""} ${this.lastName || ""}`;
		this.dateOfBirth = data.dateOfBirth;
		this.country = data.country;
		this.nationality = data.nationality;
		this.gender = data.gender || data.sex;
		this.placeOfBirth = data.placeOfBirth || data.birthPlace;
		this.issueDate = data.dateOfIssue || data.issueDate;
		this.expirationDate = data.dateOfExpiry || data.expiryDate || data.expirationDate;
		this.issuingAuthority = data.issuingAuthority;
		this.maritalStatus = data.marritalStatus || data.maritalStatus;
		this.observations = data.observations;
		this.code = data.code;
		this.organDonor = data.organDonor;
		this.bloodType = data.bloodType;
		this.locationCode = data.locationCode;
		this.inscriptionDate = data.inscriptionDate;
		this.notMapped = [];

		for (const key in data) {
			if (!Object.prototype.hasOwnProperty.call(data, key)) continue;

			const value = data[key];

			if (this[key]) continue;

			this.notMapped.push({ key, value });
		}
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

		this.arrayFields = [{ key: "documentType", value: this.documentType }];

		for (const key in this.OCRExtraction) {
			if (!Object.prototype.hasOwnProperty.call(this.OCRExtraction, key)) continue;
			const value = this.OCRExtraction[key];

			if (!value || Array.isArray(value)) continue;

			this.arrayFields.push({ key, value });
		}

		this.scoreValidated = data.scoreValidated;

		this.scoreValidation = data.scoreValidation;
	}
}
