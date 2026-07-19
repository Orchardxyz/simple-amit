# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project uses Semantic Versioning with odd minor versions for VS Code Marketplace prereleases.

## [0.1.2](https://github.com/Orchardxyz/simple-amit/compare/v0.1.1...v0.1.2) (2026-07-19)


### Fixed

* **webview:** prevent dismissed toasts blocking clicks ([025a753](https://github.com/Orchardxyz/simple-amit/commit/025a753663ae78bc7d92272055bcee7a049cb875))
* **webview:** snapshot settings before RPC ([95e6827](https://github.com/Orchardxyz/simple-amit/commit/95e6827bdaceb4bb7c591d28c7254f33025477e6))

## [0.1.1](https://github.com/Orchardxyz/simple-amit/compare/v0.1.0...v0.1.1) (2026-07-19)

### Fixed

- **manifest:** update marketplace categories ([#2](https://github.com/Orchardxyz/simple-amit/issues/2)) ([513367c](https://github.com/Orchardxyz/simple-amit/commit/513367c569894337f8d4cb4d6134621fb806de7a))

## [Unreleased]

## [0.1.0] - 2026-07-19

### Added

- Added the Simple Amit VS Code extension foundation for AI-assisted commit message generation.
- Added provider configuration for Anthropic, Gemini, and OpenAI-compatible endpoints.
- Added secure API key storage through VS Code SecretStorage.
- Added a Svelte settings Webview for provider, model, language, and instruction configuration.
- Added Git status and diff tooling for commit-message generation.

### Changed

- Added brand assets and SCM menu integration for the commit-message command.
- Added shared formatting, linting, type-checking, and test coverage for extension and Webview modules.
