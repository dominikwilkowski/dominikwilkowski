---
title: 'An Introduction to Rust by building an old terminal game from 1984, Part 2'
date: '2025-05-21T22:11:29+10:00'
draft: true
visibility: false
summary: >
  In the last post we setup our board and made the player walk around.
  In this post we will generate terrain, push blocks and add the first outlines of our beasts.
description: "We are building the terminal game BEAST together to learn to apply Rust to a project."
toc: true
readTime: true
tags: ["rust", "terminal", "game development", "tutorial"]
showTags: true
hideBackToTop: false
header: assets/header.jpg
---

<div class="ribbon"><img alt="Certified organic content, no AI used" src="/img/stamp.svg" title="I'm perfectly able to add my own em dashes, thank you very much!" width="120px" height="120px"></div>

## Where we left of

In [part 1 of this tutorial](../learning-rust-by-building-the-old-terminal-game-beast-from-1984-part-1/), we ended up
with a couple modules that got us to this:

![A screen recording of the board with the player walking around randomly also over Blocks and StaticBlocks and erasing
them as we leave their tile.](../learning-rust-by-building-the-old-terminal-game-beast-from-1984-part-1/assets/moving.svg)

```console
.
├── Cargo.lock
├── Cargo.toml
└── src
    ├── board.rs
    ├── main.rs
    ├── player.rs
    └── raw_mode.rs
```

```toml {data-file="Cargo.toml"}
[package]
name = "beast"
version = "0.1.0"
edition = "2024"

[dependencies]
```

The `main.rs` contains a couple shared consts and enums and the `Game` struct which takes care of starting the game:

```rust {data-file="main.rs"}
use std::io::{Read, stdin};

mod board;
mod player;
mod raw_mode;

use crate::{board::Board, player::Player, raw_mode::RawMode};

pub const BOARD_WIDTH: usize = 39;
pub const BOARD_HEIGHT: usize = 20;
pub const TILE_SIZE: usize = 2;

pub const ANSI_YELLOW: &str = "\x1B[33m";
pub const ANSI_GREEN: &str = "\x1B[32m";
pub const ANSI_CYAN: &str = "\x1B[36m";
pub const ANSI_RESET: &str = "\x1B[39m";

#[derive(Copy, Clone, Debug)]
pub enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

pub enum Direction {
	Up,
	Right,
	Down,
	Left,
}

#[derive(Debug)]
struct Game {
	board: Board,
	player: Player,
}

impl Game {
	fn new() -> Self {
		Self {
			board: Board::new(),
			player: Player::new(),
		}
	}

	fn play(&mut self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];
		println!("{}", self.board.render());

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					self.player.advance(&mut self.board, Direction::Up);
				},
				'd' => {
					self.player.advance(&mut self.board, Direction::Right);
				},
				's' => {
					self.player.advance(&mut self.board, Direction::Down);
				},
				'a' => {
					self.player.advance(&mut self.board, Direction::Left);
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}

			println!("\x1B[{}F{}", BOARD_HEIGHT + 1 + 1, self.board.render());
		}
	}
}

fn main() {
	let _raw_mode = RawMode::enter();

	let mut game = Game::new();
	game.play();
}
```

Our `board.rs` file contains the `Board` struct which implements a way to render it:

