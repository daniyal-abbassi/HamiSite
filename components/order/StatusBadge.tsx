import { CircleCheck, CircleX, Clock3, CreditCard, Pencil, Truck } from "lucide-react";
import { Badge, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/content/order";

const orderAppearance = {
  PENDING: { tone: "warning", Icon: Clock3 },
  PROCESSING: { tone: "info", Icon: Clock3 },
  SHIPPING: { tone: "info", Icon: Truck },
  COMPLETED: { tone: "success", Icon: CircleCheck },
  CANCELED: { tone: "danger", Icon: CircleX },
  FAILED: { tone: "danger", Icon: CircleX },
  REVERSED: { tone: "danger", Icon: CircleX },
} satisfies Record<string, { tone: BadgeTone; Icon: typeof Clock3 }>;

const paymentAppearance = {
  INITIATED: { tone: "neutral", Icon: CreditCard },
  SENT: { tone: "warning", Icon: Clock3 },
  COMPLETED: { tone: "success", Icon: CircleCheck },
  FAILED: { tone: "danger", Icon: CircleX },
  REVERSED: { tone: "danger", Icon: CircleX },
  EDITED: { tone: "neutral", Icon: Pencil },
} satisfies Record<string, { tone: BadgeTone; Icon: typeof Clock3 }>;

type StatusBadgeProps = { status: string; size?: BadgeSize };

export function OrderStatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const appearance = orderAppearance[status as keyof typeof orderAppearance];
  const Icon = appearance?.Icon ?? Clock3;

  return (
    <Badge tone={appearance?.tone ?? "neutral"} size={size} icon={<Icon aria-hidden="true" />}>
      {orderStatusLabels[status] ?? status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const appearance = paymentAppearance[status as keyof typeof paymentAppearance];
  const Icon = appearance?.Icon ?? CreditCard;

  return (
    <Badge tone={appearance?.tone ?? "neutral"} size={size} icon={<Icon aria-hidden="true" />}>
      {paymentStatusLabels[status] ?? status}
    </Badge>
  );
}
