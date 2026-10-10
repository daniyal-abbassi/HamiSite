import https from "node:https";

export interface DigikalaSearchResultItem {
  id: number;
  titleFa: string;
  titleEn: string;
  imageUrl: string;
  price: number;
  rrpPrice?: number;
  rate?: number;
}

export interface DigikalaSearchResponse {
  products: DigikalaSearchResultItem[];
  pager: {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
  };
}

export interface MappedDigikalaProduct {
  digikalaId: number;
  name: string;
  englishName: string;
  slug: string;
  description: string;
  brandName?: string;
  brandEnglishName?: string;
  price: number;
  compareAtPrice?: number;
  images: Array<{
    url: string;
    altText?: string;
    isDefault: boolean;
  }>;
  specs: Array<{
    name: string;
    value: string;
  }>;
  seoTitle?: string;
  seoDescription?: string;
}

/**
 * Extracts a numeric product ID from a given input string or URL.
 * Handles:
 * - 16603814
 * - "dkp-16603814"
 * - "https://www.digikala.com/product/dkp-16603814/..."
 */
export function extractDigikalaProductId(input: string | number): number | null {
  if (typeof input === "number") return input > 0 ? input : null;
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct number check
  if (/^\d+$/.test(trimmed)) {
    const id = parseInt(trimmed, 10);
    return id > 0 ? id : null;
  }

  // dkp-12345 or DKP-12345
  const dkpMatch = trimmed.match(/dkp-(\d+)/i);
  if (dkpMatch && dkpMatch[1]) {
    const id = parseInt(dkpMatch[1], 10);
    return id > 0 ? id : null;
  }

  // URL matching /product/12345 or /product/dkp-12345
  const urlMatch = trimmed.match(/product\/(?:dkp-)?(\d+)/i);
  if (urlMatch && urlMatch[1]) {
    const id = parseInt(urlMatch[1], 10);
    return id > 0 ? id : null;
  }

  return null;
}

/**
 * Normalizes Persian text to create a clean URL-friendly slug
 */
