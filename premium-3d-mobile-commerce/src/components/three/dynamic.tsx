"use client";

import dynamic from "next/dynamic";

const Loading = () => <div className="absolute inset-0 animate-pulse bg-white/[0.02]" />;

export const JourneyCanvas = dynamic(() => import("./JourneyCanvas"), { ssr: false });
export const DealsBanner = dynamic(() => import("./banners").then((m) => m.DealsBanner3D), { ssr: false, loading: Loading });
export const StoreBanner = dynamic(() => import("./banners").then((m) => m.StoreBanner3D), { ssr: false, loading: Loading });
export const PartnerBanner = dynamic(() => import("./banners").then((m) => m.PartnerBanner3D), { ssr: false, loading: Loading });
export const ChargeBanner = dynamic(() => import("./banners").then((m) => m.ChargeBanner3D), { ssr: false, loading: Loading });
export const AudioBanner = dynamic(() => import("./banners").then((m) => m.AudioBanner3D), { ssr: false, loading: Loading });
export const CameraBanner = dynamic(() => import("./banners").then((m) => m.CameraBanner3D), { ssr: false, loading: Loading });
