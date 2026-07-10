import * as cafeContract from "../../app/contracts/cafes";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "../../app/routes/home";

describe("Cafe Weather scaffold", () => {
  it("preserves the slug on a minimal Cafe record", () => {
    const cafe = { slug: "the-library-specialty-coffee" } satisfies cafeContract.Cafe;

    expect(cafeContract).toBeDefined();
    expect(cafe.slug).toBe("the-library-specialty-coffee");
  });

  it("renders the Cafe Weather homepage on the server", () => {
    const markup = renderToStaticMarkup(createElement(Home));

    expect(markup).toContain("Café Weather");
  });
});
