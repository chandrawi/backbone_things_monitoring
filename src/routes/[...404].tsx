import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";
import { useNavigate } from "@solidjs/router";
import NavbarIndex from "~/components/navigation/NavbarIndex";
import { darkTheme } from "~/lib/store";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <>
      <Title>Not Found</Title>
      <HttpStatusCode code={404} />
      <div classList={{ dark: darkTheme() }} class="h-screen overflow-hidden">
        <NavbarIndex />
        <div class="min-h-[calc(100vh-3.5rem)] mt-14 bg-slate-50 dark:bg-slate-800 text-gray-800 dark:text-gray-200 flex items-center justify-center">
          <div class="bg-white w-[40%] min-w-72 mb-14 rounded-sm shadow-md shadow-slate-300 dark:bg-gray-900 dark:shadow-slate-950">
            <div class="flex px-3 py-2 bg-gray-100 dark:bg-gray-800 border-x border-t border-slate-200 dark:border-slate-800">
              <span class="icon-cross text-[1.5rem] text-red-600 mr-2"></span>
              <span class="text-lg font-medium">Page Not Found</span>
            </div>
            <div class="flex justify-center py-5 text-base">
              <a href="/" class="flex items-center py-1.5 px-3 bg-sky-700 hover:bg-sky-800 rounded-sm mr-8">
                <span class="icon-home text-gray-100 hover:text-white mr-2"></span>
                <span class="text-gray-100 hover:text-white">Home</span>
              </a>
              <button onClick={() => navigate(-1)} class="flex items-center py-1.25 px-3 bg-sky-700 hover:bg-sky-800 rounded-sm cursor-pointer">
                <span class="icon-back text-xl text-gray-100 hover:text-white mr-2"></span>
                <span class="text-gray-100 hover:text-white">Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
