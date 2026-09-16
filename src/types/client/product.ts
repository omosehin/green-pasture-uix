export interface Product {
	id: string;
	name: string;
	email: string;
}

export interface ProductsState {
	isFetchingAllProducts: boolean;
	isFetchingProduct: boolean;
	products: Product[];
	product: Product | null;
}
