import { brand } from "../config/brand";

export function meta() {
  return [
    { title: `Privacy · ${brand.name}` },
    {
      name: "description",
      content: `How ${brand.name} handles anonymous visitor data.`,
    },
  ];
}

export default function Privacy() {
  return (
    <article className="legal-page legal-page--privacy">
      <header className="legal-page__header">
        <h1>Privacy, in plain language.</h1>
      </header>
      <div className="legal-page__content">
        <p>
          We use a signed anonymous visitor cookie. Your visitor identity is
          hashed using a secret held only on the server, so it does not create
          an account or personal profile.
        </p>
        <p>
          Reactions and café suggestions are stored. Suggestions are protected
          by Cloudflare Turnstile to reduce automated abuse.
        </p>
        <p>
          There are no user accounts or profiles. For questions, use the
          repository as the contact path: {" "}
          <a href="https://github.com/adukhan98/cafeweather">
            Café Weather on GitHub
          </a>
          .
        </p>
      </div>
    </article>
  );
}
