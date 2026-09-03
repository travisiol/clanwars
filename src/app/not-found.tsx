import { ButtonLink } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] flex-col justify-center px-4 sm:px-6">
      <Label>Off the board</Label>
      <h1 className="type-title mt-3 text-chalk">There is no hex here.</h1>
      <p className="type-body mt-4 max-w-[52ch] text-chalk-soft">
        The map is 217 hexes and this is not one of them.
      </p>
      <div className="mt-7">
        <ButtonLink href="/">Back to the map</ButtonLink>
      </div>
    </div>
  );
}
