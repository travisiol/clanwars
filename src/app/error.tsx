"use client";

import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] flex-col justify-center px-4 sm:px-6">
      <Label>Plate misfed</Label>
      <h1 className="type-title mt-3 text-chalk">Something on this page failed to print.</h1>
      <p className="type-body mt-4 max-w-[52ch] text-chalk-soft">
        Nothing on this page moves money or moves a border, so nothing was left
        half-done. The board is exactly where it was.
      </p>
      <div className="mt-7">
        <Button onClick={reset}>Print again</Button>
      </div>
    </div>
  );
}
