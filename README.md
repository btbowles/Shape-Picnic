# Shape Picnic

A touch-first picnic game for preschoolers with ten levels and three picture matches per level. The board grows from two tiles to six. Later levels show the same shape in different colours and turn the tiles by 90°, 180°, or 270°. Match the shape and colour of the example, even if the tile is sideways or upside down. Wrong choices leave the puzzle open for another try. After Level 10, tap **Play again** to start over.

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
