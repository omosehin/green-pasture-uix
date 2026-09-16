import React from "react";
import FilteredProducts from "@/_components/FilteredProducts";
import Layout from "@/_components/Layout";

const SearchPage: React.FC = () => {
	return (
		<Layout pageTitle={"Search"}>
			<FilteredProducts />
		</Layout>
	);
};

export default SearchPage;
