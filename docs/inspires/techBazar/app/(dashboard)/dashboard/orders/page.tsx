import OrderActions from "@/components/dashboard/order/OrderActions";
import OrderSearch from "@/components/dashboard/order/OrderSearch";
import Loader from "@/components/others/Loader";
import Pagination from "@/components/others/Pagination";
import React, { Suspense } from "react";

const OrdersPage = () => {
  // dummy data for orders
  const orders = [
    {
      id: 1,
      orderNumber: "ORD123456",
      customerName: "John Doe",
      date: "2024-04-01",
      status: "Shipped",
    },
    {
      id: 2,
      orderNumber: "ORD123457",
      customerName: "Jane Smith",
      date: "2024-04-02",
      status: "Pending",
    },
    {
      id: 3,
      orderNumber: "ORD123458",
      customerName: "Alice Johnson",
      date: "2024-04-03",
      status: "Delivered",
    },
    {
      id: 4,
      orderNumber: "ORD123459",
      customerName: "Bob Williams",
      date: "2024-04-04",
      status: "Shipped",
    },
    {
      id: 5,
      orderNumber: "ORD123460",
      customerName: "Emily Brown",
      date: "2024-04-05",
      status: "Pending",
    },
  ];

  return (
    <div className="max-w-screen-xl mx-auto w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-4 ">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white ">
          Orders
        </h2>
        <OrderSearch />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full w-full divide-y divide-gray-200 dark:divide-gray-700 border dark:border-gray-500 rounded-md">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 ">
            {orders.map((order) => (
              <tr key={order.id} className="bg-white dark:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.customerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{order.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === "Shipped"
                        ? "bg-green-100 text-green-800"
                        : order.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <OrderActions />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* replace these data with your acctuall data */}
        <Suspense fallback={<Loader />}>
          <Pagination currentPage={1} pageName="orderpage" totalPages={10} />
        </Suspense>
      </div>
    </div>
  );
};

export default OrdersPage;