```rust {data-file="board.rs"}
use crate::{
	ANSI_CYAN, ANSI_GREEN, ANSI_RESET, ANSI_YELLOW, BOARD_HEIGHT, BOARD_WIDTH,
	TILE_SIZE, Tile,
};

#[derive(Debug)]
pub struct Board {
	pub buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	pub fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		buffer[0][0] = Tile::Player;
		buffer[2][5] = Tile::Block;
		buffer[2][6] = Tile::Block;
		buffer[2][7] = Tile::Block;
		buffer[3][6] = Tile::StaticBlock;

		Self { buffer }
	}

	pub fn render(&self) -> String {
		let mut output = format!(
			"{ANSI_YELLOW}▛{}▜{ANSI_RESET}\n",
			"▀".repeat(BOARD_WIDTH * TILE_SIZE)
		);

		for rows in self.buffer {
			output.push_str(&format!("{ANSI_YELLOW}▌{ANSI_RESET}"));
			for tile in rows {
				match tile {
					Tile::Empty => output.push_str("  "),
					Tile::Player => {
						output.push_str(&format!("{ANSI_CYAN}◀▶{ANSI_RESET}"))
					},
					Tile::Block => {
						output.push_str(&format!("{ANSI_GREEN}░░{ANSI_RESET}"))
					},
					Tile::StaticBlock => {
						output.push_str(&format!("{ANSI_YELLOW}▓▓{ANSI_RESET}"))
					},
				}
			}
			output.push_str(&format!("{ANSI_YELLOW}▐{ANSI_RESET}\n"));
		}
		output.push_str(&format!(
			"{ANSI_YELLOW}▙{}▟{ANSI_RESET}",
			"▄".repeat(BOARD_WIDTH * TILE_SIZE)
		));

		output
	}
}
```

The `player.rs` module contains the `Player` struct which is responsible for the player movements:

```rust {data-file="player.rs"}
use crate::{Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: (usize, usize),
}

impl Player {
	pub fn new() -> Self {
		Self { position: (0, 0) }
	}

	pub fn advance(&mut self, board: &mut Board, direction: Direction) {
		board.buffer[self.position.1][self.position.0] = Tile::Empty;

		match direction {
			Direction::Up => self.position.1 -= 1,
			Direction::Right => self.position.0 += 1,
			Direction::Down => self.position.1 += 1,
			Direction::Left => self.position.0 -= 1,
		}

		board.buffer[self.position.1][self.position.0] = Tile::Player;
	}
}
```

And lastly we have a `raw_mode` module that makes it easy for us to switch our terminal from `cooked mode` into `raw mode`:

```rust {data-file="raw_mode.rs"}
use std::process::Command;

pub struct RawMode;

impl RawMode {
	pub fn enter() -> Self {
		let _ = Command::new("stty")
			.arg("-icanon")
			.arg("-echo")
			.spawn()
			.and_then(|mut child| child.wait());
		print!("\x1b[?25l");
		Self
	}
}

impl Drop for RawMode {
	fn drop(&mut self) {
		let _ = Command::new("stty")
			.arg("icanon")
			.arg("echo")
			.spawn()
			.and_then(|mut child| child.wait());
		print!("\x1b[?25h");
	}
}
```

While we're looking at this I feel like we should move our `Game` struct into it's own module and only keep shared types
in our `main.rs` file.
It's probably more of a personal preference but I like to keep the `main.rs` file as clean as possible since it's the
entry point to our binary and is responsible for orchestrating everything together rather than implementing logic.

```console
.
├── Cargo.lock
├── Cargo.toml
└── src
    ├── board.rs
    ├── game.rs
    ├── main.rs
    ├── player.rs
    └── raw_mode.rs
```

```rust {data-file="game.rs"}
use std::io::{Read, stdin};

use crate::{BOARD_HEIGHT, Direction, board::Board, player::Player};

#[derive(Debug)]
struct Game {
	board: Board,
	player: Player,
}

impl Game {
	fn new() -> Self {
		Self {
			board: Board::new(),
			player: Player::new(),
		}
	}

	fn play(&mut self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];
		println!("{}", self.board.render());

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					self.player.advance(&mut self.board, Direction::Up);
				},
				'd' => {
					self.player.advance(&mut self.board, Direction::Right);
				},
				's' => {
					self.player.advance(&mut self.board, Direction::Down);
				},
				'a' => {
					self.player.advance(&mut self.board, Direction::Left);
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}

			println!("\x1B[{}F{}", BOARD_HEIGHT + 1 + 1, self.board.render());
		}
	}
}
```

