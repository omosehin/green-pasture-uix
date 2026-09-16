import React from "react";
import FilteredProducts from "@/_components/FilteredProducts";
import Layout from "@/_components/Layout";

const ProductsPage: React.FC = () => {
	return (
		<Layout pageTitle={"Products"}>
			<FilteredProducts />;
		</Layout>
	);
};

export default ProductsPage;
