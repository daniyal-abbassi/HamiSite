import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ScrollEffects } from "./components/ScrollEffects";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Partners from "./pages/Partners";
import PartnerLogin from "./pages/PartnerLogin";
import PartnerPreview from "./pages/PartnerPreview";
import ProductDetail from "./pages/ProductDetail";
import Shop from "./pages/Shop";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/shop"} component={Shop} />
      <Route path={"/shop/:productId"} component={ProductDetail} />
      <Route path={"/partners"} component={Partners} />
      <Route path={"/partners/login"} component={PartnerLogin} />
      <Route path={"/partners/preview"} component={PartnerPreview} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <ScrollEffects />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
