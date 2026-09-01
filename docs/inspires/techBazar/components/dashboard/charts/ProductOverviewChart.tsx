"use client";
import React from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const ProductOverviewChart = () => {
  // Sample data for the charts
  const productData = [
    { name: "Electronics", Sales: 3000 },
    { name: "Clothing", Sales: 5000 },
    { name: "Home Appliances", Sales: 4000 },
    { name: "Books", Sales: 2000 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Product Overview
      </h2>

      {/* Product Sales Distribution Chart */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Product Sales Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Sales" fill="#34D399" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Selling Products Chart */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Top Selling Products
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={productData}>
            <Area
              type="monotone"
              dataKey="Sales"
              stroke="#3182CE"
              fill="#3182CE"
            />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProductOverviewChart;
