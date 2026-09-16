import localforage from "localforage";
import { usePathname } from "next/navigation";

export const generateUUID = (): string => {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}

	// Fallback if crypto.randomUUID is not supported
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

// Mapping of ISO country codes to currency symbols
const countryCurrencyMap: Record<string, string> = {
	// Africa
	NG: "₦", // Nigeria - Naira
	GH: "₵", // Ghana - Cedi
	KE: "KSh", // Kenya - Shilling
	ZA: "R", // South Africa - Rand
	EG: "£", // Egypt - Pound
	DZ: "د.ج", // Algeria - Dinar
	MA: "د.م.", // Morocco - Dirham
	ET: "Br", // Ethiopia - Birr
	UG: "USh", // Uganda - Shilling
	TZ: "TSh", // Tanzania - Shilling

	// North America
	US: "$", // USA - Dollar
	CA: "$", // Canada - Dollar
	MX: "$", // Mexico - Peso

	// South America
	BR: "R$", // Brazil - Real
	AR: "$", // Argentina - Peso
	CL: "$", // Chile - Peso
	CO: "$", // Colombia - Peso
	PE: "S/", // Peru - Sol

	// Europe
	GB: "£", // UK - Pound
	DE: "€", // Germany - Euro
	FR: "€", // France - Euro
	ES: "€", // Spain - Euro
	IT: "€", // Italy - Euro
	NL: "€", // Netherlands - Euro
	SE: "kr", // Sweden - Krona
	NO: "kr", // Norway - Krone
	DK: "kr", // Denmark - Krone
	CH: "CHF", // Switzerland - Franc
	RU: "₽", // Russia - Ruble
	PL: "zł", // Poland - Zloty

	// Asia
	IN: "₹", // India - Rupee
	CN: "¥", // China - Yuan
	JP: "¥", // Japan - Yen
	KR: "₩", // South Korea - Won
	SG: "$", // Singapore - Dollar
	MY: "RM", // Malaysia - Ringgit
	TH: "฿", // Thailand - Baht
	PH: "₱", // Philippines - Peso
	PK: "₨", // Pakistan - Rupee
	VN: "₫", // Vietnam - Dong
	HK: "HK$", // Hong Kong - Dollar
	ID: "Rp", // Indonesia - Rupiah
	BD: "৳", // Bangladesh - Taka

	// Middle East
	AE: "د.إ", // UAE - Dirham
	SA: "﷼", // Saudi Arabia - Riyal
	QA: "﷼", // Qatar - Riyal
	KW: "د.ك", // Kuwait - Dinar
	OM: "﷼", // Oman - Rial
	BH: ".د.ب", // Bahrain - Dinar
	JO: "د.ا", // Jordan - Dinar
	LB: "ل.ل", // Lebanon - Pound

	// Oceania
	AU: "$", // Australia - Dollar
	NZ: "$", // New Zealand - Dollar
	FJ: "$", // Fiji - Dollar
};

// Utility function to get the currency symbol based on the country code
export const getCurrencySymbol = (countryCode?: string | null): string => {
	if (!countryCode) return "₦"; // Fallback to Dollar if no country
	return countryCurrencyMap[countryCode.toUpperCase()] || "₦";
};

export const useIsAuthRoute = () => {
	const pathname = usePathname();

	const routes = [
		"/404",
		"/login",
		"/signup",
		"/forgot-password",
		"/verify-user/[email]",
	];

	const checker = (route: string) => routes.indexOf(route) !== -1;

	return checker(pathname);
};

export interface StorageObject {
	[key: string]: unknown;
}

export const setObjectInStorage = async (
	key: string,
	object: StorageObject | boolean
): Promise<boolean> => {
	try {
		await localforage.setItem(key, object);
		return true;
	} catch (error) {
		throw error;
	}
};

interface StoredObject {
	// Define the structure of the object you expect to retrieve from storage
	token?: string;
	[key: string]: unknown;
}

export const getObjectFromStorage = async (
	key: string
): Promise<StoredObject | null> => {
	try {
		const object = await localforage.getItem<StoredObject>(key);

		if (!object) {
			return null;
		}

		return object;
	} catch (error) {
		throw error;
	}
};

export const clearObjectFromStorage = async (key: string): Promise<boolean> => {
	try {
		await localforage.removeItem(key);
		return true;
	} catch (error) {
		throw error;
	}
};

export const capitalizeFirstLetter = (string: string): string => {
	if (typeof string === "string" && string.length > 0) {
		return string[0].toUpperCase() + string.slice(1).toLowerCase();
	}

	return "";
};
