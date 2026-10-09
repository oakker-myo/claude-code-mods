# claude-code-mods

Three [Claude Code](https://claude.com/claude-code) mods for keeping an eye on how much room you have left and what you spend: your **context window**, your **plan usage limits**, and a **receipt for each turn**. They work in the terminal and in the Claude desktop app's Code tab.

| Mod | Where it shows | What it shows |
| --- | --- | --- |
| [`context-window`](./context-window) | A pane beside the conversation | A colour-coded bar of what fills the context window, with a legend of every category (tokens and share), the autocompact buffer, and a warning at 50% |
| [`plan-usage`](./plan-usage) | A band above the prompt | 5-hour and weekly limit meters with a pace marker, time until reset, an ahead/under-pace label, and the session's cost |
| [`turn-receipt`](./turn-receipt) | A card under each turn's answer | What the turn cost, its tokens by category, duration, model, the tools that ran, and how much tool output went back to the model |

`context-window` and `plan-usage` also add a short entry to the status line.

## Install

In a Claude Code terminal session:

```
/plugin install context-window --marketplace oakker-myo/claude-code-mods
/plugin install plan-usage --marketplace oakker-myo/claude-code-mods
/plugin install turn-receipt --marketplace oakker-myo/claude-code-mods
```

Answer `y` to add the marketplace, then pick a scope (the user scope loads them in every session). Installed at the user scope from a terminal, they also load in the desktop app's Code tab.

Or from a shell:

```bash
claude plugin marketplace add oakker-myo/claude-code-mods
claude plugin install context-window@claude-code-mods --scope user
claude plugin install plan-usage@claude-code-mods --scope user
claude plugin install turn-receipt@claude-code-mods --scope user
```

## Usage

| Command | Effect |
| --- | --- |
| `/context-window` | Open or close the context-window pane |
| `/plan-usage` | Show or hide the plan-usage band |
| `/turn-receipt` | Show or hide the receipts under each turn |

### context-window

- **Bar**: one coloured section per category in the window. The amber hatched section is the *autocompact buffer*: space Claude Code keeps free so it can summarise the conversation when the window fills; autocompact starts where it begins. Faint grey is free space.
- **Legend**: a swatch, name, token count and share of the window for every category. Tool schemas that load on demand sit outside the window and are summed in a note underneath.
- **Warning**: a notification when the window passes 50%, suggesting `/compact`.
- **Pane title**: carries the live percentage, e.g. `Context window · 11%`.

### plan-usage

- **Meters**: one per limit window (5-hour, weekly), green below 70%, amber to 90%, red above.
- **Pace marker `│`**: how much of the window's time has passed. Usage left of it is under pace.
- **↻**: time until the window resets. Countdowns refresh every minute.
- **Notifications** at 80% and 95% of a limit.

Plan meters appear on Pro and Max plans after the first reply of a session.

### turn-receipt

A small card under the answer that closes each turn:

- **Top line**: what the turn cost (the session's cost before and after, so subagents are included), total tokens, duration, model, and how much the turn added to the context window.
- **Bar and legend**: the turn's tokens by category: *cache read* (earlier context reused from the prompt cache), *cache write* (context newly cached), *input* (uncached input), *output* (what Claude wrote) and *subagents*.
- **Tools**: a small table of the tools that ran, with their calls and the tool output fed back to the model. That output is an estimate, at about four characters a token, and it is part of the input and cache-write tokens above, not added to them.

  ```
  Tools              calls   output fed back
  Read                   2   ██████████ ≈261
  Bash                   3   ███████    ≈182
  + 2 more (ExitPlanMode, ToolSearch) · 2 calls  ≈457
  ─────────────────────────────────────────────
  7 calls · ≈900 tokens fed back
  ```

  The four tools with the most output get a row; the rest, and Claude's own bookkeeping tools (ToolSearch, plan mode, todo lists), fold into one "+ more" line. A turn with fewer than three calls and under 1k tokens of output shows one line instead, e.g. `Tools Bash ×2 · ≈180 fed back`.

A turn that ends on a tool call with no closing text has no answer to hang a receipt under, so it shows none.

## Requirements

Claude Code with plugin hooks modules (2.1.293 or later).

## Development

Each mod is a plugin folder: `.claude-plugin/plugin.json`, a hooks module in `hooks/`, and its state contract in `types/`. The repository root holds the marketplace file, `.claude-plugin/marketplace.json`.

```bash
claude plugin validate .
claude plugin validate context-window
claude plugin test context-window
claude plugin test plan-usage
claude plugin test turn-receipt
```

To try a change without installing, start a session with `claude --plugin-dir ./context-window --plugin-dir ./plan-usage --plugin-dir ./turn-receipt`. If you installed from a clone of this folder (`claude plugin marketplace add <folder>`), Claude Code installs from the clone's last commit, so a change reaches your sessions once it is committed:

```bash
git commit -am "…"
claude plugin update <mod>@claude-code-mods
```

then run `/reload-plugins` in a running session.

See [CHANGELOG.md](./CHANGELOG.md) for release notes.

## License

[MIT](./LICENSE)
