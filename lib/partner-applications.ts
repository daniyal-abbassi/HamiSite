import crypto from "node:crypto";
import { PartnerApplicationStatus, PartnerEntityType, Role, type Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { ApiError } from "@/lib/http";
import { normalizeIranianMobile } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import type { AdminDecisionInput, AdminPartnerListQuery } from "@/lib/schemas/admin-partners";
import type {
  AdminDecisionResponse,
  AdminPartnerApplicationDetail,
  AdminPartnerApplicationSummary,
  AdminPartnerCounts,
  AdminPartnerListResponse,
} from "@/types/partner-applications";

export function serializeApplicationSummary(app: {
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
  leaseDocumentPath: string | null;
  businessLicensePath: string | null;
  registrationNoticePath: string | null;
  notes: string | null;
  reviewedBy: number | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AdminPartnerApplicationSummary {
  return {
    id: app.id,
    entityType: app.entityType,
    status: app.status,
    fullName: app.fullName,
    mobile: app.mobile,
    nationalCode: app.nationalCode,
    shopName: app.shopName,
    shopAddress: app.shopAddress,
    postalCode: app.postalCode,
    shopPhone: app.shopPhone,
    companyName: app.companyName,
    companyAddress: app.companyAddress,
    legalNationalId: app.legalNationalId,
    economicCode: app.economicCode,
    hasLeaseDocument: Boolean(app.leaseDocumentPath),
    hasBusinessLicense: Boolean(app.businessLicensePath),
    hasRegistrationNotice: Boolean(app.registrationNoticePath),
    notes: app.notes,
    reviewedBy: app.reviewedBy,
    reviewedAt: app.reviewedAt ? app.reviewedAt.toISOString() : null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export async function getPendingApplicationsCount(): Promise<number> {
  return prisma.partnerApplication.count({
    where: { status: PartnerApplicationStatus.PENDING },
  });
}

export async function listPartnerApplications(
  query: AdminPartnerListQuery
): Promise<AdminPartnerListResponse> {
  const where: Prisma.PartnerApplicationWhereInput = {};

  if (query.status !== "ALL") {
    where.status = query.status as PartnerApplicationStatus;
  }

  if (query.entityType !== "ALL") {
    where.entityType = query.entityType as PartnerEntityType;
  }

  if (query.search && query.search.trim().length > 0) {
    const s = query.search.trim();
    where.OR = [
      { fullName: { contains: s, mode: "insensitive" } },
      { mobile: { contains: s, mode: "insensitive" } },
      { nationalCode: { contains: s, mode: "insensitive" } },
      { shopName: { contains: s, mode: "insensitive" } },
      { companyName: { contains: s, mode: "insensitive" } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [items, total, pendingCount, approvedCount, rejectedCount, grandTotal] =
    await Promise.all([
      prisma.partnerApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.partnerApplication.count({ where }),
      prisma.partnerApplication.count({ where: { status: PartnerApplicationStatus.PENDING } }),
      prisma.partnerApplication.count({ where: { status: PartnerApplicationStatus.APPROVED } }),
      prisma.partnerApplication.count({ where: { status: PartnerApplicationStatus.REJECTED } }),
      prisma.partnerApplication.count(),
    ]);

  const counts: AdminPartnerCounts = {
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    total: grandTotal,
  };

  return {
    items: items.map(serializeApplicationSummary),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
    counts,
  };
}

export async function getPartnerApplicationDetail(
  id: number
): Promise<AdminPartnerApplicationDetail> {
  const app = await prisma.partnerApplication.findUnique({
    where: { id },
    include: {
      reviewedByRel: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!app) {
    throw ApiError.coded(404, "NOT_FOUND", "درخواست همکاری مورد نظر یافت نشد");
  }

  const summary = serializeApplicationSummary(app);

  return {
    ...summary,
    documents: {
      leaseDocument: app.leaseDocumentPath
        ? `/api/admin/partners/${app.id}/documents/leaseDocument`
        : null,
      businessLicense: app.businessLicensePath
        ? `/api/admin/partners/${app.id}/documents/businessLicense`
        : null,
      registrationNotice: app.registrationNoticePath
        ? `/api/admin/partners/${app.id}/documents/registrationNotice`
        : null,
    },
    ipAddress: app.ipAddress,
    userAgent: app.userAgent,
    reviewer: app.reviewedByRel,
  };
}

export async function executeApplicationDecision(
  id: number,
  input: AdminDecisionInput,
  reviewerAdminId: number
): Promise<AdminDecisionResponse> {
  return prisma.$transaction(async (tx) => {
    const app = await tx.partnerApplication.findUnique({
      where: { id },
    });

    if (!app) {
      throw ApiError.coded(404, "NOT_FOUND", "درخواست همکاری یافت نشد");
    }

    if (app.status !== PartnerApplicationStatus.PENDING) {
      throw ApiError.coded(
        409,
        "CONFLICT",
        `این درخواست قبلاً تعیین وضعیت شده است (${app.status === PartnerApplicationStatus.APPROVED ? "تأییدشده" : "ردشده"})`
      );
    }

    const reviewedAt = new Date();

    if (input.action === "REJECT") {
      const updated = await tx.partnerApplication.update({
        where: { id },
        data: {
          status: PartnerApplicationStatus.REJECTED,
          notes: input.note?.trim() ?? "رد شد",
          reviewedBy: reviewerAdminId,
          reviewedAt,
        },
      });

      return {
        id: updated.id,
        status: updated.status,
        reviewedAt: reviewedAt.toISOString(),
      };
    }

    // Action === APPROVE
    const updated = await tx.partnerApplication.update({
      where: { id },
      data: {
        status: PartnerApplicationStatus.APPROVED,
        notes: input.note?.trim() || null,
        reviewedBy: reviewerAdminId,
        reviewedAt,
      },
    });

    // Elevate user account to WHOLESALE
    const normalizedMobile = normalizeIranianMobile(app.mobile);
    const existingUser = await tx.user.findFirst({
      where: {
        OR: [
          { phoneNumber: app.mobile },
          { phoneNumber: normalizedMobile },
        ],
      },
    });

    let elevatedUserId: number;

    if (existingUser) {
      const updatedUser = await tx.user.update({
        where: { id: existingUser.id },
        data: {
          role: Role.WHOLESALE,
          shopName: app.shopName || existingUser.shopName,
          businessVerified: true,
          isActive: true,
        },
      });
      elevatedUserId = updatedUser.id;
    } else {
      const tempPass = crypto.randomUUID();
      const passwordHash = await hashPassword(tempPass);
      const cleanPhoneDigits = normalizedMobile.replace(/\D/g, "");
      const username = `partner_${cleanPhoneDigits || crypto.randomUUID().slice(0, 8)}`;
      const nameParts = app.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || app.fullName;
      const lastName = nameParts.slice(1).join(" ") || "";

      const newUser = await tx.user.create({
        data: {
          username,
          passwordHash,
          phoneNumber: normalizedMobile,
          phoneVerified: true,
          role: Role.WHOLESALE,
          firstName,
          lastName,
          nationalNumber: app.nationalCode,
          shopName: app.shopName,
          businessVerified: true,
          isActive: true,
        },
      });
      elevatedUserId = newUser.id;
    }

    return {
      id: updated.id,
      status: updated.status,
      reviewedAt: reviewedAt.toISOString(),
      userElevated: {
        userId: elevatedUserId,
        phoneNumber: normalizedMobile,
        role: Role.WHOLESALE,
        shopName: app.shopName,
      },
    };
  });
}

