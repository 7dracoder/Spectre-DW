import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SpecterBrand from "@/components/specter/SpecterBrand";

const NotFound = () => (
  <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
    <div>
      <SpecterBrand size="lg" className="justify-center" />
      <p className="mt-8 text-xs uppercase tracking-[0.2em] text-primary">404</p>
      <h1 className="mt-2 text-3xl font-medium">This trace goes nowhere.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page may have moved or the dossier link is incomplete.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Return home</Link>
      </Button>
    </div>
  </div>
);

export default NotFound;
