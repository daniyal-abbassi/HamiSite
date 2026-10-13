import type { PartnerApplicationStatus, PartnerEntityType } from "@prisma/client";

export type { PartnerApplicationStatus, PartnerEntityType };

export interface AdminPartnerApplicationSummary {
  id: number;
  entityType: PartnerEntityType;
  status: PartnerApplicationStatus;
  fullName: string;
  mobile: string;
  nationalCode: string;
  shopName: string;
  shopAddress: string;
  postalCode: string | null;
  shopPhone: string | null;
  companyName: string | null;
  companyAddress: string | null;
  legalNationalId: string | null;
  economicCode: string | null;
  hasLeaseDocument: boolean;
  hasBusinessLicense: boolean;
  hasRegistrationNotice: boolean;
  notes: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPartnerApplicationDetail extends AdminPartnerApplicationSummary {
  documents: {
    leaseDocument: string | null;
    businessLicense: string | null;
    registrationNotice: string | null;
  };
  ipAddress: string | null;
  userAgent: string | null;
  reviewer: {
    id: number;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface AdminPartnerCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface AdminPartnerListResponse {
  items: AdminPartnerApplicationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: AdminPartnerCounts;
}

export interface AdminDecisionRequest {
  action: "APPROVE" | "REJECT";
  note?: string;
}

export interface AdminDecisionResponse {
  id: number;
  status: PartnerApplicationStatus;
  reviewedAt: string;
  userElevated?: {
    userId: number;
    phoneNumber: string | null;
    role: string;
    shopName: string | null;
  };
}

