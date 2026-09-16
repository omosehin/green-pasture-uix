import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth.reducer";
import adminReducer from "./admin.reducer";
import cartReducer from "./cart.reducer";
import userReducer from "./users.reducer";
import productReducer from "./products.reducer";
import categoryReducer from "./category.reducers";
import wishlistReducer from "./wishlist.reducer";
import searchReducer from "./search.reducer";
import checkoutReducer from "./checkout.reducer";
import reviewReducer from "./review.reducer";
import profileReducer from "./profile.reducer";
import settingsReducer from "./settings.reducer";
import tagReducer from "./tag.reducer";

const rootReducer = combineReducers({
	auth: authReducer,
	admin: adminReducer,
	cart: cartReducer,
	user: userReducer,
	product: productReducer,
	category:categoryReducer,
	wishlist: wishlistReducer,
	search: searchReducer,
	checkout: checkoutReducer,
	review: reviewReducer,
	profile: profileReducer,
	settings: settingsReducer,
	tag: tagReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
