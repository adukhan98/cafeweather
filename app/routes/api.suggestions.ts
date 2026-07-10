import type { ActionFunctionArgs } from "react-router";
import { handleApiResource } from "../.server/api-resource";

export function action(args: ActionFunctionArgs) {
  return handleApiResource(args);
}
