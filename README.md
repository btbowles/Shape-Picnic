# Shape Picnic

A touch-first suite of eight picture games for preschoolers:

- **Shape Match** grows from two tiles to six over ten levels, adding colours and rotations.
- **Memory Pairs** deals six face-down tiles. Each pair of flips counts as one turn. Matches disappear, and the final screen shows the total.
- **Snack Count** asks for a bowl with as many snacks as the example.
- **Odd One Out** asks for the picture that is different.
- **Picnic Patterns** asks what comes next in an alternating picture sequence.
- **More Snacks** asks which bowl contains the most.
- **Big & Little** asks for the smallest or biggest pear.
- **Snack Catch** asks children to tap gently moving snacks and fill a five-slot basket. Motion can be paused.

Wrong choices leave the same puzzle open for another try. Each game offers replay.

Shape Match sound starts off. The sound button enables quiet, locally generated tones. The game uses original illustrations and makes no requests for external assets. It has no accounts, ads, or analytics.

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

## Verification

The Node tests cover Shape Match progression, memory turns and matches, and every puzzle board. Browser checks exercise the menu, game transitions, wrong choices, replay, and the final memory turn total.

Hermes generated the independently verified Picnic Patterns boards. The broader board-generation and memory patches failed independent checks, so Codex completed those pieces.

## Ricochet Circuit

[Ricochet Circuit](https://btbowles.github.io/Shape-Picnic/ricochet/) is a separate logic puzzle hosted in this repository. Launch balls through lettered ports, flip gold gates, and reach the finish with the last ball. Blue mirrors stay fixed, and bumpers and closed perimeter edges reverse the ball. Its ten levels each have one winning launch sequence and a fixed ball budget. Open `/ricochet/` when running the local server. The Node tests check the reflection rules and search all reachable gate states for trapped shots.
