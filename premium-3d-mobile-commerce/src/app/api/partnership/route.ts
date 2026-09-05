import { db } from "@/db";
import { partnershipRequests } from "@/db/schema";

export const dynamic = "force-dynamic";

const REQUIRED = ["businessName", "contactName", "phone", "city", "businessType", "monthlyVolume"] as const;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "درخواست نامعتبر است" }, { status: 400 });
  }
  const data: Record<string, string> = {};
  for (const k of REQUIRED) {
    const v = typeof body[k] === "string" ? (body[k] as string).trim() : "";
    if (!v) return Response.json({ error: "لطفاً همه فیلدهای الزامی را تکمیل کنید" }, { status: 400 });
    data[k] = v.slice(0, 200);
  }
  const phone = data.phone.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/\D/g, "");
  if (phone.length < 10) return Response.json({ error: "شماره تماس معتبر نیست" }, { status: 400 });

  try {
    const [row] = await db
      .insert(partnershipRequests)
      .values({
        businessName: data.businessName,
        contactName: data.contactName,
        phone,
        city: data.city,
        businessType: data.businessType,
        monthlyVolume: data.monthlyVolume,
        message: typeof body.message === "string" ? body.message.slice(0, 2000) : "",
      })
      .returning({ id: partnershipRequests.id });
    return Response.json({ ok: true, id: row.id });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "ثبت درخواست ناموفق بود، دوباره تلاش کنید" }, { status: 500 });
  }
}
