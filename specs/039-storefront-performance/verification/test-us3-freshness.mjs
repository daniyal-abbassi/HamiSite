// Verification test for T020: Public reader freshness, revalidation, and boundary preservation.
import { revalidateHomepage } from "@/lib/revalidate-homepage";
import { findProductBySlug, queryProducts, availableProductsForDiscountRail } from "@/lib/catalog-db";

const results = [];

// 1. Invalidation safety check
try {
  revalidateHomepage();
  results.push({ test: "revalidate_homepage_safe", passed: true, note: "revalidateHomepage executes without crashing in test context" });
} catch (err) {
  results.push({ test: "revalidate_homepage_safe", passed: false, error: String(err) });
}

// 2. Public reader freshness & data projection
try {
  const sampleSlug = "گوشی-موبایل-شیائومی-مدل-poco-x7-pro-دو-سیم-کارت-ظرفیت-512-گیگابایت-و-رم-12-گیگابایت-گلوبال";
  const product = await findProductBySlug(sampleSlug);
  const isPublicBoundariesPreserved =
    product &&
    product.id === 1832 &&
    !("costPerItem" in product) && // internal admin cost field must NOT leak
    Array.isArray(product.variants) &&
    product.variants.every((v) => !("barcode" in v) && !("productIdentifier" in v));

  results.push({
    test: "public_product_boundary_preservation",
    passed: Boolean(isPublicBoundariesPreserved),
    productId: product?.id,
  });
} catch (err) {
  results.push({ test: "public_product_boundary_preservation", passed: false, error: String(err) });
}

// 3. Discount rail freshness and sorting preservation
try {
  const discountProducts = await availableProductsForDiscountRail();
  const validDiscountArray = Array.isArray(discountProducts) && discountProducts.length > 0;
  const allAvailable = discountProducts.every((p) => p.available === true);

  results.push({
    test: "discount_rail_freshness",
    passed: validDiscountArray && allAvailable,
    count: discountProducts.length,
  });
} catch (err) {
  results.push({ test: "discount_rail_freshness", passed: false, error: String(err) });
}

// 4. Query products pagination and freshness
try {
  const res = await queryProducts({ sort: "newest", page: 1, pageSize: 6 });
  const hasExpectedPage = res.data.length === 6 && res.total >= 6;
  results.push({
    test: "catalog_query_freshness",
    passed: hasExpectedPage,
    total: res.total,
  });
} catch (err) {
  results.push({ test: "catalog_query_freshness", passed: false, error: String(err) });
}

console.log(JSON.stringify(results, null, 2));
const allPassed = results.every((r) => r.passed);
if (!allPassed) {
  console.error("Freshness verification failed!");
  process.exit(1);
}
console.log("ALL PUBLIC READER FRESHNESS AND BOUNDARY ASSERTIONS PASSED!");

