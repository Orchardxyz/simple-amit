# Webview Design Principles

## Scope

This document defines visual and interaction conventions for the Simple Amit Webview.

## Direction

- Make the Webview feel like a focused VS Code tool, not a marketing page.
- Use VS Code theme variables as the color, typography, and surface foundation.
- Keep the interface compact, quiet, and task-oriented.

## Layout

- Prefer simple forms, panels, lists, tabs, and grouped controls.
- Avoid large heroes, oversized headings, nested cards, and decorative sections.
- Use whitespace for readability, not for landing-page drama.

## Components

- Prefer native HTML controls and small Svelte components.
- Use icons for common actions when they improve scanability.
- Keep controls predictable, keyboard-friendly, and close to their feedback.

## Styling

- Use Tailwind CSS v4 utilities with VS Code CSS variables.
- Keep color usage restrained and theme-compatible.
- Support dark, light, and high-contrast themes.

## Anti-patterns

- Landing-page composition
- Decorative gradients, blobs, or ornamental backgrounds
- Purple-outline-everything styling
- UI text explaining obvious UI behavior
- Webview visuals that fight the active VS Code theme
