import { Spinner } from "evergreen-ui";

export default function LoadingComponent() {
  return <div className="h-full w-full flex justify-center items-center">
    <Spinner />
  </div>
}