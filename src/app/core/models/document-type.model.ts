export interface DocumentType {
	_id: string;
	name: string;
	i18nKey: string;
	category: string;
	country: string;
	code: string;
	fields: Field[];
	version?: string;
	frontImage?: string;
	backImage?: string;
}

export interface Field {
	name: string;
	i18nKey: string;
	type: string;
}

export type DocumentCategory = "government_id" | "passport" | "license" | "criminal" | "bank_document" | "tax_document" | "business_document";

export type DocumentCategoryOption = {
	value: DocumentCategory;
	label: string;
};
