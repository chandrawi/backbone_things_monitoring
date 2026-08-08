interface RefreshDataProps {
  message: string;
  action: () => void;
};

export default function RefreshData(props: RefreshDataProps) {
  return (
    <div class="w-full xs:px-1 py-1">
      <div class="w-full max-w-3xl xs:rounded-sm border border-slate-200 dark:border-slate-700">
        <div class="flex flex-row bg-gray-100 dark:bg-gray-800">
          <div class="mx-2 my-1.5 flex flex-row items-center">
            <span class="icon-cross text-[1.5rem] text-red-600"></span>
            <span class="ml-1 align-middle">{props.message}</span>
          </div>
        </div>
        <div class="w-full bg-white dark:bg-gray-900 text-sm">
          <div class="flex items-center justify-center py-3">
            <button 
              onClick={props.action}
              class="flex items-center px-2 py-1 bg-sky-700 hover:bg-sky-800 rounded-sm cursor-pointer"
            >
              <span class="icon-refresh text-xl text-gray-100 hover:text-white mr-1.5"></span>
              <span class="text-base text-gray-100 hover:text-white">Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
