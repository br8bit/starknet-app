import { Address } from "~~/components/scaffold-stark";

interface EventItemProps {
  event: any;
  index: number;
}

export const EventItem = ({ event, index }: EventItemProps) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-semibold text-gray-800 dark:text-white flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            Counter Changed
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
              {event.parsedArgs?.old_value?.toString() || "0"}
            </span>
            <span className="mx-2">→</span>
            <span className="font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
              {event.parsedArgs?.new_value?.toString() || "0"}
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
          <div className="mb-1">
            <Address 
              address={event.parsedArgs?.caller ? `${event.parsedArgs.caller.toString(16)}` : ""} 
              size="xs" 
              disableAddressLink
            />
          </div>
          <div className="badge badge-outline badge-sm">
            Block: {event.log?.block_number}
          </div>
        </div>
      </div>
    </div>
  );
};