import { removeFromCart, updateQuantity } from "@/_redux/reducers/cart.reducer";
import { removeFromCartAsync, updateQuantityAsync } from "@/_redux/actions/cart.action";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { useCallback, useState } from "react";

export const useCartOperations = () => {
	const dispatch = useAppDispatch();
	const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
	const [isUpdating, setIsUpdating] = useState<string | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleQuantityChange = useCallback(
		async (id: string, newQuantity: number, maxStock?: number) => {
			if (newQuantity < 0) return;

			if (maxStock && newQuantity > maxStock) {
				setErrors((prev) => ({
					...prev,
					[id]: `Only ${maxStock} ${maxStock === 1 ? "item" : "items"} available`,
				}));
				return;
			}

			setIsUpdating(id);
			setErrors((prev) => ({ ...prev, [id]: "" }));

			try {
				if (newQuantity === 0) {
					// Update local state immediately (optimistic)
					dispatch(removeFromCart(id));
					// Sync to backend in background
					if (isAuthenticated) {
						dispatch(removeFromCartAsync(id));
					}
				} else {
					// Update local state immediately (optimistic)
					dispatch(updateQuantity({ id, quantity: newQuantity }));
					// Sync to backend in background
					if (isAuthenticated) {
						dispatch(updateQuantityAsync({ id, quantity: newQuantity }));
					}
				}
			} catch (error) {
				setErrors((prev) => ({
					...prev,
					[id]: "Failed to update quantity. Please try again.",
				}));
			} finally {
				setIsUpdating(null);
			}
		},
		[dispatch, isAuthenticated]
	);

	const handleRemoveItem = useCallback(
		async (id: string) => {
			setIsUpdating(id);
			try {
				// Update local state immediately (optimistic)
				dispatch(removeFromCart(id));
				// Sync to backend in background
				if (isAuthenticated) {
					dispatch(removeFromCartAsync(id));
				}
			} catch (error) {
				setErrors((prev) => ({
					...prev,
					[id]: "Failed to remove item. Please try again.",
				}));
			} finally {
				setIsUpdating(null);
			}
		},
		[dispatch, isAuthenticated]
	);

	return { handleQuantityChange, handleRemoveItem, isUpdating, errors };
};
