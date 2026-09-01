import HomePageChart from "@/components/dashboard/charts/HomePageChart";
import ProductOverviewChart from "@/components/dashboard/charts/ProductOverviewChart";
import RecentOrdersSection from "@/components/dashboard/order/RecentOrders";
import StatisticsCard from "@/components/dashboard/statistics/StatisticsCard";
import { Activity, DollarSign, ShoppingBag, Users } from "lucide-react";
import React from "react";

const DashboardPageOne = () => {
  return (
    <section className="max-w-screen-xl mx-auto py-4">
      <div className="grid gap-2 lg:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard
          iconColor="bg-rose-500"
          title="Revenue"
          value="$10,000"
          icon={DollarSign}
        />
        <StatisticsCard
          iconColor="bg-lime-500"
          title="Sales"
          value="$1,000"
          icon={ShoppingBag}
        />

        <StatisticsCard
          iconColor="bg-rose-500"
          title="Orders"
          value="$4,000"
          icon={Activity}
        />
        <StatisticsCard
          iconColor="bg-violet-500"
          title="Customers"
          value="500"
          icon={Users}
        />
      </div>
      <HomePageChart />
      <RecentOrdersSection />
      <ProductOverviewChart />
    </section>
  );
};

export default DashboardPageOne;
