const notFoundBody = {
  error: {
    code: "not_found",
    message: "API route not found.",
  },
};

function notFoundResponse() {
  return Response.json(notFoundBody, { status: 404 });
}

export function loader() {
  return notFoundResponse();
}

export function action() {
  return notFoundResponse();
}
