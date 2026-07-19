# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project uses Semantic Versioning with odd minor versions for VS Code Marketplace prereleases.

## [0.1.1](https://github.com/Orchardxyz/simple-amit/compare/v0.1.0...v0.1.1) (2026-07-19)


### Added

* **commit:** generate messages with VoltAgent ([d2ce874](https://github.com/Orchardxyz/simple-amit/commit/d2ce8747002a088ef80361e324f742934cf86472))
* **extension:** add generate button to SCM title ([b2069ca](https://github.com/Orchardxyz/simple-amit/commit/b2069ca7ff54df3fa645b0c74b6fa39c1c654abc))
* **extension:** add technical foundation ([dd02f8a](https://github.com/Orchardxyz/simple-amit/commit/dd02f8a89c99ca5c6cbd898e2a141ab4d7fad2ee))
* **settings:** persist commit settings ([4d1da41](https://github.com/Orchardxyz/simple-amit/commit/4d1da4106543f75f5eafdb5ce6c66240699d26e8))
* **settings:** store API keys securely ([9d94ae7](https://github.com/Orchardxyz/simple-amit/commit/9d94ae7f9aae38c5eea38fe9dd83c5e6f86d24fa))
* **webview:** add settings UI ([c271fae](https://github.com/Orchardxyz/simple-amit/commit/c271faeb4f368e08939b61775b5acc25a82b921a))
* **webview:** add typed settings bridge ([c8043fe](https://github.com/Orchardxyz/simple-amit/commit/c8043fe1a940ab4c3cf00153426856f457e80e4f))
* **webview:** improve AI provider settings ([63166b7](https://github.com/Orchardxyz/simple-amit/commit/63166b7d73d0fb25ef24f7a074d831c17189769f))


### Changed

* **extension:** add brand logo and scm icons ([ad0311f](https://github.com/Orchardxyz/simple-amit/commit/ad0311f44a3d557f4fec7f55d9b27eb4dd7d688b))
* **extension:** refine SCM menu actions ([bfae81f](https://github.com/Orchardxyz/simple-amit/commit/bfae81f689a5d8f21e82bab84d886381aa7168d5))
* update README ([a60d91a](https://github.com/Orchardxyz/simple-amit/commit/a60d91a61a43c2615673b6e5aef28f8451c0296c))
* **webview:** integrate with svelte-sonner ([1ebef46](https://github.com/Orchardxyz/simple-amit/commit/1ebef4676ffd0e7e24fbbbc4e504e7f89f2bcae1))

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
