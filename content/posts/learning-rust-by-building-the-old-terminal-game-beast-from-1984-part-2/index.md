---
title: 'An Introduction to Rust by building an old terminal game from 1984, Part 2'
date: '2025-05-21T22:11:29+10:00'
draft: true
visibility: false
summary: >
  In the last post we setup our board and made the player walk around.
  In this post we will generate terrain, push blocks and add the first outlines of our beasts.
description: >
  We are building the terminal game BEAST together to learn to apply Rust to a project.
  This is the second part in which we generate our terrain and learn how to push our blocks.
toc: true
readTime: true
tags: ["rust", "terminal", "game development", "tutorial"]
showTags: true
hideBackToTop: false
header: assets/header.jpg
---

<div class="ribbon"><img alt="Certified organic content, no AI used" src="/img/stamp.svg" title="I'm perfectly able to add my own em dashes, thank you very much!" width="120px" height="120px"></div>

## Where We Left Of

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

## Let's Do Some Cleaning

While we're looking at this, I feel like we should move our `Game` struct into it's own module and only keep shared
types in our `main.rs` file.
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

## Giving it a shuffle

We have our little hardcoded blocks we added in
[the first part of the tutorial](https://dominik-wilkowski.com/posts/learning-rust-by-building-the-old-terminal-game-beast-from-1984-part-1/#taking-the-magic-out-of-coding)
but now we should look into generating our terrain.
We want the terrain to be random each time so that each time we play the game, the challenge is a little different.
How would you do that though?
Let's assume we have a function that generates random numbers for us within a range, how would you go about generating
your coordinates for each block?
Your first insinct might be to just generate a pair of numbers, check if the tile at that coordinate is `Tile::Empty`
and then place it.
It was my first thought too.
But this is pretty inefficient because you're just brute-forcing your way to a full board and could get extraordinarily
unlucky by generating multiple coordinates in a row that are not `Empty` and the more blocks you place on the board, the
higher the chances of collisions like that.

Instead of that, let's just collect every possible coordinate on the board into a colleciton type like a `Vec` and then
shuffle the vector and [pop](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.pop) the last one out one by one
for placing each block.

```rust {data-file="board.rs", data-fold="['1-11', '21-53']", hl_lines=["15-17"]}
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

		let mut all_coords = (0..BOARD_HEIGHT)
			.flat_map(|row| (0..BOARD_WIDTH).map(move |column| (column, row)))
			.collect::<Vec<(usize, usize)>>();

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

`all_coords` now contains every possible position on the board since our board at the start is completely empty.
Now we need to shuffle this vec and for that we will need the [`rand`](https://crates.io/crates/rand) crate.

```console
cargo add rand
<span style="font-weight:bold;color:lime;">    Updating</span> crates.io index
<span style="font-weight:bold;color:lime;">      Adding</span> rand v0.9.1 to dependencies
             Features:
             <span style="font-weight:bold;color:lime;">+</span> alloc
             <span style="font-weight:bold;color:lime;">+</span> os_rng
             <span style="font-weight:bold;color:lime;">+</span> small_rng
             <span style="font-weight:bold;color:lime;">+</span> std
             <span style="font-weight:bold;color:lime;">+</span> std_rng
             <span style="font-weight:bold;color:lime;">+</span> thread_rng
             <span style="font-weight:bold;color:red;">-</span> log
             <span style="font-weight:bold;color:red;">-</span> nightly
             <span style="font-weight:bold;color:red;">-</span> serde
             <span style="font-weight:bold;color:red;">-</span> simd_support
             <span style="font-weight:bold;color:red;">-</span> unbiased
<span style="font-weight:bold;color:lime;">    Updating</span> crates.io index
<span style="font-weight:bold;color:aqua;">    Blocking</span> waiting for file lock on package cache
<span style="font-weight:bold;color:lime;">     Locking</span> 17 packages to latest Rust 1.87.0 compatible versions
<span style="font-weight:bold;color:aqua;">      Adding</span> bitflags v2.9.1
<span style="font-weight:bold;color:aqua;">      Adding</span> cfg-if v1.0.0
<span style="font-weight:bold;color:aqua;">      Adding</span> getrandom v0.3.3
<span style="font-weight:bold;color:aqua;">      Adding</span> libc v0.2.172
<span style="font-weight:bold;color:aqua;">      Adding</span> ppv-lite86 v0.2.21
<span style="font-weight:bold;color:aqua;">      Adding</span> proc-macro2 v1.0.95
<span style="font-weight:bold;color:aqua;">      Adding</span> quote v1.0.40
<span style="font-weight:bold;color:aqua;">      Adding</span> r-efi v5.2.0
<span style="font-weight:bold;color:aqua;">      Adding</span> rand v0.9.1
<span style="font-weight:bold;color:aqua;">      Adding</span> rand_chacha v0.9.0
<span style="font-weight:bold;color:aqua;">      Adding</span> rand_core v0.9.3
<span style="font-weight:bold;color:aqua;">      Adding</span> syn v2.0.101
<span style="font-weight:bold;color:aqua;">      Adding</span> unicode-ident v1.0.18
<span style="font-weight:bold;color:aqua;">      Adding</span> wasi v0.14.2+wasi-0.2.4
<span style="font-weight:bold;color:aqua;">      Adding</span> wit-bindgen-rt v0.39.0
<span style="font-weight:bold;color:aqua;">      Adding</span> zerocopy v0.8.25
<span style="font-weight:bold;color:aqua;">      Adding</span> zerocopy-derive v0.8.25
```

This has added our dependency to our `Cargo.toml`:

```toml {data-file="Cargo.toml"}
[package]
name = "beast"
version = "0.1.0"
edition = "2024"

[dependencies]
rand = "0.9.1"
```

From the `rand` crate we will use the [`SliceRandom`](https://docs.rs/rand/0.9.1/rand/seq/trait.SliceRandom.html) trait
which implements a [`shuffle`](https://docs.rs/rand/0.9.1/rand/seq/trait.SliceRandom.html#tymethod.shuffle) method on
`T` which in our case will be our vec.
Let's use it in our code:

```rust {data-file="board.rs", data-fold="['3-13', '25-57']", hl_lines=[1,"20-21"]}
use rand::seq::SliceRandom;

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

		let mut all_coords = (0..BOARD_HEIGHT)
			.flat_map(|row| (0..BOARD_WIDTH).map(move |column| (column, row)))
			.collect::<Vec<(usize, usize)>>();
		let mut rng = rand::rng();
		all_coords.shuffle(&mut rng);

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

Now `all_coords` contains all coordinates of our board in random order.
Before we continue though, we should remove the player position from the vec since the player is inhabiting a coordinate
on the board and we wouldn't want to overwrite it's position.
But we just shuffled our vec and have no idea where that coordinate now is.
Perhaps it's best to remove the player position from the vec before we shuffle:

```rust {data-file="board.rs", data-fold="['1-13', '26-58']", hl_lines=[19]}
use rand::seq::SliceRandom;

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

		let mut all_coords = (0..BOARD_HEIGHT)
			.flat_map(|row| (0..BOARD_WIDTH).map(move |column| (column, row)))
			.filter(|coord| !(coord.0 == 0 && coord.1 == 0))
			.collect::<Vec<(usize, usize)>>();
		let mut rng = rand::rng();
		all_coords.shuffle(&mut rng);

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

Removing our player position before we collect our `all_coords` iterator into a vec also means rust can do some
optimizations on the filter.

Ok now we have a complete set of coordinates, blocks could be placed on and we should start placing some blocks:

```rust {data-file="board.rs", data-fold="['1-13', '33-65']", hl_lines=["24-29"]}
use rand::seq::SliceRandom;

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

		let mut all_coords = (0..BOARD_HEIGHT)
			.flat_map(|row| (0..BOARD_WIDTH).map(move |column| (column, row)))
			.filter(|coord| !(coord.0 == 0 && coord.1 == 0))
			.collect::<Vec<(usize, usize)>>();
		let mut rng = rand::rng();
		all_coords.shuffle(&mut rng);

		for _ in 0..50 {
			let coord = all_coords.pop().expect(
				"We tried to place more blocks then there were avaiable spaces on the board",
			);
			buffer[coord.1][coord.0] = Tile::Block;
		}

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

We create a loop from `0` to `50` and in each iteration `pop` off the last item from our shuffled `all_coords` vec and
use it to place a `Tile::Block` on the `buffer`.
We use [`except`](https://doc.rust-lang.org/std/option/enum.Option.html#method.expect) because `pop` returns an
[`Option`](https://doc.rust-lang.org/std/option/enum.Option.html) because `pop` could very well fail when there is
nothing left in our vec.
Normally we would deal with the error case gracefully and not throw a `panic` but in this case we should stop our game
and throw our hands up because we tried to place more blocks than there are empty tiles so I think it's ok to panic
here.
Also note that we're doing `buffer[coord.1][coord.0]` and not `buffer[coord.0][coord.1]` because the second argument in
our coord tuple is the `row` and the first is the `column` and in our buffer it's the other way around.
We will have to keep that in mind and I certainly have already mixed this up about three times.

When we run our binary, we get something similar to this:

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/dominik/Desktop/beast)
<span style="font-weight:bold;color:lime;">    Finished</span> `dev` profile [unoptimized + debuginfo] target(s) in 0.17s
<span style="font-weight:bold;color:lime;">     Running</span> `target/debug/beast`
<span style="color:yellow;">▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜</span>
<span style="color:yellow;">▌</span>                                                                            <span style="color:lime;">░░</span><span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                  <span style="color:lime;">░░</span><span style="color:lime;">░░</span>    <span style="color:lime;">░░</span>                                                  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                    <span style="color:lime;">░░</span>          <span style="color:lime;">░░</span>  <span style="color:lime;">░░</span>        <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                              <span style="color:lime;">░░</span>    <span style="color:lime;">░░</span>              <span style="color:lime;">░░</span>      <span style="color:lime;">░░</span>            <span style="color:lime;">░░</span>  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                  <span style="color:lime;">░░</span>      <span style="color:lime;">░░</span>          <span style="color:lime;">░░</span>                        <span style="color:lime;">░░</span>        <span style="color:lime;">░░</span>  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>          <span style="color:lime;">░░</span>                                                                  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                    <span style="color:lime;">░░</span>    <span style="color:lime;">░░</span><span style="color:lime;">░░</span><span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>            <span style="color:lime;">░░</span>                                              <span style="color:lime;">░░</span><span style="color:lime;">░░</span>  <span style="color:lime;">░░</span>          <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                              <span style="color:lime;">░░</span>      <span style="color:lime;">░░</span>                            <span style="color:lime;">░░</span>        <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>  <span style="color:lime;">░░</span>                                  <span style="color:lime;">░░</span>                      <span style="color:lime;">░░</span>              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                              <span style="color:lime;">░░</span>  <span style="color:lime;">░░</span>                                        <span style="color:lime;">░░</span><span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                  <span style="color:lime;">░░</span>                                          <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                    <span style="color:lime;">░░</span>                      <span style="color:lime;">░░</span>            <span style="color:lime;">░░</span>                  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>      <span style="color:lime;">░░</span>            <span style="color:lime;">░░</span>                        <span style="color:lime;">░░</span>                    <span style="color:lime;">░░</span>        <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span><span style="color:lime;">░░</span>    <span style="color:lime;">░░</span>              <span style="color:lime;">░░</span>                                            <span style="color:lime;">░░</span>  <span style="color:lime;">░░</span>    <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                          <span style="color:lime;">░░</span>  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                      <span style="color:lime;">░░</span>                                      <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                            <span style="color:lime;">░░</span>                                                <span style="color:yellow;">▐</span>
<span style="color:yellow;">▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟</span>
```

This is great!
Let's do the same thing again for `StaticBlocks`:

```rust {data-file="board.rs", data-fold="['1-13', '40-72']", hl_lines=["31-36"]}
use rand::seq::SliceRandom;

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

		let mut all_coords = (0..BOARD_HEIGHT)
			.flat_map(|row| (0..BOARD_WIDTH).map(move |column| (column, row)))
			.filter(|coord| !(coord.0 == 0 && coord.1 == 0))
			.collect::<Vec<(usize, usize)>>();
		let mut rng = rand::rng();
		all_coords.shuffle(&mut rng);

		for _ in 0..50 {
			let coord = all_coords.pop().expect(
				"We tried to place more blocks then there were avaiable spaces on the board",
			);
			buffer[coord.1][coord.0] = Tile::Block;
		}

		for _ in 0..5 {
			let coord = all_coords.pop().expect(
				"We tried to place more static blocks then there were avaiable spaces on the board",
			);
			buffer[coord.1][coord.0] = Tile::StaticBlock;
		}

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

And this now really makes our board look awesome:

```console
cargo run
<span style="font-weight:bold;color:lime;">    Finished</span> `dev` profile [unoptimized + debuginfo] target(s) in 0.05s
<span style="font-weight:bold;color:lime;">     Running</span> `target/debug/beast`
<span style="color:yellow;">▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜</span>
<span style="color:yellow;">▌</span>                      <span style="color:lime;">░░</span>                        <span style="color:lime;">░░</span>                    <span style="color:lime;">░░</span><span style="color:lime;">░░</span>    <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                            <span style="color:lime;">░░</span>      <span style="color:yellow;">▓▓</span>                              <span style="color:lime;">░░</span>        <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>  <span style="color:yellow;">▓▓</span>                      <span style="color:lime;">░░</span>                          <span style="color:lime;">░░</span>                      <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                            <span style="color:lime;">░░</span>      <span style="color:lime;">░░</span>                    <span style="color:lime;">░░</span>                  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                      <span style="color:lime;">░░</span><span style="color:lime;">░░</span>                    <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                      <span style="color:lime;">░░</span>        <span style="color:lime;">░░</span>                  <span style="color:lime;">░░</span>  <span style="color:lime;">░░</span>                    <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>    <span style="color:lime;">░░</span>                  <span style="color:lime;">░░</span>    <span style="color:lime;">░░</span>                                  <span style="color:lime;">░░</span>          <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span><span style="color:lime;">░░</span>    <span style="color:lime;">░░</span>                      <span style="color:lime;">░░</span>                    <span style="color:yellow;">▓▓</span>                        <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                <span style="color:lime;">░░</span>                                            <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>          <span style="color:lime;">░░</span>                                                                  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                      <span style="color:lime;">░░</span>        <span style="color:lime;">░░</span>                        <span style="color:lime;">░░</span>                <span style="color:lime;">░░</span><span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                        <span style="color:lime;">░░</span><span style="color:lime;">░░</span>    <span style="color:lime;">░░</span>                            <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                      <span style="color:lime;">░░</span>        <span style="color:lime;">░░</span>      <span style="color:yellow;">▓▓</span>                                    <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                      <span style="color:yellow;">▓▓</span>      <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>  <span style="color:lime;">░░</span>      <span style="color:lime;">░░</span><span style="color:lime;">░░</span>            <span style="color:lime;">░░</span>      <span style="color:lime;">░░</span>                  <span style="color:lime;">░░</span>                      <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                  <span style="color:lime;">░░</span>          <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                <span style="color:lime;">░░</span>                                          <span style="color:lime;">░░</span>        <span style="color:lime;">░░</span>      <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>          <span style="color:lime;">░░</span>                                                                  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>    <span style="color:lime;">░░</span>                                <span style="color:lime;">░░</span>                      <span style="color:lime;">░░</span>      <span style="color:lime;">░░</span>      <span style="color:yellow;">▐</span>
<span style="color:yellow;">▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟</span>
```

Finishing touches: we add our player back on the board:

```rust {data-file="board.rs", data-fold="['1-13', '42-74']", hl_lines=[24]}
use rand::seq::SliceRandom;

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

		let mut all_coords = (0..BOARD_HEIGHT)
			.flat_map(|row| (0..BOARD_WIDTH).map(move |column| (column, row)))
			.filter(|coord| !(coord.0 == 0 && coord.1 == 0))
			.collect::<Vec<(usize, usize)>>();
		let mut rng = rand::rng();
		all_coords.shuffle(&mut rng);

		buffer[0][0] = Tile::Player;

		for _ in 0..50 {
			let coord = all_coords.pop().expect(
				"We tried to place more blocks then there were avaiable spaces on the board",
			);
			buffer[coord.1][coord.0] = Tile::Block;
		}

		for _ in 0..5 {
			let coord = all_coords.pop().expect(
				"We tried to place more static blocks then there were avaiable spaces on the board",
			);
			buffer[coord.1][coord.0] = Tile::StaticBlock;
		}

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

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/dominik/Desktop/beast)
<span style="font-weight:bold;color:lime;">    Finished</span> `dev` profile [unoptimized + debuginfo] target(s) in 0.28s
<span style="font-weight:bold;color:lime;">     Running</span> `target/debug/beast`
<span style="color:yellow;">▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜</span>
<span style="color:yellow;">▌</span><span style="color:aqua;">◀▶</span>              <span style="color:lime;">░░</span>                        <span style="color:lime;">░░</span>        <span style="color:lime;">░░</span>                        <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                              <span style="color:lime;">░░</span>                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>        <span style="color:lime;">░░</span>          <span style="color:lime;">░░</span><span style="color:lime;">░░</span>    <span style="color:lime;">░░</span>                                <span style="color:yellow;">▓▓</span>  <span style="color:lime;">░░</span>          <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>  <span style="color:lime;">░░</span>                                                                          <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                      <span style="color:lime;">░░</span>      <span style="color:lime;">░░</span>          <span style="color:lime;">░░</span><span style="color:lime;">░░</span><span style="color:lime;">░░</span>              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                  <span style="color:lime;">░░</span>          <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                  <span style="color:lime;">░░</span>                      <span style="color:lime;">░░</span>                  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>        <span style="color:lime;">░░</span>                <span style="color:lime;">░░</span>                <span style="color:lime;">░░</span>                <span style="color:lime;">░░</span>  <span style="color:lime;">░░</span>          <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                    <span style="color:lime;">░░</span>        <span style="color:lime;">░░</span>      <span style="color:lime;">░░</span>      <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                        <span style="color:lime;">░░</span>      <span style="color:lime;">░░</span>                      <span style="color:lime;">░░</span>                    <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                <span style="color:lime;">░░</span>                              <span style="color:lime;">░░</span>            <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span><span style="color:lime;">░░</span>                                                                            <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span><span style="color:lime;">░░</span>                                              <span style="color:lime;">░░</span>                            <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                <span style="color:lime;">░░</span>            <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>  <span style="color:lime;">░░</span>                <span style="color:lime;">░░</span>                                                        <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                <span style="color:yellow;">▓▓</span>                                                          <span style="color:yellow;">▓▓</span><span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                          <span style="color:lime;">░░</span>                                                  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                <span style="color:lime;">░░</span>    <span style="color:lime;">░░</span>            <span style="color:lime;">░░</span><span style="color:lime;">░░</span>          <span style="color:yellow;">▓▓</span>                  <span style="color:lime;">░░</span>      <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>          <span style="color:lime;">░░</span><span style="color:lime;">░░</span>    <span style="color:yellow;">▓▓</span>    <span style="color:lime;">░░</span>              <span style="color:lime;">░░</span>                            <span style="color:lime;">░░</span>  <span style="color:lime;">░░</span><span style="color:lime;">░░</span><span style="color:yellow;">▐</span>
<span style="color:yellow;">▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟</span>
```

## Hardcoded values?

Our board now looks like the real thing but we got some hard-coded values in our code that probably needs to change
depending on what level of the game we are in right?
The idea is that in later levels the `Block` tiles are reduced and the `StaticBlocks` increased to give us fewer
opportunities to squish the beasts, making each level a little harder.
Thus we need to find a way to change the number of blocks and static blocks for each level.

Ok that's fair, let's create a function on our `Game` struct that returns a level config with the block and static block
counts and use it in our `new` method:

## Which One Is Row And Which Column?

Indexing Into Our Board

## A Hungry Hungry Player

Let's stop the player from eating everything on the board.

## Implementing The Blockchain

## Adding Beasts

<br><br><br>
![A vintage-style roadside billboard features a sleazy-looking man with slicked-back hair and a smug expression,
pointing directly at the viewer. He's wearing a brown pinstripe suit with a shiny tie. The billboard background is a
dull yellow, and large red block letters read: "SHARE THIS POST." The overall tone mimics tacky 1980s lawyer ads, with
an intentionally over-the-top, untrustworthy vibe.](assets/share.png)
