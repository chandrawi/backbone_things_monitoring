import { useSearchParams } from "@solidjs/router";
import { createEffect, createMemo, createResource, createSignal, For, Show, Suspense } from "solid-js";
import { list_data_set_by_range, list_model_by_ids, read_set } from "bbthings_grpc/resource";
import { dashboardPath, dateToString, rangeName, exportToCsv } from "~/lib/utility";
import { DataLogSchema, DatasetLogViewSchema } from "~/lib/definition";
import { useBbthings } from "~/context/BbthingsContext";
import { DataTable, TableColumns, TableRowData } from "~/components/table/DataTable";
import TimeChart from "../charts/TimeChart";
import LoadingData from "../miscellaneous/LoadingData";
import RefreshData from "../miscellaneous/RefreshData";

interface DatasetLogViewProps {
  data_log: DataLogSchema;
};

export default function DataSetLogView(props: DatasetLogViewProps) {
  const { resourceServer } = useBbthings();

  // take a data_log child schema matched with submenu path or first child for single mode
  const data_log = createMemo(() => {
    const dp = dashboardPath();
    if (Array.isArray(props.data_log.children)) {
      const c = props.data_log.children.find((item) => item.name == dp.submenu);
      if (!c && props.data_log.children.length) {
        return props.data_log.children[0] as DatasetLogViewSchema;
      }
      return c as DatasetLogViewSchema;
    };
  });
  const config = () => data_log()?.config;
  // construct resource input object using data_log schema, dashboard path, and bbthings context
  const input = createMemo(() => {
    const dp = dashboardPath();
    const dl = data_log();
    if (dl) {
      if (!dp.item && dl?.sets.length) {
        dp.item = dl.sets[0].name;
      }
      return {
        data_log: dl,
        path: dp,
        server: resourceServer()
      };
    }
  });
  const setMeta = () => data_log()?.sets.find((item) => item.name == input()?.path.item);

  const [searchParams, setSearchParams] = useSearchParams();
  const initViewMode = searchParams.view ? searchParams.view : config()?.view_mode;
  const initTimeMode = searchParams.time ? searchParams.time : config()?.time_mode;
  const initTimeLater= typeof searchParams.later === "string" 
    ? parseInt(searchParams.later) 
    :  (config() ? config()!.live_range : 300);
  const initTimeBegin = typeof searchParams.begin === "string" && new Date(searchParams.begin) < new Date() 
    ? new Date(searchParams.begin) 
    : new Date(Date.now() - initTimeLater);
  const initTimeEnd = typeof searchParams.end === "string" && new Date(searchParams.end) < new Date() 
    ? new Date(searchParams.end) 
    : new Date();

  let [viewMode, setViewMode] = createSignal(initViewMode);
  let [timeMode, setTimeMode] = createSignal(initTimeMode);
  let [timeLater, setTimeLater] = createSignal(initTimeLater);
  let [timeBegin, setTimeBegin] = createSignal(initTimeBegin);
  let [timeEnd, setTimeEnd] = createSignal(initTimeEnd);

  // get models from data set definition based on set id in overview schema
  const [model_config, {refetch: refetchConfig}] = createResource(input, async (input) => {
    try {
      const set_id = input.data_log.sets?.find((item) => item.name == input.path.item)?.id;
      const set = await read_set(input.server, { id: set_id ? set_id : "" });
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
  });

  // get data schema based on device id in data_log schema and time mode setting
  const [data, {refetch: refetchData} ] = createResource(input, async (input) => {
    const set_id = input.data_log.sets.find((item) => item.name == input.path.item)?.id;
    try {
      if (timeMode() == "live") {
        const tLater = new Date(Date.now() - timeLater());
        return await list_data_set_by_range(input.server, {
          set_id: set_id ? set_id : "",
          begin: tLater,
          end: new Date(Date.now()),
          tag: null
        });
      }
      else if (timeMode() == "history") {
        return await list_data_set_by_range(input.server, {
          set_id: set_id ? set_id : "",
          begin: timeBegin(),
          end: timeEnd(),
          tag: null
        });
      }
    } catch (error) {
      console.error(error);
    }
    return [];
  });

  // create an object to be used as the table header
  function columns(): TableColumns | undefined {
    if (data_log() && model_config()) {
      const configs = model_config()!;
      const indexes = [...Array(configs.length).keys()];
      const cols: TableColumns = {
        timestamp: { content: "Timestamp", sortable: true, align: "left" }
      };
      for (const index in configs) {
        const i = parseInt(index);
        if (indexes.includes(i)) {
          const scale = configs[i].filter((conf) => conf.name == "scale").reduce((_, conf) => conf).value;
          const symbol = configs[i].filter((conf) => conf.name == "symbol").reduce((_, conf) => conf).value;
          const pre = config()?.float_precission;
          cols[String(scale)] = {
            content: scale + " [" + symbol + "]",
            sortable: true,
            float_precission: pre ? pre[i] : undefined
          }
        }
      }
      return cols;
    }
  }
  // create an object to be used as the table rows
  function dataTable(): TableRowData[] | undefined {
    if (data_log() && model_config() && data()) {
      const configs = model_config()!;
      const indexes = [...Array(configs.length).keys()];
      const dataTable: TableRowData[] = [];
      for (const dataschema of data()!) {
        const dataRow: TableRowData = {
          timestamp: dateToString(dataschema.timestamp)
        };
        for (const i in dataschema.data) {
          if (indexes.includes(parseInt(i))) {
            const scale = configs[i].filter((conf) => conf.name == "scale").reduce((_, conf) => conf).value;
            let value = dataschema.data[i];
            dataRow[String(scale)] = value;
          }
        }
        dataTable.push(dataRow);
      }
      return dataTable;
    }
  }

  // create a chart metadata array
  function itemCharts() {
    if (data_log() && model_config()) {
      const configs = model_config()!;
      const indexes = [...Array(configs.length).keys()];
      const items = [];
      for (const index in configs) {
        const i = parseInt(index);
        const indexOfIndexes = indexes.findIndex((index) => index == i);
        if (indexes.includes(i)) {
          const scale = configs[i].filter((conf) => conf.name == "scale").reduce((_, conf) => conf).value;
          const symbol = configs[i].filter((conf) => conf.name == "symbol").reduce((_, conf) => conf).value;
          const cvr = config()?.chart_value_range;
          items.push({
            scale: String(scale),
            content: scale + " [" + symbol + "]",
            range: cvr ? cvr[indexOfIndexes] : undefined
          })
        }
      }
      return items;
    }
    return [];
  }

  // create charts data
  function dataCharts(index: number) {
    if (data_log() && model_config() && data()) {
      const configs = model_config()!;
      const indexes = [...Array(configs.length).keys()];
      const dataCharts: [number, number][] = [];
      for (const dataschema of data()!) {
        const i = indexes[index];
        if (i < dataschema.data.length) {
          const timestamp = dataschema.timestamp.valueOf();
          const value = dataschema.data[i];
          dataCharts.push([timestamp, Number(value)]);
        }
      }
      return dataCharts;
    }
  }

  let selectTimeMode! : HTMLSelectElement;
  let selectRange! : HTMLSelectElement;
  let datetimeBegin! : HTMLInputElement;
  let datetimeEnd! : HTMLInputElement;

  function submitTimeMode(e: { preventDefault: () => void; }) {
    e.preventDefault();
    if (selectTimeMode.value == "live") {
      setSearchParams({
        time: "live",
        later: selectRange.value,
        begin: null,
        end: null
      });
      setTimeLater(parseInt(selectRange.value));
      refetchData();
    }
    else if (selectTimeMode.value == "history") {
      setSearchParams({
        time: "history",
        later: null,
        begin: datetimeBegin.value,
        end: datetimeEnd.value
      });
      if (datetimeBegin.value && datetimeEnd.value) {
        if (new Date(datetimeBegin.value) < new Date()) setTimeBegin(new Date(datetimeBegin.value));
        if (new Date(datetimeEnd.value) < new Date()) setTimeEnd(new Date(datetimeEnd.value));
      }
      refetchData();
    }
  }

  function changeViewMode(mode: string) {
    setViewMode(mode);
    setSearchParams({
      view: mode
    });
  }

  createEffect(() => {
    if (typeof searchParams.time == "string") selectTimeMode.value = searchParams.time;
    if (typeof searchParams.later == "string") selectRange.value = searchParams.later;
    if (typeof searchParams.begin == "string") datetimeBegin.value = searchParams.begin;
    if (typeof searchParams.end == "string") datetimeEnd.value = searchParams.end;
  });

  const [rangeList, setRangeList] = createSignal([300000, 900000, 1800000, 3600000]);
  createEffect(() => {
    if (Array.isArray(config()?.live_ranges)) setRangeList(config()!.live_ranges);
    if (config()?.live_range) selectRange.value = typeof searchParams.later == "string" ? searchParams.later : String(config()!.live_range);
  });

  return (
    <Suspense fallback={
      <LoadingData schema={data_log()} />
    }>

      <div class="w-full xs:px-1 py-1">
        <div class="w-full max-w-3xl xs:rounded-sm border border-slate-200 dark:border-slate-700">
          <div class="w-full flex flex-row items-center justify-between bg-gray-100 dark:bg-gray-800">
            <div class="mx-2 my-1.5 flex flex-row items-center font-semibold">
              <span class={(data_log()?.icon ? data_log()?.icon : "icon-list_square") + " text-[1.5rem] align-middle"}></span>
              <span class="ml-1 align-middle">{data_log()?.text}&nbsp;</span>
            </div>
            <div class="mx-3 my-auto flex flex-row text-sm">
              <button class={"px-2 py-0.5 text-gray-100 rounded-l-sm " 
                + (viewMode() == 'graph' ? "bg-sky-700 cursor-default" : "bg-slate-500 hover:bg-sky-800 hover:text-white")}
                onclick={() => changeViewMode("graph")}
              >
                Graph
              </button>
              <button class={"px-2 py-0.5 text-gray-100 rounded-r-sm " 
                + (viewMode() == 'table' ? "bg-sky-700 cursor-default" : "bg-slate-500 hover:bg-sky-800 hover:text-white")}
                onclick={() => changeViewMode("table")}
              >
                Table
              </button>
            </div>
          </div>
          <div class="w-full bg-white dark:bg-gray-900 text-sm">
            <form action="#" class="px-2 py-2 flex flex-row flex-wrap" onsubmit={submitTimeMode}>
              <div class="mx-1 my-1 flex flex-row">
                <label for="input-mode" class="px-1.5 py-0.5 rounded-l-sm bg-sky-100 dark:bg-sky-950">Mode</label>
                <select name="time-mode" class="px-1 bg-white border border-sky-100 dark:bg-slate-800 dark:border-sky-950"
                  ref={selectTimeMode} onChange={() => setTimeMode(selectTimeMode.value)}
                >
                  <option value="live" selected={timeMode() == "live"}>Live</option>
                  <option value="history" selected={timeMode() == "history"}>History</option>
                </select>
              </div>
              <div class="grow"></div>
              <div class="flex flex-row flex-wrap justify-between">
                <div class="mx-1 my-1 flex flex-row" classList={{"hidden": timeMode() != "live"}}>
                  <label for="input-later" class="px-1.5 py-0.5 rounded-l-sm bg-slate-200 dark:bg-slate-700">Range</label>
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
                <div class="mx-1 my-1 flex flex-row" classList={{"hidden": timeMode() != "history"}}>
                  <label for="input-begin" class="min-w-12 px-1.5 py-0.5 rounded-l-sm bg-slate-200 dark:bg-slate-700">Begin</label>
                  <input type="datetime-local" step="1" name="time-begin" class="w-48 px-1 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700" 
                    ref={datetimeBegin}
                    value={dateToString(timeBegin())}
                  />
                </div>
                <div class="mx-1 my-1 flex flex-row" classList={{"hidden": timeMode() != "history"}}>
                  <label for="input-end" class="min-w-12 px-1.5 py-0.5 rounded-l-sm bg-slate-200 dark:bg-slate-700">End</label>
                  <input type="datetime-local" step="1" name="time-end" class="w-48 px-1 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700" 
                    ref={datetimeEnd}
                    value={dateToString(timeEnd())}
                  />
                </div>
                <div class="grow mx-1 my-1 flex flex-row justify-end">
                  <button class="px-2 py-0.5 bg-sky-700 text-gray-100 hover:bg-sky-800 rounded-sm hover:text-white">Set</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Show when={model_config()} fallback={
        <RefreshData action={() => { refetchData(); refetchConfig(); }} message="Dataset definition not found" />
      }>

        <Show when={viewMode() == "graph"}>
          <div class="w-full flex flex-row flex-wrap">
            <For each={itemCharts()}>
            {(item, i) => (
              <div class="w-full xl:w-1/2 xs:px-1 py-1 max-w-xl">
                <div class="xs:rounded-sm border border-slate-200 dark:border-slate-700">
                  <div class="flex flex-row items-center bg-gray-100 dark:bg-gray-800">
                    <div class="mx-3 my-1.5 flex flex-row items-center font-medium">
                      <span class="align-middle text-sm">{setMeta()?.name}&nbsp;</span>
                      <span class="icon-chevron_right align-middle text-[0.875rem]"></span>
                      <span class="align-middle text-sm">&nbsp;{item.content}</span>
                    </div>
                  </div>
                  <div class="p-3 bg-white dark:bg-gray-900">
                  <div class="aspect-video">
                      <Show when={dataCharts(i()) && dataCharts(i())!.length !== 0} fallback={
                        <div style={{ width: "100%",  height: "100%" }}></div>
                      }>
                        <TimeChart data={dataCharts(i())!} range={item.range} />
                      </Show>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </For>
          </div>
        </Show>

        <Show when={viewMode() == "table"}>
          <div class="w-full xs:px-1 py-1 overflow-hidden">
            <div class="w-full max-w-3xl xs:rounded-sm border border-slate-200 dark:border-slate-700">
              <div class="flex flex-row items-center bg-gray-100 dark:bg-gray-800">
                <div class="mx-3 my-1.5 flex flex-row items-center font-medium">
                  <span class="align-middle text-sm leading-6">{setMeta()?.name}&nbsp;</span>
                </div>
              </div>
              <div class="w-full xs:px-4 py-2 bg-white dark:bg-gray-900 text-sm overflow-x-auto scrollbar-custom scrollbar-gutter-auto">
                <Show when={columns() && dataTable()}>
                  <DataTable columns={columns()!} data={dataTable()!} />
                </Show>
              </div>
              <div class="flex flex-row items-center justify-center bg-gray-100 dark:bg-gray-800">
                <Show when={setMeta() && dataTable()}>
                  <button 
                    class="my-1.5 px-2 py-0.5 bg-sky-700 text-gray-100 hover:bg-sky-800 rounded-sm hover:text-white cursor-pointer" 
                    onclick={() => exportToCsv(setMeta()!.name, dataTable()!)}
                  >
                    <span class="icon-download text-sm align-middle mr-1"></span>
                    <span class="text-sm">Download</span>
                  </button>
                </Show>
              </div>
            </div>
          </div>
        </Show>

      </Show>
    </Suspense>
  );
}
