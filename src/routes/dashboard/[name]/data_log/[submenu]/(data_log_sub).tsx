import { Match, onMount, Show, Switch } from "solid-js";
import { DataLogSchema } from "~/lib/definition";
import { dashboardPath, breadcrumbDataLog } from "~/lib/utility";
import { useDashboard } from "~/context/DashboardContext";
import Breadcrumb from "~/components/navigation/Breadcrumb";
import DataLogList from "~/components/data_log/DataLogList";
import DataLogView from "~/components/data_log/DataLogView";
import DataSetLogView from "~/components/data_log/DatasetLogView";

export default function DataLogSub() {
  // update dashboard schema using dashboard path
  const { schema, menuPath, setMenuPath } = useDashboard();
  const path = dashboardPath();
  onMount(() => {
    const p = menuPath();
    if (p[0] != path.name || p[1] != path.menu) {
      setMenuPath([path.name, path.menu]);
    }
  });

  const mode = () => (schema() as DataLogSchema).mode;
  const component = () => {
    const s = schema() as DataLogSchema;
    if (Array.isArray(s?.children)) {
      const c = s?.children[0];
      if ("devices" in c) return "devices";
      if ("sets" in c) return "sets";
    }
  };
  // transform dashboard schema to breadcrumb schema
  const breadcrumb = () => breadcrumbDataLog(schema() as DataLogSchema);

  return (
    <Show when={schema()}>
      <Show when={breadcrumb()}>
        <Breadcrumb mode={mode()} dashboard={path.name} schema={breadcrumb()!} />
      </Show>
      <Show when={mode() == "single"} fallback={
        <DataLogList mode={mode()} data_log={schema()! as DataLogSchema} />
      }>
        <Show when={component()}>
          <Switch>
            <Match when={component() == "devices"}>
              <DataLogView data_log={schema()! as DataLogSchema} />
            </Match>
            <Match when={component() == "sets"}>
              <DataSetLogView data_log={schema()! as DataLogSchema} />
            </Match>
          </Switch>
        </Show>
      </Show>
    </Show>
  );
}
