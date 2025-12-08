/**
 * HoloBridge Hosting CLI
 * 
 * Entry point for the TUI application.
 */

import React from 'react';
import { render } from 'ink';
import { App } from './tui/app.js';

// Clear screen and render
console.clear();

render(<App />);
