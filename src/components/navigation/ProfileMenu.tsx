import { Show, createResource, Suspense } from "solid-js";
import { read_user } from "bbthings_grpc/auth";
import { userId, authServer } from "~/lib/store";

export default function ProfileMenu() {

  // get user data using stored user_id
  const [userData] = createResource(userId, async (user_id) => {
    try {
      return await read_user(authServer.get()!, { id: user_id });
    } catch (error) {
      console.error(error);
    }
    return null;
  });

  return (
    <Show when={userId()} fallback={
      <>
      <div class="hidden lg:block h-full xl:pl-2.5 xl:border-l border-slate-200 dark:border-slate-700">
        <div class="hidden xl:flex flex-row h-full items-center">
          <a href="/#/register" class="text-sm text-gray-100 py-0.5 px-2 bg-sky-700 hover:bg-sky-800 rounded-sm hover:text-white">Register</a>
        </div>
      </div>
      <div class="h-full xl:ml-2 text-sm">
        <a href="/auth/login" class="group h-full flex flex-col lg:flex-row items-center justify-center font-medium">
          <span class="mr-1 hidden lg:inline group-hover:text-sky-800 dark:group-hover:text-sky-300">Login</span>
          <span class="icon-login text-[1.5rem] lg:text-[2rem] text-sky-700"></span>
          <span class="mr-1 lg:hidden group-hover:text-sky-800 dark:group-hover:text-sky-300">Login</span>
        </a>
      </div>
      </>
    }>
      <div class="dropdown h-full xl:pl-2.5 mr-3 xl:border-l border-slate-200 dark:border-slate-700">
        <button tabindex="0" class="h-full flex flex-row items-center">
          <span class="w-full pr-1 hidden xl:inline font-medium">
            <Suspense fallback={"Username"}>
              {userData() ? userData()?.name : "Username"}
            </Suspense>
          </span>
          <div class="w-9 h-9 relative rounded-full border-2 border-sky-700 flex items-center justify-center">
            <span class="icon-user_circle text-[2.25rem] text-sky-700"></span>
            {/* <span class="h-4 -mt-6 px-1 inline-block absolute left-6 align-middle text-gray-100 text-[0.6875rem] rounded-md bg-red-700">25</span> */}
          </div>
          <div class="hidden xs:flex flex-row items-center h-full pt-3 ml-1 -mr-2 ">
            <span class="icon-arrow_fill_down text-lg text-sky-700"></span>
          </div>
        </button>
        <div class="w-full flex flex-row justify-end">
          <div class="dropdown-content w-44 -mr-1 pb-0.5 fixed bg-white shadow-md-res shadow-slate-200 rounded-b-sm dark:bg-gray-800 dark:shadow-slate-950">
            <span class="w-full h-8 px-4 flex xl:hidden flex-row items-center font-medium border-t border-slate-200 dark:border-slate-700">
              <Suspense fallback={"Username"}>
                {userData() ? userData()?.name : "Username"}
              </Suspense>
            </span>
            <a class="w-full h-8 px-3 flex flex-row items-center border-t border-slate-200 hover:text-sky-800 dark:border-slate-700 dark:hover:text-sky-300">
              <span class="icon-user text-[1rem] w-5 ml-0.5"></span>
              <span class="ml-1.5">Profile</span>
            </a>
            <a class="w-full h-8 px-3 flex flex-row items-center border-t border-slate-200 hover:text-sky-800 dark:border-slate-700 dark:hover:text-sky-300">
              <span class="icon-message text-[1rem] w-5"></span>
              <span class="ml-1.5">Message</span>
              <div class="grow h-full flex flex-row items-center justify-end">
                {/* <span class="h-4 px-1 bg-red-700 rounded-md text-[0.6875rem] text-gray-100">20</span> */}
              </div>
            </a>
            <a class="w-full h-8 px-3 flex flex-row items-center border-t border-slate-200 hover:text-sky-800 dark:border-slate-700 dark:hover:text-sky-300">
              <span class="icon-task text-[1.25rem] w-5"></span>
              <span class="ml-2">Task</span>
              <div class="grow h-full flex flex-row items-center justify-end">
                {/* <span class="h-4 px-1 bg-red-700 rounded-md text-[0.6875rem] text-gray-100">5</span> */}
              </div>
            </a>
            <a href="/auth/logout" class="w-full h-8 px-3 flex flex-row items-center border-t border-slate-200 hover:text-sky-800 dark:border-slate-700 dark:hover:text-sky-300">
              <span class="icon-logout text-[1.25rem] w-5"></span>
              <span class="ml-2">Logout</span>
            </a>
          </div>
        </div>
      </div>
    </Show>
  );
}
