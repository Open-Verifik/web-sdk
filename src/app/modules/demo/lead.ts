export class Session {
	_id: string;
	identifier: string;
	lead: string;
	status: string;
	liveness: any; // to be defined as well as a class
	comparison: any;
	comparisonResult: any;
	generalInformation: any;
	documentType: any;
	documentTypeFields: any;
	location: any;
	pro: any;
	proFields: any;
	studio: any;
	studioFields: any;
	prompt: any;
	promptFields: any;
	lat: string;
	lng: string;

	constructor(data) {
		this._id = data._id || "new";
		this.identifier = data.identifier;
		this.lead = data.lead;
		this.status = data.status;
		this.liveness = data.liveness || {};
		this.comparison = data.comparison || {};
		this.comparisonResult = data.comparisonResult || [];
		this.generalInformation = data.generalInformation || {};
		//...
		this.lat = data.lat;
		this.lng = data.lng;
	}
}

export class Lead {
	_id: string;
	status: string;
	phone: string;
	countryCode: string;
	name: string;
	companyName: string;
	email: string;
	website: string;
	jobFunction: string;
	sessionsCount: number;
	sessionsLimit: number;
	sessions: Session;

	constructor(data) {
		if (!data) return;
		this._id = data._id || "new";
		this.status = data.status || "active";
		this.phone = data.phone;
		this.countryCode = data.countryCode;
		this.name = data.name;
		this.companyName = data.companyName;
		this.email = data.email;
		this.website = data.website;
		this.jobFunction = data.jobFunction;
		this.sessionsCount = data.sessionsCount || 0;
		this.sessionsLimit = data.sessionsLimit || 10;
	}
}
