# Page dependency trees

Candidate `--context-file` sets, traced recursively through local imports
(`@/…` and relative). node_modules excluded. Apply the PAYLOAD BUDGET rule
before passing these — they are candidates, not an include-everything list.

Every `(main)` page also sits inside `app/(main)/layout.tsx` (Header + Footer +
AuthProvider + CartProvider) and `app/layout.tsx`.

## `/`

Entry: `app/(main)/page.tsx`

Dependencies:
- components/ui/button.tsx
  - lib/utils.ts
- components/home/Reveal.tsx
  - lib/utils.ts
- components/home/FeaturedProducts.tsx
  - lib/content/home.ts
  - lib/api-client.ts
    - types/api.ts
  - lib/product-images.ts
  - lib/utils.ts
  - components/ui/skeleton.tsx
    - lib/utils.ts
  - components/home/Reveal.tsx
- components/home/NewArrivals.tsx
  - lib/api-client.ts
  - lib/product-images.ts
  - lib/utils.ts
  - components/ui/skeleton.tsx
  - components/home/Reveal.tsx
- components/home/BrandShowcase.tsx
  - lib/content/home.ts
  - lib/utils.ts
  - components/home/Reveal.tsx
- components/home/AccessoryUniverse.tsx
  - lib/content/home.ts
  - lib/utils.ts
  - components/home/Reveal.tsx
- components/home/TrustBar.tsx
  - components/home/primitives.tsx
    - lib/content/home.ts
  - components/home/Reveal.tsx
  - lib/content/home.ts
- components/home/CategoryHub.tsx
  - components/home/Reveal.tsx
  - lib/content/home.ts
- components/home/CampaignBanner.tsx
  - components/ui/button.tsx
  - components/home/Reveal.tsx
  - public/brand/hami-mark.png
- components/home/B2bSection.tsx
  - components/home/Reveal.tsx
  - lib/content/home.ts
- components/home/OnlineServices.tsx
  - components/home/Reveal.tsx
  - lib/content/home.ts
- components/home/WhyHami.tsx
  - components/home/Reveal.tsx
  - lib/content/home.ts
- components/home/StoreExperience.tsx
  - components/home/Reveal.tsx
  - lib/content/home.ts
- components/home/TrustBlocks.tsx
  - components/home/Reveal.tsx
  - lib/content/home.ts
  - lib/utils.ts
- lib/content/home.ts
- app/(main)/home.css

## `/shop`

Entry: `app/(main)/shop/page.tsx`

Dependencies:
- components/shop/ShopBanner.tsx
- components/shop/ShopClient.tsx
  - lib/api-client.ts
    - types/api.ts
  - lib/content/shop.ts
  - components/shop/CategoryTiles.tsx
    - lib/utils.ts
    - lib/product-images.ts
    - components/shop/types.ts
  - components/shop/FilterSidebar.tsx
    - components/ui/button.tsx
      - lib/utils.ts
    - components/ui/input.tsx
      - lib/utils.ts
    - lib/utils.ts
    - lib/content/shop.ts
    - components/shop/types.ts
  - components/shop/ShopResults.tsx
    - components/ui/skeleton.tsx
      - lib/utils.ts
    - lib/utils.ts
    - lib/content/shop.ts
    - components/shop/ProductCard.tsx
      - components/shop/AddToCartButton.tsx
        - components/ui/button.tsx
        - components/providers/CartProvider.tsx
          - lib/api-client.ts
          - components/cart/CartDrawer.tsx
            - components/cart/CartLine.tsx
            - components/ui/button.tsx
            - components/ui/skeleton.tsx
            - components/providers/AuthProvider.tsx
            - components/providers/CartProvider.tsx
            - lib/utils.ts
          - components/providers/AuthProvider.tsx
          - types/store.ts
        - lib/api-client.ts
        - lib/utils.ts
      - lib/product-images.ts
      - lib/utils.ts
      - lib/content/shop.ts
      - components/shop/types.ts
    - components/shop/ProductListRow.tsx
      - lib/product-images.ts
      - lib/utils.ts
      - lib/content/shop.ts
      - components/shop/types.ts
    - components/shop/types.ts
  - components/shop/types.ts

