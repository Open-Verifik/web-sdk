const MIN_BARCODE_LENGTH = 531;

const stripToAlphaDigits = (value: string): string => value.replace(/[^\p{L}\p{Nd}+_]+/gu, " ");

const splitJava = (value: string): string[] => {
	const parts = value.split(/\s+/);
	let end = parts.length;

	while (end > 0 && parts[end - 1] === "") end -= 1;

	return parts.slice(0, end);
};

const collectGivenNames = (splitStr: string[], nameIndex: number): string[] => {
	let nombres = splitStr[nameIndex];

	for (let i = nameIndex + 1; i < splitStr.length && !/^\d.*/.test(splitStr[i]); i += 1) {
		nombres += ` ${splitStr[i]}`;
	}

	return nombres.split(" ");
};

const formatFecha = (rawFecha: string): string => {
	if (!/^\d{8}$/.test(rawFecha)) throw new Error("unparsed date");

	const year = Number(rawFecha.slice(0, 4));
	const month = Number(rawFecha.slice(4, 6));
	const day = Number(rawFecha.slice(6, 8));
	const date = new Date(Date.UTC(year, month - 1, day));
	const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

	if (!valid) throw new Error("unparsed date");

	return `${rawFecha.slice(0, 4)}-${rawFecha.slice(4, 6)}-${rawFecha.slice(6, 8)}`;
};

/**
 * Read the cédula fields from one PDF417 string. Same token rules as the server parser.
 */
export const parseDataCode = (displayValue: string): { documentNumber: string } | null => {
	if (!displayValue || displayValue.length < MIN_BARCODE_LENGTH) return null;

	try {
		return parseTokens(displayValue);
	} catch (error) {
		if (error instanceof RangeError || (error as Error).message === "unparsed date") return null;

		throw error;
	}
};

const parseTokens = (displayValue: string): { documentNumber: string } => {
	const alphaAndDigits = stripToAlphaDigits(displayValue);
	const splitStr = splitJava(alphaAndDigits);
	const containsPubDSK = alphaAndDigits.includes("PubDSK");
	const baseIndex = containsPubDSK ? 3 : 2;
	let corrimiento = 0;

	if (containsPubDSK && splitStr[2].length > 7) corrimiento -= 1;

	const nameToken = splitStr[baseIndex + corrimiento];
	const capitalMatch = /[A-Z]/.exec(nameToken || "");

	if (!capitalMatch || capitalMatch.index < 10) throw new RangeError("document number");

	const documentNumber = nameToken.substring(capitalMatch.index - 10, capitalMatch.index);
	const nameIndex = baseIndex + 2 + corrimiento;
	const nombreParts = collectGivenNames(splitStr, nameIndex);
	const genderToken = splitStr[nameIndex + nombreParts.length];

	if (!genderToken) throw new RangeError("gender token");

	formatFecha(genderToken.substring(2, 10));

	return { documentNumber };
};
