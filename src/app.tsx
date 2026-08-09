import { MetaProvider, Title, Link } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { BbthingsProvider } from "./context/BbthingsContext";

export default function App() {
  return (
    <BbthingsProvider>
      <Router
        root={props => (
          <MetaProvider>
            <Title>SolidStart</Title>
            <Link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;500;600;700;900&amp;display=swap" />
            <Link rel="stylesheet" href="/fonts/bbthings_icon.css" />
            <Suspense>{props.children}</Suspense>
          </MetaProvider>
        )}
      >
        <FileRoutes />
      </Router>
    </BbthingsProvider>
  );
}
