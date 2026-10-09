# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the mods follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `turn-receipt` 0.1.0: a receipt under each turn's answer with the turn's cost, total tokens, duration, model and context added; a colour bar and legend of tokens by category (cache read, cache write, input, output, subagents); the tools that ran; and an estimate of the tool output fed back to the model, by tool. `/turn-receipt` shows or hides receipts.

### Changed

- `plan-usage` 0.2.1: a blank line between the 5-hour and weekly meters.

## [0.2.0] - 2026-10-09

### Added

- `context-window`: a pane with a colour-coded context bar, a legend of every category with tokens and share, the autocompact buffer in its own colour, a live percentage in the pane title, a status-line entry, and a notification at 50%. `/context-window` opens or closes the pane.
- `plan-usage`: a band above the prompt with 5-hour and weekly limit meters, a pace marker, reset countdowns, an ahead/under-pace label and the session's cost; a status-line entry and notifications at 80% and 95%. `/plan-usage` shows or hides the band.

[Unreleased]: https://github.com/oakker-myo/claude-code-mods/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/oakker-myo/claude-code-mods/releases/tag/v0.2.0
