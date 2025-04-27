---
title: 'Learning rust by building the old terminal game BEAST from 1984, Part 1'
date: '2025-04-26T21:11:29+10:00'
draft: true
summary: >
  I've been teaching rust to a couple of friends and found building this game together helps me teach rust really well
  as it touches many areas of rust and gets them to see results almost instantly.
description: "A rust tutorial on building the old terminal game BEAST from 1984."
toc: true
readTime: true
tags: ["rust", "terminal", "game development", "tutorial"]
showTags: true
hideBackToTop: false
---

![ASCII‐art title screen of the 1984 game BEAST showing the game name, developer credits, copy notice, and status bar with controls](assets/beast.png#center "The intro screen of BEAST")

## What is BEAST

[BEAST](https://en.wikipedia.org/wiki/Beast_(video_game)) is a text-based action game developed for MS-DOS by Dan Baker, Alan Brown, Mark Hamilton, and Derrick Shadel. It was distributed as shareware in 1984.

It is a game I grew up with back when I was young and had a computer and deceptively simple and complicated at the same time.

<iframe src="https://archive.org/embed/Beast_1020" width="560" height="384" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe>

## The Scope of Part 1

What is the goal for this post?

## Setup

repo and tooling setup

## Structure

```rust {hl_lines=[3,"11-13"]}
fn main() {
	let cli_flags = env::args().skip(1).collect::<Vec<String>>();
	if cli_flags.contains(&String::from("--version"))
		|| cli_flags.contains(&String::from("-v"))
		|| cli_flags.contains(&String::from("-V"))
	{
		println!("v{}", env!("CARGO_PKG_VERSION"));
		std::process::exit(0);
	}

	dotenv().ok();
	let mut game = crate::game::Game::new();
	game.play();
}
```

```diff
- let mut game = crate::game::Game::new();
+ dotenv().ok();
```

## A Brief Intro into ANSI Escape Sequences

## Rendering

## Listening to `stdin`

## Generating the terrain

## Pushing blocks