export function generateSlugFromTitle(title: string, id: number): string {
  const cleaned = title
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FF\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${cleaned || "product"}-${id}`;
}

/**
 * Performs an HTTPS request to Digikala with automatic DigiCDN 307 cookie handling.
 */
function fetchDigikalaRaw(url: string, cookie = ""): Promise<{ statusCode: number; headers: Record<string, any>; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
        ...(cookie ? { Cookie: cookie } : {})
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 200,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.end();
  });
}

/**
 * Makes an HTTPS request to Digikala API, handling the 307 DigiCDN challenge redirect.
 */
export async function requestDigikalaApi(endpointUrl: string): Promise<any> {
  const initialRes = await fetchDigikalaRaw(endpointUrl);

  // If DigiCDN redirects with 307 and set-cookie
  if (initialRes.statusCode === 307 && initialRes.headers["set-cookie"]) {
    const rawCookies: string[] = Array.isArray(initialRes.headers["set-cookie"])
      ? initialRes.headers["set-cookie"]
      : [initialRes.headers["set-cookie"]];

    const cookieHeader = rawCookies.map((c) => c.split(";")[0]).join("; ");
    const redirectUrl = (initialRes.headers.location as string) || endpointUrl;

    const followRes = await fetchDigikalaRaw(redirectUrl, cookieHeader);
    if (followRes.statusCode >= 400) {
      throw new Error(`Digikala API responded with status ${followRes.statusCode}`);
    }
    return JSON.parse(followRes.body);
  }

  if (initialRes.statusCode >= 400) {
    throw new Error(`Digikala API responded with status ${initialRes.statusCode}`);
  }

  return JSON.parse(initialRes.body);
}

/**
 * Searches products on Digikala
 */
export async function searchDigikala(query: string, page = 1): Promise<DigikalaSearchResponse> {
  const url = `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=${page}`;
  const response = await requestDigikalaApi(url);

  const rawProducts = response?.data?.products || [];
  const pagerData = response?.data?.pager || {};

  const products: DigikalaSearchResultItem[] = rawProducts.map((p: any) => {
    const sellingPriceRials = p?.default_variant?.price?.selling_price || 0;
    const rrpPriceRials = p?.default_variant?.price?.rrp_price || 0;
    const mainImg = p?.images?.main?.url?.[0] || p?.images?.list?.[0]?.url?.[0] || "";

    return {
      id: p.id,
      titleFa: p.title_fa || "",
      titleEn: p.title_en || "",
      imageUrl: mainImg,
      price: Math.round(sellingPriceRials / 10), // Convert Rial to Toman
      rrpPrice: rrpPriceRials ? Math.round(rrpPriceRials / 10) : undefined,
      rate: p?.rating?.rate
    };
  });

  return {
    products,
    pager: {
      currentPage: pagerData.current_page || page,
      totalPages: pagerData.total_pages || 1,
      totalItems: pagerData.total_items
    }
  };
}

/**
 * Maps raw Digikala product response to Hami standard product structure
 */
export function mapDigikalaProductToHami(rawProduct: any, seoData?: any): MappedDigikalaProduct {
  const id = rawProduct.id;
  const name = rawProduct.title_fa || "";
  const englishName = rawProduct.title_en || "";
  const slug = generateSlugFromTitle(name, id);

  const sellingPriceRials = rawProduct?.default_variant?.price?.selling_price || 0;
  const rrpPriceRials = rawProduct?.default_variant?.price?.rrp_price || 0;

  // Collect images
  const images: Array<{ url: string; altText?: string; isDefault: boolean }> = [];
  const seenUrls = new Set<string>();

  const mainUrl = rawProduct?.images?.main?.url?.[0];
  if (mainUrl) {
    images.push({ url: mainUrl, altText: name, isDefault: true });
    seenUrls.add(mainUrl);
  }

  const rawImagesList = rawProduct?.images?.list || [];
  for (const item of rawImagesList) {
    const url = item?.url?.[0];
    if (url && !seenUrls.has(url)) {
      images.push({
        url,
        altText: name,
        isDefault: images.length === 0
      });
      seenUrls.add(url);
    }
  }

  // Parse specifications into { name, value }
  const specs: Array<{ name: string; value: string }> = [];
  const rawSpecifications = rawProduct?.specifications || [];

  for (const specGroup of rawSpecifications) {
    const attributes = specGroup?.attributes || [];
    for (const attr of attributes) {
      const attrTitle = (attr?.title || "").trim();
      const attrValues: string[] = attr?.values || [];
      const joinedValue = attrValues.filter(Boolean).map((v) => v.trim()).join("، ");
      if (attrTitle && joinedValue) {
        specs.push({
          name: attrTitle,
          value: joinedValue
        });
      }
    }
  }

  // Descriptions
  const description =
    rawProduct?.review?.description ||
    rawProduct?.expert_summary?.description ||
    rawProduct?.title_fa ||
    "";

  return {
    digikalaId: id,
    name,
    englishName,
    slug,
    description,
    brandName: rawProduct?.brand?.title_fa || rawProduct?.brand?.title_en,
    brandEnglishName: rawProduct?.brand?.title_en,
    price: Math.round(sellingPriceRials / 10),
    compareAtPrice: rrpPriceRials ? Math.round(rrpPriceRials / 10) : undefined,
    images,
    specs,
    seoTitle: seoData?.title || name,
    seoDescription: seoData?.description || description.slice(0, 160)
  };
}

/**
 * Fetches and normalizes a complete product by ID
 */
export async function fetchDigikalaProduct(idOrInput: string | number): Promise<MappedDigikalaProduct> {
  const id = extractDigikalaProductId(idOrInput);
  if (!id) {
    throw new Error("شناسه یا آدرس محصول دیجی‌کالا معتبر نیست");
  }

  const url = `https://api.digikala.com/v2/product/${id}/`;
  const response = await requestDigikalaApi(url);

  const productData = response?.data?.product;
  if (!productData) {
    throw new Error("محصولی با این مشخصات در دیجی‌کالا یافت نشد");
  }

  const seoData = response?.data?.seo;
  return mapDigikalaProductToHami(productData, seoData);
}

