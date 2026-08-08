import { onMount, Match, Show, Switch } from "solid-js";
import { OverviewSchema, OverviewCardsSchema } from "~/lib/definition";
import { dashboardPath } from "~/lib/utility";
import { useDashboard } from "~/context/DashboardContext";
import { useResource } from "~/context/ResourceContext";
import OverviewCards from "~/components/overview.tsx/OverviewCards";

export default function Overview() {
  // get resource and dashboard schema context
  const { resource, setName } = useResource();
  const { schema, setMenuPath } = useDashboard();
  // update resource and dashboard schema using dashboard path
  const path = dashboardPath();
  onMount(() => {
    setName(path.name);
    setMenuPath([path.name, path.menu]);
  });

  // get component name from dashboard schema
  const component = () => {
    const s = schema() as OverviewSchema | undefined;
    return s?.name;
  };

  return (
    <Show when={resource() && schema()}>
      <div class="w-full h-0.5"></div>
      <Switch>
        <Match when={component() === "overview_cards"}>
          <OverviewCards resource={resource()!} overview={(schema() as OverviewCardsSchema)} />
        </Match>
      </Switch>
    </Show>
  );
}