## `/shop/[slug]`

Entry: `app/(main)/shop/[slug]/page.tsx`

Dependencies:
- components/shop/ProductDetail.tsx
  - components/ui/button.tsx
    - lib/utils.ts
  - components/ui/skeleton.tsx
    - lib/utils.ts
  - components/providers/AuthProvider.tsx
    - lib/api-client.ts
      - types/api.ts
    - types/auth.ts
      - lib/auth.ts
        - lib/serializers.ts
        - lib/prisma.ts
        - lib/http.ts
          - types/api.ts
      - lib/schemas/auth.ts
        - lib/phone.ts
  - components/providers/CartProvider.tsx
    - lib/api-client.ts
    - components/cart/CartDrawer.tsx
      - components/cart/CartLine.tsx
        - lib/product-images.ts
        - lib/utils.ts
        - types/store.ts
      - components/ui/button.tsx
      - components/ui/skeleton.tsx
      - components/providers/AuthProvider.tsx
      - components/providers/CartProvider.tsx
      - lib/utils.ts
    - components/providers/AuthProvider.tsx
    - types/store.ts
  - lib/api-client.ts
  - lib/api-error-fa.ts
    - lib/api-client.ts
  - lib/content/order.ts
  - lib/content/shop.ts
  - lib/product-images.ts
  - lib/utils.ts
  - types/store.ts

## `/cart`

Entry: `app/(main)/cart/page.tsx`

Dependencies:
- components/cart/CartPageClient.tsx
  - components/cart/CartLine.tsx
    - lib/product-images.ts
    - lib/utils.ts
    - types/store.ts
  - components/ui/button.tsx
    - lib/utils.ts
  - components/ui/skeleton.tsx
    - lib/utils.ts
  - components/providers/AuthProvider.tsx
    - lib/api-client.ts
      - types/api.ts
    - types/auth.ts
      - lib/auth.ts
        - lib/serializers.ts
        - lib/prisma.ts
        - lib/http.ts
          - types/api.ts
      - lib/schemas/auth.ts
        - lib/phone.ts
  - components/providers/CartProvider.tsx
    - lib/api-client.ts
    - components/cart/CartDrawer.tsx
      - components/cart/CartLine.tsx
      - components/ui/button.tsx
      - components/ui/skeleton.tsx
      - components/providers/AuthProvider.tsx
      - components/providers/CartProvider.tsx
      - lib/utils.ts
    - components/providers/AuthProvider.tsx
    - types/store.ts
  - lib/api-error-fa.ts
    - lib/api-client.ts
  - lib/utils.ts

## `/checkout`

Entry: `app/(main)/checkout/page.tsx`

Dependencies:
- components/checkout/CheckoutClient.tsx
  - components/ui/button.tsx
    - lib/utils.ts
  - components/ui/input.tsx
    - lib/utils.ts
  - components/ui/skeleton.tsx
    - lib/utils.ts
  - components/providers/AuthProvider.tsx
    - lib/api-client.ts
      - types/api.ts
    - types/auth.ts
      - lib/auth.ts
        - lib/serializers.ts
        - lib/prisma.ts
        - lib/http.ts
          - types/api.ts
      - lib/schemas/auth.ts
        - lib/phone.ts
  - components/providers/CartProvider.tsx
    - lib/api-client.ts
    - components/cart/CartDrawer.tsx
      - components/cart/CartLine.tsx
        - lib/product-images.ts
        - lib/utils.ts
        - types/store.ts
      - components/ui/button.tsx
      - components/ui/skeleton.tsx
      - components/providers/AuthProvider.tsx
      - components/providers/CartProvider.tsx
      - lib/utils.ts
    - components/providers/AuthProvider.tsx
    - types/store.ts
  - lib/api-error-fa.ts
    - lib/api-client.ts
  - lib/api-client.ts
  - lib/content/order.ts
  - lib/utils.ts
  - types/store.ts

