import { Show, For } from "solid-js";
import { dashboardPath } from "~/lib/utility";
import { DashboardMenu } from "~/lib/definition";

interface PageMenuProps {
  menu: DashboardMenu;
  submenus: DashboardMenu[];
};

export default function PageMenu(props: PageMenuProps) {

  const isActive = () => dashboardPath().menu === props.menu.name;
  const isActiveSub = (name: string) => dashboardPath().submenu === name || dashboardPath().item === name;

  const setLink = (link: string, menu: string, submenu: string | null = null) => {
    if (link != "") return "/dashboard/" + dashboardPath().name + link;
    return "/dashboard/" + [dashboardPath().name, menu, submenu].join("/");
  };

  return (
    <div class="my-2 flex flex-col">
      <div class={"w-full h-10 flex before:h-full before:w-2 " + (isActive()
        ? "bg-slate-100 before:bg-sky-800 hover:bg-sky-50 text-black hover:text-sky-800 dark:bg-slate-700 dark:before:bg-sky-600 dark:hover:bg-gray-700 dark:text-slate-50 dark:hover:text-sky-300"
        : "bg-slate-50 before:bg-slate-200 hover:bg-sky-50 hover:text-sky-800 dark:bg-slate-800 dark:before:bg-slate-700 dark:hover:bg-gray-800 dark:hover:text-sky-300"
      )}>
        <a href={setLink(props.menu.link, props.menu.name)} class="w-full h-full pl-3 flex items-center">
          <div class="h-full flex items-center grow">
            <span class={ props.menu.icon + " text-[1.5rem]" }></span>
            <span class="font-medium mx-2">{props.menu.text}</span>
          </div>
          <Show when={props.submenus.length}>
            <span class={"icon-chevron_right text-[1rem] mr-3" + (isActive() ? " rotate-90 transition-transform" : "" )}></span>
          </Show>
        </a>
      </div>
      <div class={"ml-2 bg-slate-50 dark:bg-slate-800 font-medium transition-opacity duration-200 " + (isActive() ? "opacity-100" : "opacity-0")}>
        <For each={props.submenus}>
        {(item) => (
          <Show when={isActive()}>
            <div class={"w-full h-9 flex before:h-full before:w-1.5 " + (isActiveSub(item.name) 
              ? "bg-slate-100 hover:bg-sky-50 before:bg-sky-700 text-black hover:text-sky-800 dark:bg-slate-700 dark:before:bg-sky-500 dark:hover:bg-gray-700 dark:text-slate-50 dark:hover:text-sky-300" 
              : "hover:bg-sky-50 hover:text-sky-800 dark:hover:text-sky-300 dark:hover:bg-gray-800"
            )}>
              <a href={setLink(item.link, props.menu.name, item.name)} class="w-full h-full ml-2.5 flex flex-row items-center">
                <span class="icon-list_square text-[1.25rem]"></span>
                <span class="mx-2">{item.text}</span>
              </a>
            </div>
          </Show>
        )}
        </For>
      </div>
    </div>
  );
}