And include it in our `main.rs` file:

```rust {data-file="main.rs", data-fold="['8-37']", hl_lines=[2, 6]}
mod board;
mod game;
mod player;
mod raw_mode;

use crate::{game::Game, raw_mode::RawMode};

pub const BOARD_WIDTH: usize = 39;
pub const BOARD_HEIGHT: usize = 20;
pub const TILE_SIZE: usize = 2;

pub const ANSI_YELLOW: &str = "\x1B[33m";
pub const ANSI_GREEN: &str = "\x1B[32m";
pub const ANSI_CYAN: &str = "\x1B[36m";
pub const ANSI_RESET: &str = "\x1B[39m";

#[derive(Copy, Clone, Debug)]
pub enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

pub enum Direction {
	Up,
	Right,
	Down,
	Left,
}

fn main() {
	let _raw_mode = RawMode::enter();

	let mut game = Game::new();
	game.play();
}
```

After running `cargo run` we get an error:

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/dominik/Desktop/beast)
<span style="font-weight:bold;color:red;">error[E0603]</span><span style="font-weight:bold;">: struct `Game` is private</span>
 <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:6:19
  <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">6</span> <span style="font-weight:bold;color:#3333FF;">|</span> use crate::{game::Game, raw_mode::RawMode};
  <span style="font-weight:bold;color:#3333FF;">|</span>                   <span style="font-weight:bold;color:red;">^^^^</span> <span style="font-weight:bold;color:red;">private struct</span>
  <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:lime;">note</span>: the struct `Game` is defined here
 <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/game.rs:6:1
  <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">6</span> <span style="font-weight:bold;color:#3333FF;">|</span> struct Game {
  <span style="font-weight:bold;color:#3333FF;">|</span> <span style="font-weight:bold;color:lime;">^^^^^^^^^^^</span>

<span style="font-weight:bold;">For more information about this error, try `rustc --explain E0603`.</span>
<span style="font-weight:bold;color:red;">error</span><span style="font-weight:bold;">:</span> could not compile `beast` (bin &quot;beast&quot;) due to 1 previous error
```

So we need to make our `Game` struct public because it's now in a different module.
But we realize that also is true for our `new` and `play` method, even though rust isn't showing us these errors yet.
But we know our friend well and so let's just make all three of them public:

```rust {data-file="main.rs", data-fold="['25-49']", hl_lines=[6, 12, 19]}
use std::io::{Read, stdin};

use crate::{BOARD_HEIGHT, Direction, board::Board, player::Player};

#[derive(Debug)]
pub struct Game {
	board: Board,
	player: Player,
}

impl Game {
	pub fn new() -> Self {
		Self {
			board: Board::new(),
			player: Player::new(),
		}
	}

	pub fn play(&mut self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];
		println!("{}", self.board.render());

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					self.player.advance(&mut self.board, Direction::Up);
				},
				'd' => {
					self.player.advance(&mut self.board, Direction::Right);
				},
				's' => {
					self.player.advance(&mut self.board, Direction::Down);
				},
				'a' => {
					self.player.advance(&mut self.board, Direction::Left);
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}

			println!("\x1B[{}F{}", BOARD_HEIGHT + 1 + 1, self.board.render());
		}
	}
}
```

This all compiles again and our `main.rs` file is much cleaner.

## Generate Terrain

## Indexing into our board

## Stop Eating Obsticals

## Moving a Blockchain

## Adding Beasts

<br><br><br>
![A vintage-style roadside billboard features a sleazy-looking man with slicked-back hair and a smug expression,
pointing directly at the viewer. He's wearing a brown pinstripe suit with a shiny tie. The billboard background is a
dull yellow, and large red block letters read: "SHARE THIS POST." The overall tone mimics tacky 1980s lawyer ads, with
an intentionally over-the-top, untrustworthy vibe.](assets/share.png)
