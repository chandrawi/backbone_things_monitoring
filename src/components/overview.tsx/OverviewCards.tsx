import { Show, For, createSignal, createResource, createEffect, createMemo } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { read_set, list_model_by_ids, list_data_set_by_range } from "bbthings_grpc/resource";
import { resourceServer } from "~/lib/store";
import { dateToString, rangeName } from "~/lib/utility";
import { ResourceSchema, OverviewCardsSchema } from "~/lib/definition";

interface OverviewCardsProps {
  resource: ResourceSchema;
  overview: OverviewCardsSchema;
};

export default function OverviewCards(props: OverviewCardsProps) {

  const config = props.overview.config;
  const api_id = props.resource.api_id;

  // construct resource input object using overview schema
  const input = createMemo(() => {
    return { overview: props.overview };
  });

  // define time later setting signal
  const [searchParams, setSearchParams] = useSearchParams();
  const initTimeLater= typeof searchParams.later === "string" ? parseInt(searchParams.later) : config.live_range;
  let [timeLater, setTimeLater] = createSignal(initTimeLater);

  // get data set definition based on set id in overview schema
  const [set] = createResource(input, async (input) => {
    return await read_set(resourceServer.get(api_id)!, { id: input.overview.set.id })
      .catch((error) => {
        console.error(error);
        return null;
      });
  });
  // get models corresponding data set definition
  const [models] = createResource(set, async (set) => {
    const model_ids = set.members.map(member => member.model_id);
    return await list_model_by_ids(resourceServer.get(api_id)!, { ids: model_ids })
      .catch((error) => {
        console.error(error);
        return null;
      });
  });
  // get models configuration corresponding data set definition
  const [model_config] = createResource(models, async (models) => {
    return set()!.members.flatMap((member) => {
      const model = models.find(model => model.id == member.model_id);
      if (model) {
        return model.configs.filter((_, index) => member.data_index.includes(index));
      }
      return [];
    });
  });

  // get data set schema based on set id in overview schema and time later setting
  const [dataset, {refetch}] = createResource(props.overview, async (overview) => {
    const tEnd = Date.now();
    const tBegin = tEnd - timeLater();
    return await list_data_set_by_range(resourceServer.get(api_id)!, {
      set_id: overview.set.id,
      begin: new Date(tBegin),
      end: new Date(tEnd),
      tag: null
    })
    .catch((error) => {
      console.error(error);
      return [];
    });
  });

  function datasetLast() {
    const configs = model_config();
    const datasets = dataset();
    if (datasets && configs) {
      const dataset = datasets[datasets.length-1];
      const dataLast = [];
      for (const i in configs) {
        const scale = configs[i].filter((conf) => conf.name == "scale").reduce((_: any, conf) => conf).value;
        const symbol = configs[i].filter((conf) => conf.name == "symbol").reduce((_: any, conf) => conf).value;
        const precission = Array.isArray(config.float_precission)
          ? typeof config.float_precission[i] == "number" ? config.float_precission[i] : null
          : null;
        dataLast.push({
          timestamp: dataset ? dateToString(dataset.timestamp) : null,
          data: dataset ? Number(dataset.data[i]) : null,
          scale: scale,
          symbol: symbol,
          precission: precission
        });
      }
      return dataLast;
    }
  }

  let selectRange!: HTMLSelectElement;

  function submitMode(e: { preventDefault: () => void; }) {
    e.preventDefault();
    setSearchParams({
      later: selectRange.value
    });
    setTimeLater(parseInt(selectRange.value));
    refetch();
  }

  const [rangeList, setRangeList] = createSignal([300000, 900000, 1800000, 3600000]);
  createEffect(() => {
    if (config.live_ranges.length) setRangeList(config.live_ranges);
    if (typeof searchParams.later === "string") selectRange.value = searchParams.later;
    else selectRange.value = String(config.live_range);
  });

  return (
    <>
      <div class="w-full xs:px-1 py-1">
        <div class="w-full max-w-3xl xs:rounded-sm border border-slate-200 dark:border-slate-700">
          <div class="w-full flex flex-row items-center justify-between bg-gray-100 dark:bg-gray-800">
            <div class="mx-2 my-1.5 flex flex-row items-center font-semibold">
              <span class={(props.overview.icon ? props.overview.icon : "icon-list_square") + " text-[1.5rem] align-middle"}></span>
              <span class="ml-1 align-middle">{props.overview.text}&nbsp;</span>
            </div>
          </div>
          <div class="w-full bg-white dark:bg-gray-900 text-sm">
            <form action="#" class="px-2 py-2 flex flex-row flex-wrap" onsubmit={submitMode}>
              <div class="w-full flex flex-row flex-wrap justify-between">
                <div class="mx-1 my-1 flex flex-row">
                  <label for="input-later" class="px-1.5 py-0.5 rounded-l-sm bg-sky-100 dark:bg-sky-950">Range</label>
                  <select name="time-later" class="px-1 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                    ref={selectRange}
                  >
                    <For each={rangeList()}>
                    {(item) => (
                      <option value={item} selected={timeLater() == item}>{rangeName(item)}</option>
                    )}
                    </For>
                  </select>
                </div>
                <div class="grow mx-1 my-1 flex flex-row justify-end">
                  <button class="px-2 py-0.5 bg-sky-700 text-gray-100 hover:bg-sky-800 rounded-sm hover:text-white">Check</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="w-full flex flex-row flex-wrap">
        <Show when={datasetLast()} fallback={
          <div class="w-full min-w-40 max-w-3xl xs:px-1 py-1">
            <div class="xs:rounded-sm border border-slate-200 dark:border-slate-700">
              <div class="flex flex-row justify-center pt-5 pb-4 bg-gray-100 dark:bg-gray-800">
                <span class="icon-cross text-[1.75rem] text-red-600 mr-2"></span>
                <span class="text-lg font-medium">Dataset definition not found</span>
              </div>
            </div>
          </div>
        }>
          <For each={datasetLast()}>
          {(item) => (
            <div class="w-full min-w-40 max-w-[18rem] xs:px-1 py-1">
              <div class="xs:rounded-sm border border-slate-200 dark:border-slate-700">
                <div class="flex flex-row justify-center items-center bg-gray-100 dark:bg-gray-800">
                  <div class="mx-3 my-2 flex flex-row items-center font-medium">
                    <span class="align-middle text-md font-semibold text-sky-900 dark:text-sky-200">{String(item.scale)}&nbsp;</span>
                  </div>
                </div>
                <div class="flex flex-row justify-center pt-5 pb-4 bg-white dark:bg-gray-900">
                  <span class="text-2xl/8 font-semibold">{item.data === null ? "--" : item.precission ? item.data.toFixed(item.precission) : String(item.data)}&nbsp;</span>
                  <span class="text-sm/8">&nbsp;{String(item.symbol)}</span>
                </div>
                <div class="flex flex-row justify-center py-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900">
                  <span class="text-sm">{item.timestamp}&nbsp;</span>
                </div>
              </div>
            </div>
          )}
          </For>
        </Show>
      </div>
    </>
  );
}
