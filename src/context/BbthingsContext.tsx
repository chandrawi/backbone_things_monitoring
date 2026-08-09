import { createSignal, createResource, createMemo, createContext, useContext, JSX, Accessor, Setter } from "solid-js";
import { AuthSchema, AuthServer, ResourceSchema, ResourceServer, TokenMap } from "~/lib/definition";
import { bbthingsCookie } from "~/lib/store";

interface BbthingsContextType {
  authServer: Accessor<AuthServer>;
  setAuthToken: (auth_token: string) => void;
  unsetAuthToken: () => void;
  resourceServer: Accessor<ResourceServer>;
  setResourceName: Setter<string>;
  setResourceToken: (api_id: string, access_token: string, refresh_token: string) => void;
  unsetResourceToken: () => void;
};

const BbthingsContext = createContext<BbthingsContextType>();

export function BbthingsProvider(props: {children: JSX.Element}) {
  const [token, setToken] = createSignal<string>("");
  const [tokenMap, setTokenMap] = createSignal<TokenMap[]>([]);
  const [resourceName, setResourceName] = createSignal<string>("");

  // get an auth schema
  const [auth] = createResource<AuthSchema>(async (name) => {
    try {
      const response = await fetch(`/schema/auth.json`);
      return await response.json();
    } catch(error) {
      console.error(error);
    }
  });

  // get a resource schema based on the dashboard name
  const [resource] = createResource<ResourceSchema, string>(resourceName, async (name) => {
    if (name === "") return;
    try {
      const response = await fetch(`/schema/dashboard/${name}/resource.json`);
      return await response.json();
    } catch(error) {
      console.error(error);
    }
  });

  // get server configuration object from auth schema and auth token
  const authServer: Accessor<AuthServer> = createMemo(() => {
    const a = auth();
    let address = "";
    let auth_token = "";
    if (a) {
      address = a.address;
      // try to get token from auth token signal
      const t = token();
      if (t) {
        auth_token = t;
      } else {
        // try to get token from cookie
        const at = bbthingsCookie.readAuthToken();
        if (at) auth_token = at;
      }
    }
    return {
      address: address,
      auth_token: auth_token
    };
  });

  // set auth token signal and auth token cookie
  const setAuthToken = (auth_token: string) => {
    if (auth_token) {
      setToken(auth_token);
      bbthingsCookie.createAuthToken(auth_token);
    }
  };
  // remove token signal and token cookie
  const unsetAuthToken = () => {
    setToken("");
    bbthingsCookie.deleteAuthToken();
  };

  // get server configuration object from resource schema and token map
  const resourceServer: Accessor<ResourceServer> = createMemo(() => {
    const r = resource();
    let address = "";
    let access_token = "";
    let refresh_token = "";
    if (r) {
      address = r.address;
      // try to get token from token map
      const token = tokenMap().find((item) => item.api_id === r.api_id);
      if (token) {
        access_token = token.access_token;
        refresh_token = token.refresh_token;
      } else {
        // try to get token from cookie
        const at = bbthingsCookie.readAccessToken(r.api_id);
        const rt = bbthingsCookie.readRefreshToken(r.api_id);
        if (at && rt) {
          access_token = at;
          refresh_token = rt;
        }
      }
    }
    return {
      address: address,
      access_token: access_token,
      refresh_token: refresh_token
    };
  });

  // add a token map and a token cookie
  const setResourceToken = (api_id: string, access_token: string, refresh_token: string) => {
    const t = tokenMap();
    if (api_id && access_token && refresh_token) {
      t.push({
        api_id: api_id,
        access_token: access_token,
        refresh_token: refresh_token
      });
      setTokenMap(t);
      bbthingsCookie.createAccessToken(api_id, access_token);
      bbthingsCookie.createRefreshToken(api_id, refresh_token);
    }
  };
  // remove all token map and token cookie
  const unsetResourceToken = () => {
    setTokenMap([]);
    bbthingsCookie.deleteAccessToken();
    bbthingsCookie.deleteRefreshToken();
  };

  return (
    <BbthingsContext.Provider value={{ authServer, setAuthToken, unsetAuthToken, resourceServer, setResourceName, setResourceToken, unsetResourceToken }}>
      {props.children}
    </BbthingsContext.Provider>
  );
}

export function useBbthings() {
  const context = useContext(BbthingsContext);
  if (!context) throw new Error("useBbthings must be used within a BbthingsProvider");
  return context;
}
