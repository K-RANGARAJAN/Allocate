// What a first-time visitor needs before they trust a single number on screen.
//
// The landing page is deliberately bare, so this stays collapsed and quiet
// underneath it. It matters most once the app is a link someone opens cold:
// without it they meet confident figures about kidney allocation with nothing
// saying the patients are synthetic. Stating the limits ourselves is also a
// better answer than being asked about them.
//
// A native <details> so it needs no state, works without JavaScript and is
// keyboard accessible for free.
export function MethodNote() {
  return (
    <details className="method">
      <summary className="method-summary">
        Synthetic data. Not a clinical tool. How this was built
      </summary>
      <div className="method-body">
        <p>
          Every patient and every donor in this simulation is generated in code. No real
          registry or patient data is used anywhere. It is a model for exploring policy
          trade-offs, not a clinical or policy instrument, and no number here describes a
          real person.
        </p>

        <h3>What is grounded in published figures</h3>
        <ul>
          <li>
            Blood group distribution, O 37 / B 32 / A 23 / AB 8, the Indian population
            frequencies rather than Western ones.
          </li>
          <li>
            Government share of transplant centres at 13%. Of the 682 kidney transplant
            centres registered with NOTTO, 87% are private.
          </li>
          <li>
            The scale. India&rsquo;s deceased donor rate is 0.77 per million population, so
            the 0.8 donors a day modelled here represent a region of roughly 380 million.
          </li>
          <li>
            The cascade and hospital rota, modelled on the allocation system actually
            operated in Tamil Nadu.
          </li>
        </ul>

        <h3>What stands in for a real instrument</h3>
        <ul>
          <li>
            Expected life-years is our own curve in the spirit of LYFT (Life Years From
            Transplant). It returns 11.0 years at age 50 against a published mean
            post-transplant survival of 11.9 at median age 52.
          </li>
          <li>
            Donor quality is a deliberately simplified linear proxy for KDPI, which reads
            eight to ten donor characteristics. We use donor age, the strongest single one.
          </li>
        </ul>

        <h3>What we know is wrong with it</h3>
        <ul>
          <li>
            Organ discards are too low, about 3% against a real figure closer to 20%. The
            only discard mechanism modelled is graft quality decaying in transit.
          </li>
          <li>
            Cold ischemia times are low, averaging 10.5 hours against a real 17 to 20,
            because the modelled geography is compact.
          </li>
          <li>
            Living donors are not modelled at all, though they are the majority of Indian
            kidney transplants. This is a deceased-donor allocation model.
          </li>
        </ul>

        <p className="method-close">
          The same policy and the same seed always produce identical results, which is what
          makes two scenarios comparable rather than merely different.
        </p>
      </div>
    </details>
  );
}