## `/partners`

Entry: `app/(main)/partners/page.tsx`

Dependencies:
- components/partners/PartnerForm.tsx
  - components/ui/button.tsx
    - lib/utils.ts
  - components/ui/input.tsx
    - lib/utils.ts
  - lib/utils.ts
  - lib/validators.ts
  - lib/content/partners.ts
- lib/content/partners.ts

## `/login`

Entry: `app/(main)/login/page.tsx`

Dependencies:
- components/auth/LoginForm.tsx
  - components/ui/button.tsx
    - lib/utils.ts
  - components/ui/input.tsx
    - lib/utils.ts
  - components/providers/AuthProvider.tsx
    - lib/api-client.ts
      - types/api.ts
    - types/auth.ts
      - lib/auth.ts
        - lib/serializers.ts
        - lib/prisma.ts
        - lib/http.ts
          - types/api.ts
      - lib/schemas/auth.ts
        - lib/phone.ts
  - components/providers/CartProvider.tsx
    - lib/api-client.ts
    - components/cart/CartDrawer.tsx
      - components/cart/CartLine.tsx
        - lib/product-images.ts
        - lib/utils.ts
        - types/store.ts
      - components/ui/button.tsx
      - components/ui/skeleton.tsx
        - lib/utils.ts
      - components/providers/AuthProvider.tsx
      - components/providers/CartProvider.tsx
      - lib/utils.ts
    - components/providers/AuthProvider.tsx
    - types/store.ts
  - lib/api-error-fa.ts
    - lib/api-client.ts
  - lib/api-client.ts
  - types/auth.ts

## `/orders`

Entry: `app/(main)/orders/page.tsx`

Dependencies:
- components/order/OrdersListClient.tsx
  - components/ui/button.tsx
    - lib/utils.ts
  - components/ui/skeleton.tsx
    - lib/utils.ts
  - components/providers/AuthProvider.tsx
    - lib/api-client.ts
      - types/api.ts
    - types/auth.ts
      - lib/auth.ts
        - lib/serializers.ts
        - lib/prisma.ts
        - lib/http.ts
          - types/api.ts
      - lib/schemas/auth.ts
        - lib/phone.ts
  - lib/api-client.ts
  - lib/content/order.ts
  - lib/utils.ts
  - types/store.ts

## `/admin`

Entry: `app/(admin)/admin/page.tsx`

Dependencies:
- components/admin/AdminPageHeader.tsx
- components/admin/dashboard/DashboardClient.tsx
  - components/admin/StatCard.tsx
  - components/admin/StatusBadge.tsx
    - lib/content/order.ts
    - lib/utils.ts
  - components/ui/skeleton.tsx
    - lib/utils.ts
  - lib/api-client.ts
    - types/api.ts
  - lib/content/order.ts
  - lib/utils.ts
  - types/store.ts

## `/admin/products`

Entry: `app/(admin)/admin/products/page.tsx`

Dependencies:
- components/admin/AdminPageHeader.tsx
- components/admin/products/ProductsAdminClient.tsx
  - components/admin/Pagination.tsx
    - components/ui/button.tsx
      - lib/utils.ts
    - lib/utils.ts
  - components/admin/StatusBadge.tsx
    - lib/content/order.ts
    - lib/utils.ts
  - components/ui/button.tsx
  - components/ui/input.tsx
    - lib/utils.ts
  - components/ui/skeleton.tsx
    - lib/utils.ts
  - lib/api-client.ts
    - types/api.ts
  - lib/product-images.ts
  - lib/utils.ts
  - types/admin.ts
    - types/store.ts

