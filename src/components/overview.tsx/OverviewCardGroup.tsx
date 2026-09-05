import { Show, For, Suspense, createSignal, createResource, createEffect, createMemo } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { read_set, list_model_by_ids, list_data_set_by_range } from "bbthings_grpc/resource";
import { dateToString, rangeName } from "~/lib/utility";
import { OverviewCardGroupSchema } from "~/lib/definition";
import { useBbthings } from "~/context/BbthingsContext";
import LoadingData from "../miscellaneous/LoadingData";
import RefreshData from "../miscellaneous/RefreshData";

interface OverviewCardGroupProps {
  overview: OverviewCardGroupSchema;
};

export default function OverviewCardGroup(props: OverviewCardGroupProps) {
  const { resourceServer } = useBbthings();
  const config = props.overview.config;

  // construct resource input object using overview schema and bbthings context
  const input = createMemo(() => {
    return {
      overview: props.overview,
      server: resourceServer()
    };
  });

  // define time later setting signal
  const [searchParams, setSearchParams] = useSearchParams();
  const initTimeLater= typeof searchParams.later === "string" ? parseInt(searchParams.later) : config.live_range;
  let [timeLater, setTimeLater] = createSignal(initTimeLater);

  // get models from data set definition based on set id in overview schema
  const [model_config, {refetch: refetchConfig}] = createResource(input, async (input) => {
    try {
      const set = await read_set(input.server, { id: input.overview.sets[0].id });
      const model_ids = set.members.map(member => member.model_id);
      const models = await list_model_by_ids(input.server, { ids: model_ids });
      // get models configuration corresponding data set definition
      return set.members.flatMap((member) => {
        const model = models.find(model => model.id == member.model_id);
        if (model) {
          return model.configs.filter((_, index) => member.data_index.includes(index));
        }
        return [];
      });
    } catch (error) {
      console.error(error);
    }
    return [];
  });

  // get a group of data set schema based on set id in overview schema and time later setting
  const [datasetGroup, {refetch: refetchData}] = createResource(input, async (input) => {
    const tEnd = Date.now();
    const tBegin = tEnd - timeLater();
    try {
      const promises = input.overview.sets.map(async(set) => 
        list_data_set_by_range(input.server, {
          set_id: set.id,
          begin: new Date(tBegin),
          end: new Date(tEnd),
          tag: null
        }).catch(error => {
          console.error(error);
          return null;
        })
      );
      const results = await Promise.all(promises);
      return results.filter(data => data !== null);
    } catch (error) {
      console.error(error);
    }
    return [];
  });

  // create an object containing the latest data set and the model configurations for display on the cards
  function datasetLast() {
    const configs = model_config();
    const datasetGroups = datasetGroup();
    const sets = props.overview.sets;
    if (datasetGroups && configs && configs.length) {
      const dataLastGroup = [];
      for (const index in datasetGroups) {
        const datasets = datasetGroups[index];
        const dataset = datasets[datasets.length-1];
        const dataLast = [];
        for (const i in configs) {
          const scale = configs[i].filter((conf) => conf.name == "scale").reduce((_: any, conf) => conf).value;
          const symbol = configs[i].filter((conf) => conf.name == "symbol").reduce((_: any, conf) => conf).value;
          const precission = Array.isArray(config.float_precission)
            ? typeof config.float_precission[i] == "number" ? config.float_precission[i] : null
            : null;
          dataLast.push({
            data: dataset ? Number(dataset.data[i]) : null,
            scale: scale,
            symbol: symbol,
            precission: precission
          });
        }
        dataLastGroup.push({
          name: sets[index].name,
          timestamp: dataset ? dateToString(dataset.timestamp) : null,
          data: dataLast
        });
      }
      return dataLastGroup;
    }
  }

  let selectRange!: HTMLSelectElement;

  function submitMode(e: { preventDefault: () => void; }) {
    e.preventDefault();
    setSearchParams({
      later: selectRange.value
    });
    setTimeLater(parseInt(selectRange.value));
    refetchData();
  }

  const [rangeList, setRangeList] = createSignal([300000, 900000, 1800000, 3600000]);
  createEffect(() => {
    if (config.live_ranges.length) setRangeList(config.live_ranges);
    if (typeof searchParams.later === "string") selectRange.value = searchParams.later;
    else selectRange.value = String(config.live_range);
  });

  return (
    <Suspense fallback={
      <LoadingData schema={props.overview} />
    }>

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

      <Show when={datasetLast()} fallback={
        <RefreshData action={() => { refetchData(); refetchConfig(); }} message="Dataset definition not found" />
      }>

        <For each={datasetLast()}>
        {(items) => (
          <div class="w-full xs:px-1 py-1">
            <div class="w-full max-w-3xl xs:rounded-sm border border-slate-200 dark:border-slate-700">
              <div class="flex flex-row justify-center items-center mx-3 my-2 bg-gray-100 dark:bg-gray-800">
                <span class="align-middle text-md font-semibold">{items.name}&nbsp;</span>
              </div>
              <div class="flex flex-row flex-wrap px-2 sm:px-3 py-2 bg-white dark:bg-gray-900">
                <For each={items.data}>
                {(item) => (
                  <div class="flex-1 px-2 sm:px-3">
                    <div class="w-full text-center pt-1">
                      <span class="align-middle text-sm font-semibold text-sky-900 dark:text-sky-200">{String(item.scale)}&nbsp;</span>
                    </div>
                    <div class="flex flex-row justify-center py-1">
                      <span class="text-2xl/8 font-semibold">{item.data === null ? "--" : item.precission ? item.data.toFixed(item.precission) : String(item.data)}&nbsp;</span>
                      <span class="text-sm/8">&nbsp;{String(item.symbol)}</span>
                    </div>
                  </div>
                )}
                </For>
              </div>
              <div class="flex flex-row justify-center px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900">
                <span class="text-sm">{items.timestamp}&nbsp;</span>
              </div>
            </div>
          </div>
        )}
        </For>

      </Show>
    </Suspense>
  );
}
