"use client";

import React from "react";
import { ShieldAlert, XCircle } from "lucide-react";
import { toFaDigits } from "@/lib/utils";

interface AccessDeniedProps {
  userId?: number | string;
  username?: string;
  onClose?: () => void;
}

export function AccessDenied({ userId, username, onClose }: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center text-white">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 text-white shadow-lg">
          <XCircle className="w-4 h-4" />
        </div>
      </div>

      <h1 className="text-xl font-bold mb-3 text-stone-100">دسترسی محدود شده است</h1>

      <p className="text-stone-300 text-sm leading-relaxed max-w-xs mb-6">
        این بخش فقط ویژه مدیران مجاز فروشگاه حامی همراه است. شناسه تلگرام شما در لیست مدیران سیستم
        ثبت نشده است.
      </p>

      {userId && (
        <div className="w-full max-w-xs bg-stone-900/80 border border-stone-800 rounded-2xl p-4 mb-6 text-right">
          <div className="text-xs text-stone-400 mb-1">شناسه تلگرام شما:</div>
          <div className="font-mono text-base font-semibold text-amber-300 dir-ltr text-center">
            {toFaDigits(userId)}
          </div>
          {username && (
            <div className="text-xs text-stone-400 mt-2 text-center">@{username}</div>
          )}
        </div>
      )}

      <p className="text-xs text-stone-400 mb-8 max-w-xs">
        جهت فعال‌سازی دسترسی مدیریت، این شناسه را به مدیر کل فروشگاه اعلام فرمایید.
      </p>

      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="w-full max-w-xs py-3.5 px-4 bg-stone-800 hover:bg-stone-700 active:scale-[0.98] transition-all text-stone-200 text-sm font-medium rounded-xl border border-stone-700/60"
        >
          بستن مینی‌اپ
        </button>
      )}
    </div>
  );
}

