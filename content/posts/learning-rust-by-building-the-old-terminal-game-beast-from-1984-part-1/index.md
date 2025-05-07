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
and computer monitors were monochrome emitted radiation)_.

<iframe src="https://archive.org/embed/Beast_1020" width="560" height="384" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe>

To get a feel for the game, play it in the iframe above or on [archive.org](https://archive.org/embed/Beast_1020)
directly.

But generally, it's simple:

![Animated scene from the 1984 ASCII game BEAST, showing a blue diamond-shaped player character navigating a maze-like environment made of green block clusters, avoiding obstacles and moving toward a yellow target area in the top right
corner.
The screen features a classic DOS-style black background with retro text-based graphics](assets/movements.gif#small)

- You're a player on a 2D board `◀▶`
- It contains blocks you can push `░░`
- And blocks you can't push `▓▓`
- There are beasts trying to get you `├┤`
- To win you have to squish the beasts between two blocks `◀▶░░├┤░░`

![The player moves a blue diamond character to push a wall block, crushing a red H-shaped beast between two blocks](assets/squish.gif#small)

There are more advanced challenges in later levels but for this tutorial we will focus only on the basics so you can add
your own levels later.

## Setup

Let's build a terminal game in rust!
We start by creating our rust project:

```sh {lineNos=false}
cargo new beast
cd beast
```

This will create a new rust project named `beast` with a binary target:

```sh {lineNos=false}
.
├── Cargo.toml
└── src
    └── main.rs
```

Cargo has two [entry points](https://doc.rust-lang.org/stable/cargo/reference/cargo-targets.html?highlight=library#cargo-targets)
for its crates and you can choose either or both in your project:
- a binary, the `main.rs` file with a `main()` function which executes when you run the program
- a library, the `lib.rs` file which can be imported by other crates

For a game we don't really need a library, so we will focus on the binary and `cargo new` will default to a binary
target.

Our `Cargo.toml` file in the root is like the `package.json` file of our project:

```toml
[package]
name = "beast"
version = "0.1.0"
edition = "2024"

[dependencies]
```

We have our `name` and `version` set for us and something called `edition`.
[The edition](https://doc.rust-lang.org/edition-guide/editions/index.html) is the version of the rust language we want
to use and `2024` is the latest as of this writing.

Our `src/main.rs` file is our entrypoint.
This is where we will call our game logic and define our modules.

```rust
fn main() {
	println!("Hello, world!");
}
```

Let's take our crate for a spin:
```sh {lineNos=false}
cargo run
   Compiling beast v0.1.0 (/Users/code/beast)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.34s
     Running `target/debug/beast`
Hello, world!
```

Look at us!
Building binaries and executing them like we've never done anything else.
<span role="img" aria-label="High five hands" tabIndex="0" class="emoji">🙌</span>

## The Board

Ok let's start thinking about our board

![Screenshot from the 1984 ASCII game BEAST. The screen is filled with a grid of green and yellow blocky patterns representing movable blocks and solid blocks. The player, shown as a cyan diamond shape, is located in the bottom-left corner. Several red 'H' characters, representing hostile beasts, are scattered on the right side of the screen. The game has a dark black background bordered by a yellow frame, with the environment laid out in a procedurally generated maze-like pattern.](assets/board.png "How do we want to represent it in code, where's the source of truth, how do we render it and all that while keeping our sanity?")

There are a couple of ways we could approach this.
You could create instances of each tile you expect on the board, give each of them a position and a way to represent
themselves and in the render function we just iterate over each entity and place them on a temporary buffer that then
gets to be iterated over to form a String we simply print to [`stdout`](https://en.wikipedia.org/wiki/Standard_streams).
This is indeed a good way to approach this for a game with a large number of entities which all require instances
to keep track of their own states.

But our board isn't very large, our blocks don't really need state and we have way more blocks than beasts.
Beasts need state to keep moving and path find their way to the player and the player itself should probably remember
where it is.
Knowing that we could simplify the approach above by skipping instances for blocks going straight to keeping a buffer of
the board in memory and in the rendered simply iterate over it and print it to stdout.

So we could represent the buffer of our board as a two dimensional array of tiles.
Each inner array represents a row of tiles and contains all its columns:

`[[Tile; BOARD_WIDTH]; BOARD_HEIGHT]`

The render function would iterate over the the array and print a new line for each row.

Ok this was a lot of text, let's get out of our heads and into coding.

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
