/**
 * Pure card-input helpers. Formatting and client-side sanity checks only —
 * these never authorise anything, they just stop obvious typos before the
 * user is handed off to Paystack.
 */

export const onlyDigits = (v: string): string => v.replace(/\D/g, "");

export const formatCard = (v: string): string =>
	onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");

export const formatExpiry = (v: string): string => {
	const d = onlyDigits(v).slice(0, 4);
	return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};

/** Luhn checksum. */
export const luhnValid = (pan: string): boolean => {
	if (pan.length < 13) return false;
	let sum = 0;
	let double = false;
	for (let i = pan.length - 1; i >= 0; i--) {
		let n = Number(pan[i]);
		if (double) {
			n *= 2;
			if (n > 9) n -= 9;
		}
		sum += n;
		double = !double;
	}
	return sum % 10 === 0;
};

/** MM/YY must be a real month and not already past. `now` is injectable for tests. */
export const expiryValid = (expiry: string, now: Date = new Date()): boolean => {
	const [mm, yy] = expiry.split("/");
	if (!mm || !yy || yy.length < 2) return false;
	const month = Number(mm);
	if (!Number.isInteger(month) || month < 1 || month > 12) return false;
	const endOfMonth = new Date(2000 + Number(yy), month, 0, 23, 59, 59);
	return endOfMonth >= now;
};

export const brandOf = (pan: string): string => {
	if (/^4/.test(pan)) return "VISA";
	if (/^(5[1-5]|2[2-7])/.test(pan)) return "Mastercard";
	if (/^(506[01]|507[89]|6500)/.test(pan)) return "Verve";
	if (/^3[47]/.test(pan)) return "Amex";
	return "";
};
