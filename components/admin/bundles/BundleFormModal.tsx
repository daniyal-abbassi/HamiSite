"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Trash2,
  X,
  Search,
  PackageCheck,
  Upload,
  LoaderCircle,
  Check,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Layers,
  FileCheck2,
  ListOrdered,
  Sparkles,
  Palette,
  Eye,
} from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { toPersianDigits } from "@/lib/serializers";
import type { PartnerBundleDTO } from "@/types/bundles";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ProductVariantOption {
  id: number;
  color: string | null;
  storage: string | null;
  price: number;
  stock: number;
}

interface ProductOption {
  id: number;
  name: string;
  englishName?: string | null;
  price: number;
  stock: number;
  variants?: ProductVariantOption[];
}

interface FormItem {
  uid: string;
  productId: number;
  productName: string;
  productEnglishName?: string | null;
  variantId?: number | null;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  availableVariants?: ProductVariantOption[];
}

interface BundleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialBundle?: PartnerBundleDTO | null;
}

type WizardStep = 1 | 2 | 3;

function generateItemUid(productId: number, variantId?: number | null): string {
  return `${productId}_${variantId ?? "default"}_${Math.random().toString(36).slice(2, 9)}`;
}

export function BundleFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialBundle,
}: BundleFormModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<WizardStep>(1);

  useFocusTrap(modalRef, {
    enabled: isOpen,
    onEscape: onClose,
  });

  // General fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [items, setItems] = useState<FormItem[]>([]);

  // Product search state
  const [productsList, setProductsList] = useState<ProductOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step transition timestamp to prevent accidental double-click submittals
  const stepEnteredAtRef = useRef<number>(Date.now());

  useEffect(() => {
    stepEnteredAtRef.current = Date.now();
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    if (initialBundle) {
      setTitle(initialBundle.title);
      setDescription(initialBundle.description || "");
      setPrice(initialBundle.price);
      setCompareAtPrice(initialBundle.compareAtPrice || "");
      setStock(initialBundle.stock);
      setIsActive(initialBundle.isActive);
      setImageUrl(initialBundle.imageUrl || "");
      setItems(
        initialBundle.items.map((i) => ({
          uid: generateItemUid(i.productId, i.variantId),
          productId: i.productId,
          productName: i.productName,
          productEnglishName: i.productEnglishName || null,
          variantId: i.variantId || null,
          variantName: i.variantName || null,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          availableVariants: [],
        }))
      );
    } else {
      setTitle("");
      setDescription("");
      setPrice("");
      setCompareAtPrice("");
      setStock(10);
      setIsActive(true);
      setImageUrl("");
      setItems([]);
    }
    setErrorMessage(null);
    setUploadError(null);
  }, [isOpen, initialBundle]);

  // Fetch product catalog including variant options
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    setLoadingProducts(true);

    apiGet<ProductOption[] | { data: ProductOption[] }>(
      `/api/admin/products?pageSize=100&includeVariants=true${
        searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ""
      }`
    )
      .then((res) => {
        if (!isCancelled && res) {
          const list = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
          setProductsList(list);
        }
      })
      .catch((err) => console.error("Error loading products:", err))
      .finally(() => {
        if (!isCancelled) setLoadingProducts(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, searchTerm]);

  // Attach availableVariants to loaded items when productsList arrives
  useEffect(() => {
    if (productsList.length === 0) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.availableVariants && item.availableVariants.length > 0) return item;
        const matchedProd = productsList.find((p) => p.id === item.productId);
        if (matchedProd?.variants && matchedProd.variants.length > 0) {
          return {
            ...item,
            availableVariants: matchedProd.variants,
          };
        }
        return item;
      })
    );
  }, [productsList]);

  if (!isOpen) return null;

  // 1- کالا رو انتخاب میکنم (با تیک)
  const handleToggleProduct = (prod: ProductOption) => {
    const existing = items.filter((i) => i.productId === prod.id);
    if (existing.length > 0) {
      setItems((prev) => prev.filter((i) => i.productId !== prod.id));
    } else {
      setItems((prev) => [
        ...prev,
        {
          uid: generateItemUid(prod.id, null),
          productId: prod.id,
          productName: prod.name,
          productEnglishName: prod.englishName || null,
          variantId: null,
          variantName: null,
          unitPrice: prod.price,
          quantity: 1,
          availableVariants: prod.variants || [],
        },
      ]);
    }
  };

  // افزودن رنگ/واریانت دیگر از همان محصول
  const handleAddAnotherVariant = (productId: number) => {
    const prod = productsList.find((p) => p.id === productId);
    const existingForProduct = items.filter((i) => i.productId === productId);
    const available = prod?.variants || existingForProduct[0]?.availableVariants || [];

    // یافتن اولین واریانتی که هنوز در اقلام این محصول نیست
    const unusedVariant = available.find(
      (v) => !items.some((i) => i.productId === productId && i.variantId === v.id)
    );

    const baseItem = existingForProduct[0];
    const newVariantId = unusedVariant ? unusedVariant.id : null;
    const newVariantName = unusedVariant
      ? [unusedVariant.color, unusedVariant.storage].filter(Boolean).join(" - ") || null
      : null;
    const newPrice =
      unusedVariant && unusedVariant.price > 0
        ? unusedVariant.price
        : baseItem?.unitPrice || prod?.price || 0;

    setItems((prev) => [
      ...prev,
      {
        uid: generateItemUid(productId, newVariantId),
        productId,
        productName: baseItem?.productName || prod?.name || "",
        productEnglishName: baseItem?.productEnglishName || prod?.englishName || null,
        variantId: newVariantId,
        variantName: newVariantName,
        unitPrice: newPrice,
        quantity: 1,
        availableVariants: available,
      },
    ]);
  };

  const handleRemoveItem = (uid: string) => {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  };

  // تغییر تعداد
  const handleQuantityChange = (uid: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, quantity: qty } : i))
    );
  };

  // تغییر قیمت کالا
  const handleUnitPriceChange = (uid: string, newPrice: number) => {
    if (newPrice < 0) return;
    setItems((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, unitPrice: newPrice } : i))
    );
  };

  // تغییر رنگ / واریانت کالا (اختیاری)
  const handleVariantChange = (uid: string, variantIdVal: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.uid !== uid) return i;
        if (!variantIdVal || variantIdVal === "none") {
          return {
            ...i,
            variantId: null,
            variantName: null,
          };
        }
        const numId = Number(variantIdVal);
        const matched = i.availableVariants?.find((v) => v.id === numId);
        const vName = matched
          ? [matched.color, matched.storage].filter(Boolean).join(" - ") || `واریانت ${matched.id}`
          : null;
        const newUnitPrice = matched && matched.price > 0 ? matched.price : i.unitPrice;
        return {
          ...i,
          variantId: numId,
          variantName: vName,
          unitPrice: newUnitPrice,
        };
      })
    );
  };

  // جابجایی ترتیب اقلام (مرحله ۲)
  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  // محاسبه جمع بهای اقلام
  const aggregateSum = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // بارگذاری تصویر سبد
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entity", "bundle");
      if (initialBundle?.id) {
        formData.append("id", String(initialBundle.id));
      }

      const res = await fetch("/api/admin/catalog-images", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.message || "خطا در آپلود تصویر");
      }

      if (data.data?.url) {
        setImageUrl(data.data.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در آپلود تصویر";
      setUploadError(msg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // رفتن به مرحله بعد با اعتبارسنجی
  const handleNextStep = () => {
    setErrorMessage(null);
    if (step === 1) {
      if (items.length === 0) {
        setErrorMessage("حداقل یک کالا باید برای سبد انتخاب شود.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // در ورود به مرحله ۳، مقادیر اولیه هوشمند در صورت خالی بودن تنظیم می‌شوند
      if (!title.trim()) {
        const firstTwo = items
          .slice(0, 2)
          .map((i) => i.productEnglishName || i.productName)
          .join(" + ");
        setTitle(`سبد ${firstTwo}`);
      }
      if (price === "") {
        setPrice(Math.round(aggregateSum * 0.9));
      }
      if (compareAtPrice === "") {
        setCompareAtPrice(aggregateSum);
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as WizardStep);
    }
  };

  // ثبت و انتشار نهایی سبد
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // Prevent accidental triggers if step 3 was entered less than 400ms ago (e.g. double click bounce)
    if (Date.now() - stepEnteredAtRef.current < 400) {
      return;
    }

    if (!title.trim()) {
      setErrorMessage("نام سبد الزامی است");
      return;
    }
    if (price === "" || Number(price) < 0) {
      setErrorMessage("قیمت ویژه سبد باید مشخص شود");
      return;
    }
    if (stock === "" || Number(stock) < 0) {
      setErrorMessage("تعداد سهمیه موجودی سبد باید مشخص شود");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("حداقل یک قلم کالا باید برای سبد انتخاب شود");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        price: Number(price),
        compareAtPrice: compareAtPrice !== "" ? Number(compareAtPrice) : aggregateSum,
        stock: Number(stock),
        isActive,
        imageUrl: imageUrl.trim() || null,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId ?? null,
          quantity: i.quantity,
        })),
      };

      if (initialBundle) {
        await apiPatch(`/api/admin/bundles/${initialBundle.id}`, payload);
      } else {
        await apiPost(`/api/admin/bundles`, payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در ثبت سبد همکار";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bundle-modal-title"
        className="relative w-full max-w-3xl rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 p-6 shadow-2xl my-8 outline-none"
      >
        {/* Header with Title and Close */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <PackageCheck className="text-amber-400" size={24} aria-hidden="true" />
            <div>
              <h2 id="bundle-modal-title" className="text-base font-bold">
                {initialBundle ? "ویرایش سبد همکار" : "ایجاد سبد جدید همکار"}
              </h2>
              <p className="text-[11px] text-zinc-400">
                فرآیند ۳ مرحله‌ای: انتخاب اقلام، تنظیم ترتیب نمایش، و خلاصه و انتشار سبد
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Wizard Steps Navigation Bar */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-zinc-950/80 rounded-xl border border-zinc-800 mb-5 text-xs">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              step === 1
                ? "bg-amber-500 text-zinc-950 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers size={14} />
            <span>۱. انتخاب کالا، رنگ و قیمت</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (items.length > 0) setStep(2);
            }}
            disabled={items.length === 0}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              step === 2
                ? "bg-amber-500 text-zinc-950 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ListOrdered size={14} />
            <span>۲. ترتیب نمایش اقلام</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (items.length > 0) {
                if (!title.trim()) {
                  const firstTwo = items
                    .slice(0, 2)
                    .map((i) => i.productEnglishName || i.productName)
                    .join(" + ");
                  setTitle(`سبد ${firstTwo}`);
                }
                if (price === "") setPrice(Math.round(aggregateSum * 0.9));
                if (compareAtPrice === "") setCompareAtPrice(aggregateSum);
                setStep(3);
              }
            }}
            disabled={items.length === 0}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              step === 3
                ? "bg-amber-500 text-zinc-950 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileCheck2 size={14} />
            <span>۳. خلاصه، مشخصات و انتشار</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-200">
            {errorMessage}
          </div>
        )}

        {/* Prevent implicit form submission on Enter */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 3) {
              void handleSubmit(e);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
              e.preventDefault();
            }
          }}
        >
          {/* ============================================================ */}
          {/* مرحله ۱: انتخاب کالاها، تعداد، رنگ اختیاری و قیمت‌ها */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="space-y-4">
              {/* خلاصه قیمت و تعداد بالای لیست */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200">
                    اقلام انتخاب‌شده برای این سبد ({toPersianDigits(items.length)} قلم)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    قیمت واحد، تعداد و رنگ (اختیاری) هر قلم را می‌توانید مستقیماً تعیین کنید.
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs text-zinc-400">جمع بهای اقلام: </span>
                  <span className="text-sm font-bold text-amber-400">
                    {toPersianDigits(aggregateSum.toLocaleString())} تومان
                  </span>
                </div>
              </div>

              {/* لیست اقلام انتخاب شده با قابلیت ویرایش تعداد، قیمت و رنگ */}
              {items.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500">
                  هنوز کالایی تیک نخورده است. از لیست کالاهای زیر تیک بزنید تا به سبد افزوده شود.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const lineTotal = item.unitPrice * item.quantity;
                    const hasVariants = Boolean(
                      item.availableVariants && item.availableVariants.length > 0
                    );

                    return (
                      <div
                        key={item.uid}
                        className="flex flex-col gap-2.5 rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* نام کالا و نشان رنگ انتخابی */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-zinc-100 font-mono text-[13px]" dir="ltr">
                                {item.productEnglishName || item.productName}
                              </p>
                              {item.variantName && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                  رنگ: {item.variantName}
                                </span>
                              )}
                            </div>
                            {item.productEnglishName && (
                              <p className="text-zinc-500 text-[11px] truncate mt-0.5" dir="rtl">
                                {item.productName}
                              </p>
                            )}
                          </div>

                          {/* فیلدهای قیمت، تعداد و حذف */}
                          <div className="flex flex-wrap items-center gap-2.5">
                            {/* ویرایش قیمت واحد */}
                            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1">
                              <span className="text-zinc-400 text-[11px]">قیمت کالا:</span>
                              <input
                                type="number"
                                min={0}
                                step={1000}
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleUnitPriceChange(item.uid, Number(e.target.value) || 0)
                                }
                                className="w-24 text-center bg-transparent text-amber-300 font-bold focus:outline-hidden"
                                title="تعیین قیمت واحد این کالا در سبد"
                              />
                              <span className="text-zinc-500 text-[10px]">ت</span>
                            </div>

                            {/* ویرایش تعداد */}
                            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1">
                              <span className="text-zinc-400 text-[11px]">تعداد:</span>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(item.uid, parseInt(e.target.value, 10) || 1)
                                }
                                className="w-12 text-center bg-transparent text-zinc-100 font-bold focus:outline-hidden"
                              />
                            </div>

                            {/* جمع سطر */}
                            <div className="min-w-[80px] text-left text-[11px] text-zinc-300 font-medium">
                              {toPersianDigits(lineTotal.toLocaleString())} ت
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.uid)}
                              className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="حذف از سبد"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* انتخاب رنگ (اختیاری) */}
                        {hasVariants && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
                            <div className="flex items-center gap-2">
                              <Palette size={14} className="text-amber-400 shrink-0" />
                              <span className="text-[11px] text-zinc-400">
                                انتخاب رنگ (اختیاری):
                              </span>
                              <select
                                value={item.variantId ? String(item.variantId) : "none"}
                                onChange={(e) => handleVariantChange(item.uid, e.target.value)}
                                className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-200 focus:border-amber-400 focus:outline-hidden cursor-pointer"
                              >
                                <option value="none">بدون انتخاب رنگ خاص (اختیاری / تمام رنگ‌ها)</option>
                                {item.availableVariants!.map((v) => {
                                  const label =
                                    [v.color, v.storage].filter(Boolean).join(" - ") ||
                                    `واریانت ${v.id}`;
                                  const isSelectedInOtherRow = items.some(
                                    (other) =>
                                      other.uid !== item.uid &&
                                      other.productId === item.productId &&
                                      other.variantId === v.id
                                  );
                                  return (
                                    <option
                                      key={v.id}
                                      value={String(v.id)}
                                      disabled={isSelectedInOtherRow}
                                    >
                                      {label}{" "}
                                      {isSelectedInOtherRow
                                        ? "(قبلاً انتخاب شده)"
                                        : v.stock > 0
                                        ? `(موجودی: ${toPersianDigits(v.stock)})`
                                        : "(ناموجود)"}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {/* دکمه افزودن رنگ دیگر برای این کالا */}
                            {item.availableVariants!.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleAddAnotherVariant(item.productId)}
                                className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <span>+ افزودن رنگ دیگر از این کالا</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* نوار جست‌وجو و لیست کالاهای انگلیسی با چک‌باکس */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">
                    فهرست کالاها (انتخاب با تیک زدن)
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {loadingProducts
                      ? "در حال جست‌وجو..."
                      : `${toPersianDigits(productsList.length)} کالا`}
                  </span>
                </div>

                <div className="relative">
                  <Search size={16} className="absolute right-3.5 top-3 text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="جست‌وجوی نام کالا (انگلیسی یا فارسی)..."
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pr-10 pl-3.5 py-2 text-xs focus:border-amber-400 focus:outline-hidden"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-1.5 space-y-1">
                  {loadingProducts ? (
                    <p className="text-xs text-zinc-500 p-4 text-center">
                      در حال بارگذاری لیست کالاها...
                    </p>
                  ) : productsList.length === 0 ? (
                    <p className="text-xs text-zinc-500 p-4 text-center">کالایی با این نام یافت نشد</p>
                  ) : (
                    productsList.map((prod) => {
                      const isChecked = items.some((i) => i.productId === prod.id);
                      const displayName = prod.englishName?.trim() || prod.name;
                      const hasVariants = Boolean(prod.variants && prod.variants.length > 0);

                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleToggleProduct(prod)}
                          className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-xs transition-colors select-none ${
                            isChecked
                              ? "bg-amber-500/15 border border-amber-500/30 text-amber-200"
                              : "hover:bg-zinc-900 border border-transparent text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-1">
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                isChecked
                                  ? "bg-amber-500 border-amber-500 text-zinc-950"
                                  : "border-zinc-700 bg-zinc-900"
                              }`}
                            >
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className="font-mono text-zinc-100 font-semibold truncate text-[13px]"
                                  dir="ltr"
                                >
                                  {displayName}
                                </p>
                                {hasVariants && (
                                  <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                                    {toPersianDigits(prod.variants!.length)} رنگ/تنوع
                                  </span>
                                )}
                              </div>
                              {prod.englishName && (
                                <p className="text-[11px] text-zinc-500 truncate mt-0.5" dir="rtl">
                                  {prod.name}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 pl-1">
                            <span className="text-zinc-400 text-[11px]">
                              {toPersianDigits(prod.price.toLocaleString())} تومان
                            </span>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                                isChecked
                                  ? "bg-amber-500/30 text-amber-300"
                                  : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              {isChecked ? "انتخاب‌شده" : "تیک زدن"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* مرحله ۲: تعیین ترتیب نمایش کالاها در سبد */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-200">
                  ترتیب نمایش اقلام در صفحه سبد همکار
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1">
                  کالایی که در بالای لیست قرار می‌گیرد به عنوان کالای شاخص سبد نشان داده خواهد شد. با
                  دکمه‌های بالا/پایین ترتیب را جابه‌جا کنید.
                </p>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={item.uid}
                    className="flex items-center justify-between gap-3 rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 font-bold text-[11px] shrink-0">
                        {toPersianDigits(index + 1)}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className="font-mono text-zinc-100 font-bold truncate text-[13px]"
                            dir="ltr"
                          >
                            {item.productEnglishName || item.productName}
                          </p>
                          {item.variantName && (
                            <span className="text-amber-300 font-medium bg-amber-500/15 px-1.5 py-0.5 rounded text-[10px]">
                              رنگ: {item.variantName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-zinc-400 text-[11px]">
                          <span>تعداد: {toPersianDigits(item.quantity)} عدد</span>
                          <span>•</span>
                          <span>فی: {toPersianDigits(item.unitPrice.toLocaleString())} ت</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveItem(index, "up")}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="انتقال به بالا"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => handleMoveItem(index, "down")}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="انتقال به پایین"
                      >
                        <ArrowDown size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* مرحله ۳: خلاصه سبد، اطلاعات تکمیلی و تایید/انتشار */}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="space-y-5">
              {/* خلاصه مالی و اقلام سبد */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[11px]">تعداد اقلام:</span>
                  <span className="font-bold text-zinc-200">
                    {toPersianDigits(items.length)} ردیف (
                    {toPersianDigits(items.reduce((s, i) => s + i.quantity, 0))} عدد)
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">مجموع بهای تک‌تک اقلام:</span>
                  <span className="font-bold text-zinc-200">
                    {toPersianDigits(aggregateSum.toLocaleString())} تومان
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">سود تخمینی همکار:</span>
                  <span className="font-bold text-emerald-400">
                    {price !== "" && Number(price) < aggregateSum
                      ? `${toPersianDigits((aggregateSum - Number(price)).toLocaleString())} ت (${toPersianDigits(
                          Math.round(((aggregateSum - Number(price)) / aggregateSum) * 100)
                        )}٪)`
                      : "بدون تخفیف"}
                  </span>
                </div>
              </div>

              {/* پیش‌نمایش اقلام موجود در سبد برای تایید نهایی */}
              <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Eye size={13} className="text-amber-400" />
                    <span>اقلام تنظیم‌شده در سبد:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-amber-400 hover:underline cursor-pointer"
                  >
                    ویرایش اقلام یا رنگ‌ها
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs">
                  {items.map((it, idx) => (
                    <div
                      key={it.uid}
                      className="flex items-center justify-between py-1 px-2 rounded-lg bg-zinc-900/60 text-zinc-300"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] text-zinc-500">{toPersianDigits(idx + 1)}.</span>
                        <span className="font-mono text-[12px] truncate" dir="ltr">
                          {it.productEnglishName || it.productName}
                        </span>
                        {it.variantName && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            رنگ: {it.variantName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[11px]">
                        <span className="text-zinc-400">
                          {toPersianDigits(it.quantity)} عدد × {toPersianDigits(it.unitPrice.toLocaleString())} ت
                        </span>
                        <span className="font-bold text-zinc-200">
                          {toPersianDigits((it.unitPrice * it.quantity).toLocaleString())} ت
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* مشخصات اصلی سبد */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    نام سبد <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثلاً: سبد ویژه لوازم جانبی"
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    تعداد موجودی (سهمیه سبد) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="مثلاً: ۱۰"
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    قیمت نهایی بسته برای همکار (تومان) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="مثلاً: ۲۵۰۰۰۰۰"
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-hidden font-bold text-amber-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-zinc-400">
                      قیمت قبل از تخفیف (تومان - اختیاری)
                    </label>
                    {aggregateSum > 0 && (
                      <button
                        type="button"
                        onClick={() => setCompareAtPrice(aggregateSum)}
                        className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                      >
                        تنظیم روی جمع اقلام ({toPersianDigits(aggregateSum.toLocaleString())})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={compareAtPrice}
                    onChange={(e) =>
                      setCompareAtPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder={`پیش‌فرض مجموع کالاها: ${
                      aggregateSum > 0 ? toPersianDigits(aggregateSum.toLocaleString()) : "۰"
                    }`}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* تصویر و بارگذاری */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-400">
                  تصویر یا بنر سبد (اختیاری)
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="آدرس تصویر (https://... یا /api/catalog-images/...)"
                    className="flex-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-xs focus:border-amber-400 focus:outline-hidden"
                  />

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <>
                          <LoaderCircle size={15} className="animate-spin text-amber-400" />
                          <span>در حال بارگذاری...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={15} className="text-amber-400" />
                          <span>بارگذاری فایل تصویر</span>
                        </>
                      )}
                    </button>

                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="p-2 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="حذف تصویر"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {uploadError && <p className="text-[11px] text-red-400 mt-1">{uploadError}</p>}

                {imageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                      <Image
                        src={imageUrl}
                        alt="پیش‌نمایش تصویر سبد"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate flex-1">
                      پیش‌نمایش تصویر بارگذاری‌شده
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  توضیحات و شرایط سبد
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات کوتاه برای همکاران..."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bundleActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded-sm border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="bundleActive"
                  className="text-sm font-medium text-zinc-300 cursor-pointer"
                >
                  سبد فعال و بلافاصله برای همکاران منتشر و قابل خرید باشد
                </label>
              </div>
            </div>
          )}

          {/* دکمه‌های ناوبری مراحل و ثبت نهایی */}
          <div className="flex items-center justify-between pt-5 mt-5 border-t border-zinc-800">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <ArrowRight size={15} />
                  <span>مرحله قبل</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2 text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>{step === 1 ? "مرحله بعد: تنظیم ترتیب" : "مرحله بعد: بررسی و انتشار"}</span>
                  <ArrowLeft size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-2.5 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <Sparkles size={15} />
                  <span>
                    {submitting
                      ? "در حال ثبت و انتشار..."
                      : initialBundle
                      ? "ذخیره تغییرات سبد"
                      : "تایید و انتشار سبد همکار"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
