import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function CartDrawer() {
  const { cart, isOpen, closeCart, loading, itemCount, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="left" className="cart-sheet" dir="rtl">
        <SheetHeader className="cart-sheet-header">
          <div className="cart-sheet-kicker">HAMI / CART</div>
          <SheetTitle>سبد نمایشی شما</SheetTitle>
          <SheetDescription>این پنل برای نمایش تجربهٔ انتخاب و مدیریت کالا طراحی شده است؛ پرداخت واقعی فعال نیست.</SheetDescription>
        </SheetHeader>

        <div className="cart-sheet-items">
          {!cart?.items.length ? (
            <div className="cart-empty">
              <ShoppingBag size={27} />
              <b>سبد شما هنوز خالی است.</b>
              <span>از کاتالوگ، کالای مورد نظرتان را اضافه کنید.</span>
            </div>
          ) : (
            cart.items.map((item) => (
              <article className="cart-line" key={item.lineId}>
                <div className="cart-line-image">
                  <img src={item.image} alt={`تصویر نمایشی ${item.productTitle}`} />
                </div>
                <div className="cart-line-content">
                  <b>{item.productTitle}</b>
                  <small>کالای نمایشی</small>
                  <strong>آیتم نمایشی</strong>
                  <div className="cart-quantity">
                    <button aria-label="کاهش تعداد" disabled={loading} onClick={() => updateQuantity(item.lineId, Math.max(0, item.quantity - 1))}><Minus size={13} /></button>
                    <span>{item.quantity}</span>
                    <button aria-label="افزایش تعداد" disabled={loading} onClick={() => updateQuantity(item.lineId, item.quantity + 1)}><Plus size={13} /></button>
                    <button className="cart-remove" aria-label="حذف از سبد" disabled={loading} onClick={() => removeItem(item.lineId)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <SheetFooter className="cart-sheet-footer">
          <div className="cart-total"><span>تعداد انتخاب‌ها</span><b>{itemCount} آیتم</b></div>
          <button className="button button-wine cart-checkout" disabled={!cart?.items.length || loading} onClick={clearCart}>
            پاک‌کردن سبد نمایشی
          </button>
          <small>قیمت، موجودی و درگاه پرداخت در این مرحله صرفاً برای طراحی رابط در نظر گرفته شده‌اند.</small>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
