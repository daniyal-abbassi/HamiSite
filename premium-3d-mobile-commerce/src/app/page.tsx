import HomeExperience from "@/components/HomeExperience";
import { getCatalog } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getCatalog();
  return <HomeExperience data={data} />;
}
