import { useNavigate } from "@solidjs/router";
import { user_logout } from "bbthings_grpc/auth";
import { userId, setUserId } from "~/lib/store";
import { useBbthings } from "~/context/BbthingsContext";

export default function Logout() {
  const navigate = useNavigate();

  const { authServer, unsetAuthToken, unsetResourceToken } = useBbthings();

  // logout using user_id and auth_token then delete saved tokens and user id
  user_logout(authServer(), {
    user_id: userId() ? userId()! : "",
    auth_token: authServer().auth_token
  }).then(() => {
    unsetAuthToken();
    unsetResourceToken();
    setUserId(null);
    navigate("/auth/login", {replace:true});
  }).catch((error) => {
    console.error(error);
    setUserId(null);
    navigate("/auth/login", {replace:true});
  });

  return (<></>);
}
