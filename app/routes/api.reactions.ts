import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { handleApiResource } from "../.server/api-resource";

export function action(args: ActionFunctionArgs) {
  return handleApiResource(args);
}

export function loader(args: LoaderFunctionArgs) {
  return handleApiResource(args);
}
