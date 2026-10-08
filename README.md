# claude-code-mods

Two [Claude Code](https://claude.com/claude-code) mods for keeping an eye on how much room you have left: one for the **context window**, one for your **plan usage limits**. They work in the terminal and in the Claude desktop app's Code tab.

| Mod | Where it shows | What it shows |
| --- | --- | --- |
| [`context-window`](./context-window) | A pane beside the conversation | A colour-coded bar of what fills the context window, with a legend of every category (tokens and share), the autocompact buffer, and a warning at 50% |
| [`plan-usage`](./plan-usage) | A band above the prompt | 5-hour and weekly limit meters with a pace marker, time until reset, an ahead/under-pace label, and the session's cost |

Both also add a short entry to the status line.

## Install

In a Claude Code terminal session:

```
/plugin install context-window --marketplace oakker-myo/claude-code-mods
/plugin install plan-usage --marketplace oakker-myo/claude-code-mods
```

Answer `y` to add the marketplace, then pick a scope (the user scope loads them in every session). Installed at the user scope from a terminal, they also load in the desktop app's Code tab.

Or from a shell:

```bash
claude plugin marketplace add oakker-myo/claude-code-mods
claude plugin install context-window@claude-code-mods --scope user
claude plugin install plan-usage@claude-code-mods --scope user
```

## Usage

| Command | Effect |
| --- | --- |
| `/context-window` | Open or close the context-window pane |
| `/plan-usage` | Show or hide the plan-usage band |

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

## Requirements

Claude Code with plugin hooks modules (2.1.293 or later).

## Development

Each mod is a plugin folder: `.claude-plugin/plugin.json`, a hooks module in `hooks/`, and its state contract in `types/`. The repository root holds the marketplace file, `.claude-plugin/marketplace.json`.

```bash
claude plugin validate .
claude plugin validate context-window
claude plugin test context-window
claude plugin test plan-usage
```

To try a change without installing, start a session with `claude --plugin-dir ./context-window --plugin-dir ./plan-usage`. If you installed from a clone of this folder (`claude plugin marketplace add <folder>`), edit it and run `/reload-plugins`.

See [CHANGELOG.md](./CHANGELOG.md) for release notes.

## License

[MIT](./LICENSE)
