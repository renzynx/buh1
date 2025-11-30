import { BProgress } from "@bprogress/core";

export async function onPageTransitionEnd() {
  BProgress.done();
}
