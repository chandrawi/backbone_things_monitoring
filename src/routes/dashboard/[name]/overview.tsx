import { onMount, Match, Show, Switch } from "solid-js";
import { OverviewSchema, OverviewCardsSchema } from "~/lib/definition";
import { dashboardPath } from "~/lib/utility";
import { useBbthings } from "~/context/BbthingsContext";
import { useDashboard } from "~/context/DashboardContext";
import OverviewCards from "~/components/overview.tsx/OverviewCards";

export default function Overview() {
  // update resource server object on bbthings context and dashboard schema using dashboard path
  const { setResourceName } = useBbthings();
  const { schema, setMenuPath } = useDashboard();
  const path = dashboardPath();
  onMount(() => {
    setResourceName(path.name);
    setMenuPath([path.name, path.menu]);
  });

  // get component name from dashboard schema
  const component = () => {
    const s = schema() as OverviewSchema | undefined;
    return s?.name;
  };

  return (
    <Show when={schema()}>
      <div class="w-full h-0.5"></div>
      <Switch>
        <Match when={component() === "overview_cards"}>
          <OverviewCards overview={(schema() as OverviewCardsSchema)} />
        </Match>
      </Switch>
    </Show>
  );
}
