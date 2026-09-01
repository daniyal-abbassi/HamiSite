import BreadcrumbComponent from "@/components/others/Breadcrumb";
import SingleProductCartView from "@/components/product/SingleProductCartView";
import SingleProductListView from "@/components/product/SingleProductListView";
import { productsData } from "@/data/products/productsData";
import Link from "next/link";

const SearchComponent = ({
  searchParams,
}: {
  searchParams: { query: string };
}) => {

  // Filter the products based on the search query
  const foundProducts = productsData.filter((product) =>
    product.name.toLowerCase().includes(searchParams.query.toLowerCase())
  );


  if (foundProducts.length === 0) {
    return <div className="text-xl font-medium flex flex-col items-center justify-center h-screen w-full">
      <p className="p-4 text-center" >Sorry, no search result found for your query !</p>
      <Link className="p-2 underline text-muted-foreground" href={'/'}>Home</Link>
    </div>;
  }

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-8 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
      <BreadcrumbComponent links={["/shop"]} pageText={searchParams.query!} />
      <p className=" capitalize">{foundProducts.length} results found for your search <span className="text-lg font-medium">
      {searchParams.query}</span></p>
      </div>
      <div className="hidden lg:grid grid-cols-1 gap-6">
        {foundProducts.map((product) => (
          <SingleProductListView key={product.id} product={product}/>
        ))}
      </div>
      <div className="grid lg:hidden grid-cols-1 md:grid-cols-3 gap-6">
        {foundProducts.map((product) => (
          <SingleProductCartView key={product.id} product={product}/>
        ))}
      </div>
    </div>
  );
};

export default SearchComponent;
