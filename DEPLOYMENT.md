# Deployment

GitHub Pages is the production target. The `Deploy validated GitHub Pages`
workflow validates the JSON contract, legacy installed packs, Timeline, and
Classic before it uploads a Pages artifact. A failed check cannot reach its
deploy job, so the prior live artifact remains active.

## One-time Pages setting

In GitHub, open **Settings → Pages → Build and deployment → Source**, choose
**GitHub Actions**, and save. Until this is selected, a branch-based Pages
source can publish `main` independently of the validation gate. Do this once
after the workflow reaches the repository.

Done 2026-10-22: the Pages source is GitHub Actions (`gh api repos/ckopin21/what-happened-first/pages`
reports `build_type: workflow`), so only this workflow publishes.

After that, inspect the `Deploy validated GitHub Pages` run for the deployed
URL. Pack-only edits trigger it automatically.
