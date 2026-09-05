import { onMount, Match, Show, Switch } from "solid-js";
import { OverviewSchema, OverviewCardsSchema, OverviewCardGroupSchema } from "~/lib/definition";
import { dashboardPath } from "~/lib/utility";
import { useDashboard } from "~/context/DashboardContext";
import OverviewCards from "~/components/overview.tsx/OverviewCards";
import OverviewCardGroup from "~/components/overview.tsx/OverviewCardGroup";

export default function Overview() {
  // update dashboard schema using dashboard path
  const { schema, setMenuPath } = useDashboard();
  const path = dashboardPath();
  onMount(() => {
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
        <Match when={component() === "overview_card_group"}>
          <OverviewCardGroup overview={(schema() as OverviewCardGroupSchema)} />
        </Match>
      </Switch>
    </Show>
  );
}
