import { createContext, useContext, useState, useEffect, useCallback } from "react";
import React from "react";
import { appConstants } from "@/_redux/constants";
import { isPlausiblePriceFactor } from "@/_utils/priceFactor";
import { useAppSelector } from "@/_redux/store";

interface CurrencyConfig {
	code: string;       // "NGN" or "USD"
	symbol: string;     // "₦" or "$"
	priceFactor: number; // 1 for NGN, conversion rate for others
	country: string;    // "NG", "US", etc.
}

interface CurrencyContextValue {
	currency: CurrencyConfig;
	isNigeria: boolean;
	formatPrice: (priceInNaira: number) => string;
	loading: boolean;
}

const DEFAULT_CURRENCY: CurrencyConfig = {
	code: "NGN",
	symbol: "₦",
	priceFactor: 1,
	country: "NG",
};

const CurrencyContext = createContext<CurrencyContextValue>({
	currency: DEFAULT_CURRENCY,
	isNigeria: true,
	formatPrice: (price) => `₦${price.toLocaleString()}`,
	loading: true,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
	const [currency, setCurrency] = useState<CurrencyConfig>(DEFAULT_CURRENCY);
	const [loading, setLoading] = useState(true);
	// Admin-owned kill-switch (store.orderSettings.multiCurrencyEnabled, default
	// off). Checked before any country/rate logic runs — off means every
	// visitor sees NGN regardless of country, exactly today's behaviour.
	const multiCurrencyEnabled = useAppSelector((state) => state.settings.multiCurrencyEnabled);

	useEffect(() => {
		if (!multiCurrencyEnabled) {
			setCurrency(DEFAULT_CURRENCY);
			setLoading(false);
			return;
		}

		setLoading(true);

		const detectCurrency = async () => {
			try {
				const axiosInstance = (await import("@/_utils/axiosInstance")).default;

				// 1. Prefer the server's own IP-resolved country/currency — it has
				// the authoritative source of truth (server-side IP, cached) — over
				// the browser's direct IPInfo call. Only fall back to the browser
				// call when the server lookup itself is unavailable.
				let countryCode: string | null = null;
				let currencyCode: string | null = null;
				let factor: number | null = null;
				try {
					const resolveRes = await axiosInstance.get("country/resolve");
					const resolved = resolveRes.data?.data;
					if (resolved?.countryCode) {
						countryCode = resolved.countryCode;
						currencyCode = resolved.currencyCode ?? null;
						factor = Number(resolved.priceFactor);
					}
				} catch {
					// Server resolution unavailable — fall through to browser IPInfo.
				}

				if (!countryCode) {
					countryCode = sessionStorage.getItem("gp-user-country");
					if (!countryCode) {
						const response = await fetch(
							`https://ipinfo.io/json?token=${appConstants.IPINFO_TOKEN}`
						);
						if (!response.ok) throw new Error("IPInfo failed");
						const data = await response.json();
						countryCode = (data?.country as string) || "NG";
						sessionStorage.setItem("gp-user-country", countryCode);
					}
					// Browser path didn't already resolve currency/rate — look it up.
					currencyCode = null;
					factor = null;
				}

				if (countryCode === "NG") {
					setCurrency(DEFAULT_CURRENCY);
					return;
				}

				// Non-NG visitor: the real priceFactor must come from the backend.
				// No hardcoded guess here — a failure or bad value falls back to NGN,
				// never a silently wrong conversion.
				if (currencyCode == null || !Number.isFinite(factor)) {
					try {
						const countryRes = await axiosInstance.get(`country`);
						const countries = countryRes.data?.data?.items || [];
						const match = countries.find(
							(c: any) => c.code?.toUpperCase() === countryCode!.toUpperCase()
						);
						currencyCode = match?.currencyCode ?? null;
						factor = Number(match?.priceFactor);
					} catch (err) {
						console.warn("[useCurrency] Failed to fetch country pricing — showing NGN", err);
						setCurrency(DEFAULT_CURRENCY);
						return;
					}
				}

				if (currencyCode && isPlausiblePriceFactor(factor as number)) {
					setCurrency({
						code: currencyCode,
						symbol: getCurrencySymbol(currencyCode),
						priceFactor: factor as number,
						country: countryCode,
					});
				} else {
					console.warn(
						`[useCurrency] Rejected priceFactor for "${countryCode}" (value: ${factor}) — showing NGN`
					);
					setCurrency(DEFAULT_CURRENCY);
				}
			} catch {
				// IPInfo/location detection failed — default to Nigeria
				setCurrency(DEFAULT_CURRENCY);
			} finally {
				setLoading(false);
			}
		};

		detectCurrency();
	}, [multiCurrencyEnabled]);

	const formatPrice = useCallback(
		(priceInNaira: number) => {
			if (currency.code === "NGN") {
				return `₦${priceInNaira.toLocaleString()}`;
			}
			const converted = Math.round(priceInNaira * currency.priceFactor * 100) / 100;
			return `${currency.symbol}${converted.toLocaleString(undefined, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})}`;
		},
		[currency]
	);

	const isNigeria = currency.country === "NG";

	return React.createElement(
		CurrencyContext.Provider,
		{ value: { currency, isNigeria, formatPrice, loading } },
		children
	);
}

function getCurrencySymbol(code: string): string {
	const symbols: Record<string, string> = {
		NGN: "₦",
		USD: "$",
		EUR: "€",
		GBP: "£",
		GHS: "₵",
		ZAR: "R",
		KES: "KSh",
	};
	return symbols[code] || code + " ";
}

export function useCurrency() {
	return useContext(CurrencyContext);
}
