interface LoadingDataProps {
  schema?: {
    text: string;
    icon: string;
  };
};

export default function LoadingData(props: LoadingDataProps) {
  return (
    <div class="w-full xs:px-1 py-1">
      <div class="w-full max-w-3xl xs:rounded-sm border border-slate-200 dark:border-slate-700">
        <div class="flex flex-row items-center justify-between bg-gray-100 dark:bg-gray-800">
          <div class="mx-2 my-1.5 flex flex-row items-center font-semibold">
            <span class={(props.schema ? props.schema?.icon : "icon-list_square") + " text-[1.5rem] align-middle"}></span>
            <span class="ml-1 align-middle">{props.schema?.text}&nbsp;</span>
          </div>
        </div>
        <div class="flex py-3 bg-white dark:bg-gray-900 justify-center">
          <div class="flex items-center animate-spin">
            <span class="icon-refresh text-2xl leading-1"></span>
          </div>
          <div class="flex items-center ml-1">
            <span class="text-base">Loading</span>
          </div>
        </div>
      </div>
    </div>
  );
}
