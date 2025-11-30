import { usePageContext } from "vike-react/usePageContext";
import { GeneralError } from "@/components/general-error";
import { NotFound } from "@/components/not-found";

export default function Page() {
  const { is404 } = usePageContext();

  if (is404) {
    return <NotFound />;
  }

  return <GeneralError />;
}
