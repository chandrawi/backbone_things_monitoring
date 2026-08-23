import { onMount, onCleanup, createEffect } from "solid-js";
import { darkTheme } from "~/lib/store";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import type { LineSeriesOption } from "echarts/charts";
import type { GridComponentOption, TooltipComponentOption } from "echarts/components";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
]);

type ECOption = ComposeOption<LineSeriesOption | GridComponentOption | TooltipComponentOption>;

export type LineChartPoint = [
  timestamp: number,
  value: number,
];

interface Props {
  data: LineChartPoint[];
  range?: number[];
}

const TARGET_TICKS = 8;
const TIME_INTERVALS = [
  1 * 60_000,
  2 * 60_000,
  5 * 60_000,
  10 * 60_000,
  30 * 60_000,
  1 * 60 * 60_000,
  3 * 60 * 60_000,
  6 * 60 * 60_000,
  12 * 60 * 60_000,
  1 * 24 * 60 * 60_000,
  2 * 24 * 60 * 60_000,
  7 * 24 * 60 * 60_000,
];

function getTimeInterval(data: LineChartPoint[]): number {
  let min = Infinity;
  let max = 0;
  for (const d of data) {
    if (d[0] < min) min = d[0];
    if (d[0] > max) max = d[0];
  }
  const range = max - min > 60_000 ? max - min : 60_000;

  let bestInterval = TIME_INTERVALS[0];
  let bestDifference = Infinity;
  for (const interval of TIME_INTERVALS) {
    const ticks = range / interval;
    const difference = Math.abs(ticks - TARGET_TICKS);
    if (difference < bestDifference) {
      bestDifference = difference;
      bestInterval = interval;
    }
  }
  return bestInterval;
}

function getDomainRange(data: LineChartPoint[], range: (number | undefined)[]) {
  const step = range[0];
  let min = range[1];
  let max = range[2];
  for (const d of data) {
    if (min === undefined || d[1] < min) min = d[1];
    if (max === undefined || d[1] > max) max = d[1];
  }
  if (step && min && max) {
    min = Math.floor(min / step) * step;
    max = Math.ceil(max / step) * step;
  }
  return [min, max];
};

export default function TimeChart(props: Props) {
  let container!: HTMLDivElement;
  let chart: echarts.ECharts | undefined;
  const resizeObserver = new ResizeObserver(() => {
    if (chart) {
      chart.resize();
    }
  });

  onMount(() => {
    chart = echarts.init(container);
    resizeObserver.observe(container);

    onCleanup(() => {
      resizeObserver.disconnect();
      chart?.dispose();
      chart = undefined;
    });
  });

  createEffect(() => {
    const data = props.data;
    if (!chart) return;

    const xInterval = getTimeInterval(data) + 1;
    const [min, max] = getDomainRange(data, props.range ? props.range : []);

    const dark = darkTheme();
    const colorLabel = dark ? "#d1d5dc" : "#364153";
    const colorLine = dark ? "#cad5e2" : "#314158";
    const colorSplit = dark ? "#45556c" : "#90a1b9";

    const option: ECOption = {
      animation: false,
      grid: {
        top: 20,
        right: 15,
        bottom: 30,
        left: 50,
      },
      tooltip: {
        trigger: "axis",
      },
      xAxis: {
        type: "time",
        minInterval: xInterval,
        splitNumber: TARGET_TICKS,
        axisLine: {
          lineStyle: {
            width: 1,
            color: colorLine,
          },
        },
        axisLabel: {
          color: colorLabel
        },
      },
      yAxis: {
        type: "value",
        min: min,
        max: max,
        axisTick: {
          show: true,
        },
        axisLine: {
          show: true,
          lineStyle: {
            width: 1,
            color: colorLine,
          },
        },
        axisLabel: {
          color: colorLabel
        },
        splitLine: {
          show: true,
          lineStyle: {
            width: 0.5,
            color: colorSplit,
          },
        }
      },
      series: [
        {
          type: "line",
          data: data,
          showSymbol: false,
        },
      ],
    };

    chart.setOption(option);
  });

  return (
    <div
      ref={container}
      style={{ width: "100%",  height: "100%" }}
    />
  );
}
