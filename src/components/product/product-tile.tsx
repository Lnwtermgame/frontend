import Image from "next/image";
import { Link } from "@/i18n/routing";
import type { Product } from "@/lib/api/products";
import { productImage } from "@/lib/product-image";

const BASE_BY_TYPE: Record<Product["productType"], string> = {
  DIRECT_TOPUP: "/games",
  CARD: "/card",
  MOBILE_RECHARGE: "/mobile-recharge",
};

export function ProductTile({ product }: { product: Product }) {
  const types = product.types ?? [];
  const minPrice = types.length ? Math.min(...types.map((t) => t.displayPrice)) : null;

  return (
    <Link
      href={`${BASE_BY_TYPE[product.productType]}/${product.slug}`}
      className="group block overflow-hidden rounded-[14px] border bg-card shadow-(--shadow-tile) transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-primary"
    >
      <div className="relative aspect-square">
        <Image
          src={productImage(product.name, product.imageUrl)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 200px"
          className="object-cover"
        />
      </div>
      <div className="p-2.5">
        <p className="truncate text-[13px] font-semibold">{product.name}</p>
        {minPrice !== null && (
          <p className="num mt-0.5 text-xs font-bold text-primary">
            เริ่มต้น{" "}
            {new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
              maximumFractionDigits: 0,
            }).format(minPrice)}
          </p>
        )}
      </div>
    </Link>
  );
}
