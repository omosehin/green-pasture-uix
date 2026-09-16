import React from "react";
import ProductCard from "./ProductCard";
import { Product } from "@/types";

interface ProductProps {
	products: Product[];
}

const Products = ({ products }: ProductProps) => {
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
			{products?.map((product) => (
				<ProductCard key={product.id} product={product} />
			))}
		</div>
	);
};

export default Products;
