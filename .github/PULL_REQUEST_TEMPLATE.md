## Summary

<!-- Describe the problem and resulting behavior in one or two sentences. -->

## Changes

<!-- List meaningful changes and why they are needed. -->

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Automated tests and syntax | Passed / Failed / Blocked / Not run | Commands, test count, revision and environment |
| CI on latest PR head | Not run | No CI is currently configured; do not imply local tests are CI |
| Browser / integration | Passed / Failed / Blocked / Not run | Actual results or maintained README procedure |

## Manual testing

**Needed:** Yes / No — explain why. For UI, image decoding, canvas or download changes, identify the relevant numbered steps in the README's Browser acceptance procedure, prerequisites, exact synthetic inputs, expected outcomes and pass/fail criteria.

**Execution:** Passed / Failed / Blocked / Not run — record browser, revision, outcomes and any screenshots or archive checks. Instructions alone are not evidence of execution.

**Cleanup:** Remove only named synthetic test artifacts; preserve original images and user data.

## Deployment and recovery

**Rollout:** No automatic Sites deployment from GitHub. State whether a separately authorized Sites publication is needed.

**Migrations and data:** None, unless explicitly described. Image processing is browser-local.

**Recovery:** Redeploy a prior saved Sites version when a runtime change is published. Reverting source alone does not change the hosted site.

## Remaining work

<!-- Keep failed, blocked and unrun acceptance checks visible. State ready for review, published or accepted accurately. -->

## Related work

**Issue:** <!-- Link the issue; use a closing reference only when merge should close it. -->

**Dependencies:** None, unless described.
