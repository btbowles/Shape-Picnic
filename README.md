# Shape Picnic

A short, touch-first matching game for preschoolers. Match the picture at the top with the same picture on the picnic blanket. The first three puzzles have two choices and the last three have three. A wrong choice keeps the same puzzle open for another try. After six matches, tap **Play again** for a fresh round.

Sound starts off. The sound button enables quiet, locally generated tones. The game uses original illustrations and makes no requests for external assets. It has no accounts, ads, or analytics.

## Run locally

From the repository root, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000/>. The game is plain HTML, CSS, and JavaScript and needs no build step.

Run the optional automated tests with a recent Node.js installation:

```sh
node --test tests/*.test.mjs
```

## Checks before publishing

A complete round was played at 390 × 844 and 768 × 1024 in the ChatGPT in-app browser using portrait viewport emulation. Both runs checked a wrong choice, a successful retry, the third choice, completion, and replay. These checks used browser clicks at simulated sizes.

Hermes tried the rules and optional tone mapping separately using the local Qwen file-only profile. Both edits failed independent acceptance after the bounded repairs. Codex implemented the released versions and reran the tests.
