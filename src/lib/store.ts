import { createSignal, createEffect, createRoot, lazy } from "solid-js";

const EXPIRE = 604800;
export const DEFAULT_DASHBOARD = "default";
export const DEFAULT_MENU = "overview";
export const DefaultComponent = lazy(() => import("~/routes/dashboard/[name]/overview"));
export const ERROR_UNAUTHENTICATED = 16;

function deleteCookie(name: string) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict";
}

function deleteAllCookie(name_prefix: string) {
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const cookieName = cookie.trim().split('=')[0];
    if (cookieName.startsWith(name_prefix)) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
    }
});
}

function createCookie(name: string, value: string | null, seconds: number) {
  if (value === null) {
    deleteCookie(name);
    return;
  }
  let expires = "";
  if (seconds) {
    const date = new Date();
    date.setTime(date.getTime() + (seconds * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + value + expires + "; path=/; SameSite=strict";
}

function readCookie(name: string) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export const langs = [
  { name: "ID", icon: "/icon/fi-id.svg" }, 
  { name: "EN", icon: "/icon/fi-gb.svg" }
];

export const [lang, setLang] = createRoot(() => {
  const cookieLang = readCookie("lang");
  const initialLang = cookieLang ? cookieLang : "ID";
  const [lang, setLang] = createSignal(initialLang);
  createEffect(() => {
    createCookie("lang", lang(), EXPIRE);
  });
  return [lang, setLang];
});

export const [darkTheme, setDarkTheme] = createRoot(() => {
  const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const cookieTheme = readCookie("darkTheme");
  const initialTheme = cookieTheme ? cookieTheme === "1": systemTheme;
  const [darkTheme, setDarkTheme] = createSignal(initialTheme);
  createEffect(() => {
    const theme = darkTheme() ? "1" : "0";
    createCookie("darkTheme", theme, EXPIRE);
  });
  return [darkTheme, setDarkTheme];
});

export const [userId, setUserId] = createRoot(() => {
  const cookieUser = readCookie("user_id");
  const [userId, setUserId] = createSignal(cookieUser);
  createEffect(() => {
    if (userId() != null) {
      createCookie("user_id", userId()!, EXPIRE);
    } else {
      deleteCookie("user_id");
    }
  });
  return [userId, setUserId]
});

export const bbthingsCookie = {
  readUserId() {
    return readCookie("user_id");
  },
  createUserId(user_id: string) {
    createCookie("user_id", user_id, EXPIRE);
  },
  deleteUserId() {
    deleteCookie("user_id");
  },
  readAuthToken() {
    return readCookie("auth_token");
  },
  createAuthToken(token: string) {
    createCookie("auth_token", token, EXPIRE);
  },
  deleteAuthToken() {
    deleteCookie("auth_token");
  },
  readAccessToken(api_id: string) {
    return readCookie("access_token_" + api_id);
  },
  createAccessToken(api_id: string, token: string) {
    createCookie("access_token_" + api_id, token, EXPIRE);
  },
  deleteAccessToken() {
    deleteAllCookie("access_token_");
  },
  readRefreshToken(api_id: string) {
    return readCookie("refresh_token_" + api_id);
  },
  createRefreshToken(api_id: string, token: string) {
    createCookie("refresh_token_" + api_id, token, EXPIRE);
  },
  deleteRefreshToken() {
    deleteAllCookie("refresh_token_");
  },
}
