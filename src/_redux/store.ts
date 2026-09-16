// LIBRARY COMPONENTS
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import {
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from "redux-persist";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

// CUSTOM COMPONENTS
import rootReducer from "./reducers";
import { appConstants } from "./constants";

const persistConfig = {
	key: `${appConstants.ROOT_STORAGE}`,
	storage,
	whitelist: ["auth", "cart", "wishlist"],
	version: 1,
	// The backend migrated every entity id from int to UUIDv7. Any state
	// persisted before this deploy (version is undefined) may hold stale
	// integer ids — cart.cartId and auth.user.id are both fed straight back
	// into API/websocket calls, so a stale value breaks those calls silently.
	// Drop them and let those slices rehydrate fresh. wishlist is dropped too:
	// wishlist.tsx's handleAddAllToCart dispatches addToCart(product) with the
	// persisted (stale-id) Product straight into cart, so it is just as
	// id-sensitive as cart/auth despite having no direct backend calls of its own.
	migrate: (state: any) => {
		if (!state || state._persist?.version === 1) {
			return Promise.resolve(state);
		}
		const { cart, wishlist, ...rest } = state;
		if (rest.auth) {
			rest.auth = { ...rest.auth, user: null };
		}
		return Promise.resolve(rest);
	},
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
				// ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
			},
		}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch: () => AppDispatch = useDispatch;
