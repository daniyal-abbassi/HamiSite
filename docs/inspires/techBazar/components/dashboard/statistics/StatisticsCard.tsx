interface StatisticsCardProps {
  title: string;
  value: string;
  icon: any;
  color?: string;
  iconColor: string;
}

const StatisticsCard = ({
  title,
  value,
  icon: Icon,
  iconColor,
  color,
}: StatisticsCardProps) => {
  return (
    <div
      className={`bg-${
        color || "white"
      } dark:bg-gray-900 w-full rounded-lg p-4 shadow-md flex items-center justify-center lg:justify-between mb-4`}
    >
      <div
        className={`flex items-center ${
          color
            ? `text-${color}-800 dark:text-${color}-200`
            : "text-gray-800 dark:text-gray-200"
        }`}
      >
        <div className={`${iconColor} p-4 rounded-full`}>
          <Icon size={25} />
        </div>
        <div className="ml-4">
          <p className="text-xl font-bold">{value}</p>
          <p className="text-lg font-semibold">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default StatisticsCard;
