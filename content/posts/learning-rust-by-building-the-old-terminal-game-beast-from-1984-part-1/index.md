---
title: 'Learning rust by building the old terminal game BEAST from 1984, Part 1'
date: '2025-04-26T21:11:29+10:00'
draft: true
summary: >
  I've found building the BEAST game from 1984 helped me teach rust as it touches many concepts of rust and gets us to
  something visible quickly.
description: "A rust tutorial on building the old terminal game BEAST from 1984."
toc: true
readTime: true
tags: ["rust", "terminal", "game development", "tutorial"]
showTags: true
hideBackToTop: false
header: assets/header.jpg
---

## Intro

I've been teaching rust to a couple of friends and colleagues in lots of different ways.

In the latest sessions, I've been using [this game I just finished building](https://github.com/dominikwilkowski/beast)
as the project we're building together with great success.
It allows us to see results very fast, it's fun to work on as you can add your own spin and it happens to touch on a lot
of the important aspects of the language.
So I thought I write it up in a series of blog posts... and here we are.

A small note at the start: I'm by no means an expert in rust. I love the language and continue to learn so if you find
anything fishy in these posts (and it's not a _turbofish_), do let me know by submitting
[a pull request or an issue](https://github.com/dominikwilkowski/dominikwilkowski).

## Prerequisites

I will assume you have some basic knowledge of rust and won't go too deep into language features.
What I want to focus on is the use of the language for something you can see and play with.
This is how I learn.

It's not just knowing what each of the bits are in the language, it's how you use them and how it
all comes together.

But if you don't know the bits, I recommend you start with the [official book](https://doc.rust-lang.org/book/).
And if you're so inclined, do have a look at [easy_rust](github.com/Dhghomon/easy_rust) which is a great way to learn
rust as it is organized in small chapters not longer than 20min each with videos in plain language.
Lastely you should check out [rustlings](https://github.com/rust-lang/rustlings) to get a feel for the language.

## What we're building

[BEAST](https://en.wikipedia.org/wiki/Beast_(video_game)) is a text-based action game developed for MS-DOS by Dan Baker, Alan Brown, Mark Hamilton, and Derrick Shadel. It was distributed as shareware in 1984.

It's a game I grew up with back when I was young _(and everything was still black and white, there were no mobile phones
and computers were monochrome)_.

<iframe src="https://archive.org/embed/Beast_1020" width="560" height="384" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe>

To get a feel for the game, play it in the iframe above or on [archive.org](https://archive.org/embed/Beast_1020)
directly.

But generally, it's simple:

![Animated scene from the 1984 ASCII game BEAST, showing a blue diamond-shaped player character navigating a maze-like environment made of green block clusters, avoiding obstacles and moving toward a yellow target area in the top right corner. The screen features a classic DOS-style black background with retro text-based graphics](assets/board.gif#small)

- You're a player on a 2D board `◀▶`
- It contains blocks you can push `░░`
- And blocks you can't push `▓▓`
- There are beasts trying to get you `├┤`
- To win you have to squish the beasts between two blocks `◀▶░░├┤░░`

![The player moves a blue diamond character to push a wall block, crushing a red H-shaped beast between two blocks](assets/squish.gif#small)

There are more advanced challenges in later levels but for this tutorial we will focus only on the basics so you can add
your own levels later.

## The Scope of Part 1

In the first part of this series we will focus on just rendering the game board and moving the player.
We will end up re-writing a couple sections as we go because I don't just want to tell you what to write, I want you to
understand why we write it like this.

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
