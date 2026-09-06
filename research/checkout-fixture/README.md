# Executable checkout fixture for idea finalization

This is an owned local diagnostic fixture. Its outputs are computed by executable code and queried over loopback HTTP. It is not a deployed checkout, payment implementation, autonomous diagnosis, or evidence that multiple agents outperform one.

## Contract

Inputs: integer unit price in cents, quantity, discount in basis points, and tax in basis points. Apply the discount once to the subtotal, round to cents, then apply tax once and round to cents. 100 basis points = 1%.

The response returns only `totalCents`. The operator selects the scenario out of band. The future agents must receive the business contract and observed responses, but not the variant flag, implementation source, verification table, or expected root cause. This is a controlled fixture, not a production zero-day discovery.

## Commands available now

```powershell
node research/checkout-fixture/verify.mjs
node research/checkout-fixture/quote-service.mjs discount-twice 4318
```

The first command creates and closes ephemeral loopback servers and verifies twelve actual HTTP cases across three variants, plus three invalid-input checks. It needs Node's built-in APIs only and makes no external network requests. The second starts a manual server until interrupted.

## Why this fixture

On the initial input, expected total is 18,900 cents. The double-discount implementation produces 17,010. Disabling tax still yields the wrong answer, 16,200 versus 18,000. That contradicts a *tax-only* explanation. Disabling the discount yields the correct 21,000 cents. The prebuilt corrected variant passes all four probes. A separate double-tax variant reverses which explanation these probes support.

The exact values are small enough for a judge to check. The tests do not call the implementation to derive their expected values. They also verify that the HTTP response does not reveal the fault label.

`tax-twice` is a public alternate fixture, not a blind holdout: both agents' development tools can read this repository. A genuine held-out parameter or fault configuration must be reserved separately by an evaluator before tuning and remain outside the runtime model context.

The final application should import or adapt this module rather than maintain a competing second implementation. Package/provider and live peer-replanning validation are still separate tasks.
