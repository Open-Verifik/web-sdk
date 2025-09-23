import { DocumentType } from "./document-type.model";

export const isDocumentType = (value: any): value is DocumentType => {
    return typeof value === "object" && value !== null;
};

export type PromptTemplate = {
    __v?: number;
    _id?: string;
    active: boolean;
    client?: string;
    country: string;
    createdAt: string;
    description: string;
    documentCategory: string;
    documentType?: string | DocumentType;
    documentTypes?: string[]; // deprecated
    fieldMapping?: Record<string, string>;
    fields: string[];
    format: string;
    name: string;
    project?: string;
    prompt: string;
    requiresBackSide: boolean;
    system: boolean;
    updatedAt: string;
    version: number;
};
