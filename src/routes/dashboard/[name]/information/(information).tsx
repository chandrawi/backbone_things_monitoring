import { onMount, Match, Show, Switch } from "solid-js";
import { InformationSchema } from "~/lib/definition";
import { dashboardPath, breadcrumbInformation } from "~/lib/utility";
import { useDashboard } from "~/context/DashboardContext";
import DescriptionDefault from "~/components/information/DescriptionDefault";
import Breadcrumb from "~/components/navigation/Breadcrumb";

export default function Information() {
  // update dashboard schema using dashboard path
  const { schema, menuPath, setMenuPath } = useDashboard();
  const path = dashboardPath();
  onMount(() => {
    const p = menuPath();
    if (p[0] != path.name || p[1] != path.menu) {
      setMenuPath([path.name, path.menu]);
    }
  });

  // get component name from dashboard schema
  const component = () => {
    const s = schema() as InformationSchema;
    if (!s) return [];
    return Array.isArray(s.children) ? s.children.find((item) => item.name == "description")?.component : "";
  };
  // transform dashboard schema to breadcrumb schema
  const breadcrumb = () => breadcrumbInformation(schema() as InformationSchema);

  return(
    <Show when={component()}>
      <Show when={breadcrumb()}>
        <Breadcrumb dashboard={path.name} schema={breadcrumb()!} />
      </Show>
      <Switch>
        <Match when={component() == "description_default"}>
          <DescriptionDefault />
        </Match>
      </Switch>
    </Show>
  );
}
