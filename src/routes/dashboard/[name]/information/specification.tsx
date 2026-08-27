import { onMount, Show } from "solid-js";
import { InformationSchema, InformationSpecificationSchema } from "~/lib/definition";
import { dashboardPath, breadcrumbInformation } from "~/lib/utility";
import { useDashboard } from "~/context/DashboardContext";
import SpecificationTable from "~/components/information/SpecificationTable";
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

  // get object from dashboard schema
  const table = () => {
    const s = schema() as InformationSchema;
    if (!s) return [];
    const children = s.children as InformationSpecificationSchema[];
    return Array.isArray(children) ? children.find((item) => item.name == "specification")?.table : [];
  };
  // transform dashboard schema to breadcrumb schema
  const breadcrumb = () => breadcrumbInformation(schema() as InformationSchema);

  return(
    <Show when={table()}>
      <Show when={breadcrumb()}>
        <Breadcrumb dashboard={path.name} schema={breadcrumb()!} />
      </Show>
      <SpecificationTable table={table()!} />
    </Show>
  );
}
