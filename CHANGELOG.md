# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the mods follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.1] - 2026-10-09

### Changed

- `context-window` 0.3.0: the bar across the pane is replaced by a waffle of the whole window beside the legend: 500 cells (25 × 20), each 0.2% of the window, in the legend's order: the used categories largest first, then free space, then the autocompact buffer. It keeps one size whatever the pane's width and is to scale, yet fine enough that small categories still show. The legend lists the used categories largest first.

## [0.3.0] - 2026-10-09

### Added

- `turn-receipt` 0.1.0: a receipt under each turn's answer with the turn's cost, total tokens, duration, model and context added; a colour bar and legend of tokens by category (cache read, cache write, input, output, subagents); the tools that ran; and an estimate of the tool output fed back to the model, by tool. `/turn-receipt` shows or hides receipts.

### Changed

- `plan-usage` 0.2.1: a blank line between the 5-hour and weekly meters.
- `turn-receipt` 0.2.0: the tools are a table (calls, a bar and the output fed back, per tool) showing the four busiest, with the rest and Claude's bookkeeping tools folded into one "+ more" line and a total underneath. Turns with fewer than three calls and under 1k tokens of output show one line.

### Fixed

- `plan-usage` 0.2.2: the blank line between meters now shows in the band above the prompt, which ignored the gap 0.2.1 set.
- `plan-usage` 0.2.3: on the desktop the gap between meters is a small fixed space instead of a whole blank line; the terminal keeps the line.
- `plan-usage` 0.2.4: the band shows again on the desktop. The 6px spacer from 0.2.3 stopped it rendering; the meters now sit on consecutive lines, since spacing comes in whole rows.
- `turn-receipt` 0.2.1: the tool bars use whole blocks only, since fonts draw the partial blocks at uneven heights.

## [0.2.0] - 2026-10-09

### Added

- `context-window`: a pane with a colour-coded context bar, a legend of every category with tokens and share, the autocompact buffer in its own colour, a live percentage in the pane title, a status-line entry, and a notification at 50%. `/context-window` opens or closes the pane.
- `plan-usage`: a band above the prompt with 5-hour and weekly limit meters, a pace marker, reset countdowns, an ahead/under-pace label and the session's cost; a status-line entry and notifications at 80% and 95%. `/plan-usage` shows or hides the band.

[Unreleased]: https://github.com/oakker-myo/claude-code-mods/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/oakker-myo/claude-code-mods/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/oakker-myo/claude-code-mods/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/oakker-myo/claude-code-mods/releases/tag/v0.2.0
