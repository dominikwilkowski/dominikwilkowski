---
title: 'Learning Rust By Building The Old Terminal Game Beast From 1984, Part 2'
date: '2025-06-06T20:03:35+10:00'
draft: false
visibility: false
summary: >
  In the last post we set up our board and made the player walk around.
  In this post we will generate terrain for each level and implement a way for the player to push blocks.
description: >
  We are building the terminal game BEAST together to learn how to apply Rust to a project.
  This is the second part in which we generate our terrain and learn how to push blocks.
toc: true
readTime: true
tags: ["rust", "terminal", "game development", "tutorial"]
showTags: true
hideBackToTop: false
header: assets/header.jpg
---

<div class="ribbon"><img alt="Certified organic content, no AI used" src="/img/stamp.svg" title="I'm perfectly able to add my own em dashes, thank you very much!" width="120px" height="120px"></div>

## Where We Left Off

In [part 1 of this tutorial](../learning-rust-by-building-the-old-terminal-game-beast-from-1984-part-1/), we ended up
with a couple of modules that got us to this:

![A screen recording of the board with the player walking around randomly including over Blocks and StaticBlocks and
erasing them as they walk over the tiles.](../learning-rust-by-building-the-old-terminal-game-beast-from-1984-part-1/assets/moving.svg)

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

Our `board.rs` file contains the `Board` struct with a few hardcoded obstacles and a method to render it all:

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
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Direction, Tile, board::Board};

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
			Direction::Up => {
				if self.position.1 > 0 {
					self.position.1 -= 1
				}
			},
			Direction::Right => {
				if self.position.0 < BOARD_WIDTH - 1 {
					self.position.0 += 1
				}
			},
			Direction::Down => {
				if self.position.1 < BOARD_HEIGHT - 1 {
					self.position.1 += 1
				}
			},
			Direction::Left => {
				if self.position.0 > 0 {
					self.position.0 -= 1
				}
			},
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

While we're looking at this, I feel like we should move our `Game` struct into its own module and only keep shared
types in our `main.rs` file.
It's probably more of a personal preference but I like to keep the `main.rs` file as clean as possible since it's the
entry point to our binary and is responsible for orchestrating everything together rather than implementing logic.

```console
.
├── Cargo.lock
├── Cargo.toml
└── src
    ├── board.rs
<span class="console-add">    ├── game.rs</span>
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
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/code/beast)
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
But we realize that also is true for our `new` and `play` method, even though Rust isn't showing us these errors yet.
But we know our friend well and so let's just make all three of them public:

```rust {data-file="game.rs", data-fold="['25-49']", hl_lines=[6, 12, 19]}
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
We want the terrain to be random each time so that when we play the game, the challenge is always a little different.
How would you do that, though?
Let's assume we have a function that generates random numbers for us within a range, how would you go about generating
your coordinates for each block?
Your first instinct might be to just generate a pair of numbers, check if the tile at that coordinate is `Tile::Empty`
and then place it.
It was my first thought too.
But this is pretty inefficient because you're just brute-forcing your way to a full board and could get extraordinarily
unlucky by generating multiple coordinates in a row that are not `Empty` and the more blocks you place on the board, the
higher the chances of collisions like that.

Instead of that, let's just collect every possible coordinate on the board into a collection type like a `Vec` and then
shuffle the vector and [`pop`](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.pop) the last one out, one by one
to place each block.
That way we guarantee that each pick only exists once and is `Empty` on the board.

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

Removing our player position before we collect our `all_coords` iterator into a vec also means Rust can do some
optimizations on the filter.

OK now we have a complete set of coordinates, blocks could be placed on and we should start placing some blocks:

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
				"We tried to place more blocks than there were available spaces on the board",
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
We use [`expect`](https://doc.rust-lang.org/std/option/enum.Option.html#method.expect) because `pop` returns an
[`Option`](https://doc.rust-lang.org/std/option/enum.Option.html) because `pop` could very well fail when there is
nothing left in our vec.
Normally we would deal with the error case gracefully and not throw a `panic` but in this case we should stop our game
and throw our hands up because we tried to place more blocks than there are empty tiles so I think it's OK to panic
here.
Also note that we're doing `buffer[coord.1][coord.0]` and not `buffer[coord.0][coord.1]` because the second argument in
our coord tuple is the `row` and the first is the `column` and in our buffer it's the other way around.
We will have to keep that in mind and I certainly have already mixed this up about three times.

When we run our binary, we get something similar to this:

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/code/beast)
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
				"We tried to place more blocks than there were available spaces on the board",
			);
			buffer[coord.1][coord.0] = Tile::Block;
		}

		for _ in 0..5 {
			let coord = all_coords.pop().expect(
				"We tried to place more static blocks than there were available spaces on the board",
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

For the finishing touches: we add our player back on the board:

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
				"We tried to place more blocks than there were available spaces on the board",
			);
			buffer[coord.1][coord.0] = Tile::Block;
		}

		for _ in 0..5 {
			let coord = all_coords.pop().expect(
				"We tried to place more static blocks than there were available spaces on the board",
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
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/code/beast)
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

## Which One Was The Row Again?

Our board now looks like the real thing but we've written `buffer[coord.1][coord.0]` a couple times now and have
certainly stumbled writing this a few times.
Everytime I have to ask myself:

> Was it row first or column? How did the buffer work again?
{caption="Me"}

After bumping into this enough times, I think we had enough and should now implement a new `Coord` struct to hold
coordinates.
That way we never have to wonder if `coord.1` was row or column.
Let's add this new struct to the `main.rs` file because, much like `Tile`, it will be used throughout the game:

```rust {data-file="main.rs", data-fold="['1-32', '38-43']", hl_lines=["33-37"]}
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

#[derive(Debug)]
pub struct Coord {
	column: usize,
	row: usize,
}

fn main() {
	let _raw_mode = RawMode::enter();

	let mut game = Game::new();
	game.play();
}
```

We can use that new `Coord` struct in our `player` module now:

```rust {data-file="player.rs", data-fold="[]", hl_lines=[1, 5, 11, 16, "20-21", "25-26", "30-31", "35-36", 41]}
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Coord, Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: Coord,
}

impl Player {
	pub fn new() -> Self {
		Self {
			position: Coord { column: 0, row: 0 },
		}
	}

	pub fn advance(&mut self, board: &mut Board, direction: Direction) {
		board.buffer[self.position.row][self.position.column] = Tile::Empty;

		match direction {
			Direction::Up => {
				if self.position.row > 0 {
					self.position.row -= 1
				}
			},
			Direction::Right => {
				if self.position.column < BOARD_WIDTH - 1 {
					self.position.column += 1
				}
			},
			Direction::Down => {
				if self.position.row < BOARD_HEIGHT - 1 {
					self.position.row += 1
				}
			},
			Direction::Left => {
				if self.position.column > 0 {
					self.position.column -= 1
				}
			},
		}

		board.buffer[self.position.row][self.position.column] = Tile::Player;
	}
}
```

This is much more explicit and while we type a bit more, we know what is what and future us will thank us for it.

We should use our coords also in our board module:

```rust {data-file="board.rs", data-fold="['8-13', '42-74']", hl_lines=[5, "18-20", 30, 37]}
use rand::seq::SliceRandom;

use crate::{
	ANSI_CYAN, ANSI_GREEN, ANSI_RESET, ANSI_YELLOW, BOARD_HEIGHT, BOARD_WIDTH,
	Coord, TILE_SIZE, Tile,
};

#[derive(Debug)]
pub struct Board {
	pub buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	pub fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		let mut all_coords = (0..BOARD_HEIGHT)
			.flat_map(|row| (0..BOARD_WIDTH).map(move |column| Coord { column, row }))
			.filter(|coord| !(coord.column == 0 && coord.row == 0))
			.collect::<Vec<Coord>>();
		let mut rng = rand::rng();
		all_coords.shuffle(&mut rng);

		buffer[0][0] = Tile::Player;

		for _ in 0..50 {
			let coord = all_coords.pop().expect(
				"We tried to place more blocks than there were available spaces on the board",
			);
			buffer[coord.row][coord.column] = Tile::Block;
		}

		for _ in 0..5 {
			let coord = all_coords.pop().expect(
				"We tried to place more static blocks than there were available spaces on the board",
			);
			buffer[coord.row][coord.column] = Tile::StaticBlock;
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

This also made our code more readable but we're noticing we're doing a lot of typing with things like
`buffer[coord.row][coord.column]`.
Having to type this every time we index into our board seems a bit too much.
Luckily Rust gives us the ability to define our own [`Index`](https://doc.rust-lang.org/std/ops/trait.Index.html) trait
to improve this:

```rust {data-file="board.rs", data-fold="['1-7', '28-90']", hl_lines=[8, "15-27"]}
use rand::seq::SliceRandom;

use crate::{
	ANSI_CYAN, ANSI_GREEN, ANSI_RESET, ANSI_YELLOW, BOARD_HEIGHT, BOARD_WIDTH,
	Coord, TILE_SIZE, Tile,
};

use std::ops::{Index, IndexMut};

#[derive(Debug)]
pub struct Board {
	pub buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Index<Coord> for Board {
	type Output = Tile;

	fn index(&self, coord: Coord) -> &Self::Output {
		&self.buffer[coord.row][coord.column]
	}
}

impl IndexMut<Coord> for Board {
	fn index_mut(&mut self, coord: Coord) -> &mut Self::Output {
		&mut self.buffer[coord.row][coord.column]
	}
}

impl Board {
	pub fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		let mut all_coords = (0..BOARD_HEIGHT)
			.flat_map(|row| (0..BOARD_WIDTH).map(move |column| Coord { column, row }))
			.filter(|coord| !(coord.column == 0 && coord.row == 0))
			.collect::<Vec<Coord>>();
		let mut rng = rand::rng();
		all_coords.shuffle(&mut rng);

		buffer[0][0] = Tile::Player;

		for _ in 0..50 {
			let coord = all_coords.pop().expect(
				"We tried to place more blocks than there were available spaces on the board",
			);
			buffer[coord.row][coord.column] = Tile::Block;
		}

		for _ in 0..5 {
			let coord = all_coords.pop().expect(
				"We tried to place more static blocks than there were available spaces on the board",
			);
			buffer[coord.row][coord.column] = Tile::StaticBlock;
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

With the `Index` trait implemented we can now index into our board by simply writing `board[coord]` instead of
`board[coord.row][coord.column]`.
That's a massive improvement so let's apply this to our `player` module:

```rust {data-file="player.rs", data-fold="['1-14', '18-39']", hl_lines=[16, 41]}
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Coord, Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: Coord,
}

impl Player {
	pub fn new() -> Self {
		Self {
			position: Coord { column: 0, row: 0 },
		}
	}

	pub fn advance(&mut self, board: &mut Board, direction: Direction) {
		board[self.position] = Tile::Empty;

		match direction {
			Direction::Up => {
				if self.position.row > 0 {
					self.position.row -= 1
				}
			},
			Direction::Right => {
				if self.position.column < BOARD_WIDTH - 1 {
					self.position.column += 1
				}
			},
			Direction::Down => {
				if self.position.row < BOARD_HEIGHT - 1 {
					self.position.row += 1
				}
			},
			Direction::Left => {
				if self.position.column > 0 {
					self.position.column -= 1
				}
			},
		}

		board[self.position] = Tile::Player;
	}
}
```

This kicks off a couple of errors:

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/code/beast)
<span style="font-weight:bold;color:red;">error[E0507]</span><span style="font-weight:bold;">: cannot move out of `self.position` which is behind a mutable reference</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/player.rs:16:9
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">16</span> <span style="font-weight:bold;color:#3333FF;">|</span>         board[self.position] = Tile::Empty;
   <span style="font-weight:bold;color:#3333FF;">|</span>               <span style="font-weight:bold;color:red;">^^^^^^^^^^^^^</span> <span style="font-weight:bold;color:red;">move occurs because `self.position` has type `Coord`, which does not implement the `Copy` trait</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:lime;">note</span>: if `Coord` implemented `Clone`, you could clone the value
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:34:1
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">34</span> <span style="font-weight:bold;color:#3333FF;">|</span> pub struct Coord {
   <span style="font-weight:bold;color:#3333FF;">|</span> <span style="font-weight:bold;color:lime;">^^^^^^^^^^^^^^^^</span> <span style="font-weight:bold;color:lime;">consider implementing `Clone` for this type</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
  <span style="font-weight:bold;color:#3333FF;">::: </span>src/player.rs:16:9
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">16</span> <span style="font-weight:bold;color:#3333FF;">|</span>         board[self.position] = Tile::Empty;
   <span style="font-weight:bold;color:#3333FF;">|</span>               <span style="font-weight:bold;color:#3333FF;">-------------</span> <span style="font-weight:bold;color:#3333FF;">you could clone this value</span>

<span style="font-weight:bold;color:red;">error[E0507]</span><span style="font-weight:bold;">: cannot move out of `self.position` which is behind a mutable reference</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/player.rs:41:9
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">41</span> <span style="font-weight:bold;color:#3333FF;">|</span>         board[self.position] = Tile::Player;
   <span style="font-weight:bold;color:#3333FF;">|</span>               <span style="font-weight:bold;color:red;">^^^^^^^^^^^^^</span> <span style="font-weight:bold;color:red;">move occurs because `self.position` has type `Coord`, which does not implement the `Copy` trait</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:lime;">note</span>: if `Coord` implemented `Clone`, you could clone the value
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:34:1
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">34</span> <span style="font-weight:bold;color:#3333FF;">|</span> pub struct Coord {
   <span style="font-weight:bold;color:#3333FF;">|</span> <span style="font-weight:bold;color:lime;">^^^^^^^^^^^^^^^^</span> <span style="font-weight:bold;color:lime;">consider implementing `Clone` for this type</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
  <span style="font-weight:bold;color:#3333FF;">::: </span>src/player.rs:41:9
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">41</span> <span style="font-weight:bold;color:#3333FF;">|</span>         board[self.position] = Tile::Player;
   <span style="font-weight:bold;color:#3333FF;">|</span>               <span style="font-weight:bold;color:#3333FF;">-------------</span> <span style="font-weight:bold;color:#3333FF;">you could clone this value</span>

<span style="font-weight:bold;">For more information about this error, try `rustc --explain E0507`.</span>
<span style="font-weight:bold;color:red;">error</span><span style="font-weight:bold;">:</span> could not compile `beast` (bin &quot;beast&quot;) due to 2 previous errors
```

Our trusted friend, the compiler, tells us that `Coord` doesn't implement the `Copy` trait which is needed for us to
take ownership of the coord passed into our `Index` trait.
We have two options here now:
1. We could derive the `Copy` and `Clone` trait for our `Coord` struct.
	This is a pretty low impact thing since the struct only takes `usize` types which are themselves copy types.
2. Or we could not take ownership of the `Coord` within our `Index` trait implementation in the first place.

Due to the relatively simple nature of the `Coord` struct the difference is much of a muchness really.
But because this is a tutorial and we're learning still, I would go with `2` mainly because there isn't a reason to take
ownership of the `Coord` within our `Index` trait.
And if we don't need it, why work around it?

So let's change our trait implementation:

```rust {data-file="board.rs", data-fold="['1-14', '29-90']", hl_lines=[15, 18, "23-24"]}
use rand::seq::SliceRandom;

use crate::{
	ANSI_CYAN, ANSI_GREEN, ANSI_RESET, ANSI_YELLOW, BOARD_HEIGHT, BOARD_WIDTH,
	Coord, TILE_SIZE, Tile,
};

use std::ops::{Index, IndexMut};

#[derive(Debug)]
pub struct Board {
	pub buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Index<&Coord> for Board {
	type Output = Tile;

	fn index(&self, coord: &Coord) -> &Self::Output {
		&self.buffer[coord.row][coord.column]
	}
}

impl IndexMut<&Coord> for Board {
	fn index_mut(&mut self, coord: &Coord) -> &mut Self::Output {
		&mut self.buffer[coord.row][coord.column]
	}
}

impl Board {
	pub fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		let mut all_coords = (0..BOARD_HEIGHT)
			.flat_map(|row| (0..BOARD_WIDTH).map(move |column| Coord { column, row }))
			.filter(|coord| !(coord.column == 0 && coord.row == 0))
			.collect::<Vec<Coord>>();
		let mut rng = rand::rng();
		all_coords.shuffle(&mut rng);

		buffer[0][0] = Tile::Player;

		for _ in 0..50 {
			let coord = all_coords.pop().expect(
				"We tried to place more blocks than there were available spaces on the board",
			);
			buffer[coord.row][coord.column] = Tile::Block;
		}

		for _ in 0..5 {
			let coord = all_coords.pop().expect(
				"We tried to place more static blocks than there were available spaces on the board",
			);
			buffer[coord.row][coord.column] = Tile::StaticBlock;
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

We simply take `Coord` by reference and thus don't have to copy or clone anything.
Now we need to change how we index into our board in the `player` module:

```rust {data-file="player.rs", data-fold="['1-14', '18-39']", hl_lines=[16, 41]}
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Coord, Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: Coord,
}

impl Player {
	pub fn new() -> Self {
		Self {
			position: Coord { column: 0, row: 0 },
		}
	}

	pub fn advance(&mut self, board: &mut Board, direction: Direction) {
		board[&self.position] = Tile::Empty;

		match direction {
			Direction::Up => {
				if self.position.row > 0 {
					self.position.row -= 1
				}
			},
			Direction::Right => {
				if self.position.column < BOARD_WIDTH - 1 {
					self.position.column += 1
				}
			},
			Direction::Down => {
				if self.position.row < BOARD_HEIGHT - 1 {
					self.position.row += 1
				}
			},
			Direction::Left => {
				if self.position.column > 0 {
					self.position.column -= 1
				}
			},
		}

		board[&self.position] = Tile::Player;
	}
}
```

This all compiles and we got a nice looking board with nice looking code!
But what is this `50` and `5` in our `board` module?

## Hardcoded values?

We got some hard-coded values in our code that probably need to change depending on what level of the game we are in,
right?

```rust {data-file="board.rs", data-fold="['1-40', '55-90']", hl_lines=[42, 49]}
use rand::seq::SliceRandom;

use crate::{
	ANSI_CYAN, ANSI_GREEN, ANSI_RESET, ANSI_YELLOW, BOARD_HEIGHT, BOARD_WIDTH,
	Coord, TILE_SIZE, Tile,
};

use std::ops::{Index, IndexMut};

#[derive(Debug)]
pub struct Board {
	pub buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Index<&Coord> for Board {
	type Output = Tile;

	fn index(&self, coord: &Coord) -> &Self::Output {
		&self.buffer[coord.row][coord.column]
	}
}

impl IndexMut<&Coord> for Board {
	fn index_mut(&mut self, coord: &Coord) -> &mut Self::Output {
		&mut self.buffer[coord.row][coord.column]
	}
}

impl Board {
	pub fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		let mut all_coords = (0..BOARD_HEIGHT)
			.flat_map(|row| (0..BOARD_WIDTH).map(move |column| Coord { column, row }))
			.filter(|coord| !(coord.column == 0 && coord.row == 0))
			.collect::<Vec<Coord>>();
		let mut rng = rand::rng();
		all_coords.shuffle(&mut rng);

		buffer[0][0] = Tile::Player;

		for _ in 0..50 {
			let coord = all_coords.pop().expect(
				"We tried to place more blocks than there were available spaces on the board",
			);
			buffer[coord.row][coord.column] = Tile::Block;
		}

		for _ in 0..5 {
			let coord = all_coords.pop().expect(
				"We tried to place more static blocks than there were available spaces on the board",
			);
			buffer[coord.row][coord.column] = Tile::StaticBlock;
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

The idea is that in later levels the `Block` tiles are reduced and the `StaticBlocks` increased to give us fewer
opportunities to squish the beasts, making each level a little harder.
Thus we need to find a way to change the number of blocks and static blocks for each level.

OK that's fair, we will need a way to express levels and then a way to get a level config for each level.
An `enum` here seems to be the right fit and we can implement a function on the enum that returns a struct with the
config per level.
For this let's create a new module called `level.rs` and add our code there:

```console
.
├── Cargo.lock
├── Cargo.toml
└── src
    ├── board.rs
    ├── game.rs
<span class="console-add">    ├── level.rs</span>
    ├── main.rs
    ├── player.rs
    └── raw_mode.rs
```

Let's just create a `Level` enum and add `One`, `Two` and `Three` as options for now.
We can add more levels later.

```rust {data-file="level.rs", data-fold="[]", hl_lines=[]}
pub struct LevelConfig {
	pub block_count: usize,
	pub static_block_count: usize,
}

#[derive(Debug)]
pub enum Level {
	One,
	Two,
	Three,
}

impl Level {
	pub fn get_level_config(&self) -> LevelConfig {
		match self {
			Level::One => LevelConfig {
				block_count: 30,
				static_block_count: 5,
			},
			Level::Two => LevelConfig {
				block_count: 20,
				static_block_count: 10,
			},
			Level::Three => LevelConfig {
				block_count: 12,
				static_block_count: 20,
			},
		}
	}
}
```

We added the `LevelConfig` struct for the return value and made sure we mark each field as public so that our other
modules can read it.
We also made our `Level` enum and `get_level_config` method on the enum public.

Now we just need to include this new module in our code:

```rust {data-file="main.rs", data-fold="['6-38']", hl_lines=[3]}
mod board;
mod game;
mod level;
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

#[derive(Debug)]
pub struct Coord {
	column: usize,
	row: usize,
}

fn main() {
	let _raw_mode = RawMode::enter();

	let mut game = Game::new();
	game.play();
}
```

And we use it in our board:

```rust {data-file="board.rs", data-fold="['9-29', '64-96']", hl_lines=[6, "43-46", 48, 55]}
use rand::seq::SliceRandom;

use crate::{
	ANSI_CYAN, ANSI_GREEN, ANSI_RESET, ANSI_YELLOW, BOARD_HEIGHT, BOARD_WIDTH,
	Coord, TILE_SIZE, Tile,
	level::{Level, LevelConfig},
};

use std::ops::{Index, IndexMut};

#[derive(Debug)]
pub struct Board {
	pub buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Index<&Coord> for Board {
	type Output = Tile;

	fn index(&self, coord: &Coord) -> &Self::Output {
		&self.buffer[coord.row][coord.column]
	}
}

impl IndexMut<&Coord> for Board {
	fn index_mut(&mut self, coord: &Coord) -> &mut Self::Output {
		&mut self.buffer[coord.row][coord.column]
	}
}

impl Board {
	pub fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		let mut all_coords = (0..BOARD_HEIGHT)
			.flat_map(|row| (0..BOARD_WIDTH).map(move |column| Coord { column, row }))
			.filter(|coord| !(coord.column == 0 && coord.row == 0))
			.collect::<Vec<Coord>>();
		let mut rng = rand::rng();
		all_coords.shuffle(&mut rng);

		buffer[0][0] = Tile::Player;

		let LevelConfig {
			block_count,
			static_block_count,
		} = Level::One.get_level_config();

		for _ in 0..block_count {
			let coord = all_coords.pop().expect(
				"We tried to place more blocks than there were available spaces on the board",
			);
			buffer[coord.row][coord.column] = Tile::Block;
		}

		for _ in 0..static_block_count {
			let coord = all_coords.pop().expect(
				"We tried to place more static blocks than there were available spaces on the board",
			);
			buffer[coord.row][coord.column] = Tile::StaticBlock;
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

We call `get_level_config` on `Level::One` because we find ourselves in the `new` method of the board module and a new
board will always start with level one.
But this brings us to the next step: we need to store our current level somewhere so that we can increment it when we
finish a level:

```rust {data-file="game.rs", data-fold="['22-53']", hl_lines=[4, 11, 19]}
use std::io::{Read, stdin};

use crate::{
	BOARD_HEIGHT, Direction, board::Board, level::Level, player::Player,
};

#[derive(Debug)]
pub struct Game {
	board: Board,
	player: Player,
	level: Level,
}

impl Game {
	pub fn new() -> Self {
		Self {
			board: Board::new(),
			player: Player::new(),
			level: Level::One,
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

We should probably display our level in the footer?

The issue is that we store our `level` value on our `Game` struct and the render method of the board is implemented on
our `Board` struct.
We would have to pass in our level in order to print it in that method.
I don't like passing things around like this.
You end up drilling function arguments all over the place and quickly lose track plus strictly speaking the board
shouldn't be concerned about things outside of its own domain which is the board only.

So let's create a new method on the `Game` struct that wraps our render method from our `Board`.
That way we keep everything strictly within their own area and avoid having to pass arguments around.

```rust {data-file="game.rs", data-fold="['1-23', '30-49']", hl_lines=[28, 51, "55-66"]}
use std::io::{Read, stdin};

use crate::{
	BOARD_HEIGHT, BOARD_WIDTH, Direction, board::Board, level::Level,
	player::Player,
};

#[derive(Debug)]
pub struct Game {
	board: Board,
	player: Player,
	level: Level,
}

impl Game {
	pub fn new() -> Self {
		Self {
			board: Board::new(),
			player: Player::new(),
			level: Level::One,
		}
	}

	pub fn play(&mut self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];
		println!("{}", self.render());

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

			println!("\x1B[{}F{}", BOARD_HEIGHT + 1 + 1, self.render());
		}
	}

	fn render(&self) -> String {
		let mut board = String::new();
		board.push_str(&format!(
			"{board}\n{footer:>width$}{level}",
			board = self.board.render(),
			footer = "Level: ",
			level = self.level,
			width = 1 + BOARD_WIDTH * 2 + 1 - 1,
		));

		board
	}
}
```

OK what's going on here?
We're making use of the [`format`](https://doc.rust-lang.org/std/fmt/index.html) macro and its superpowers.
We create a new `String`, then push a reference of what our format macro returns into it.
To increase the macro's readability we named each item.
You can always do that but it's mostly not needed since we often don't use more than two or three items.

That explains the names but what is this: `{footer:>width$}`?
We basically tell our macro to take an amount of characters of `width` and then place our `footer` variable, right
aligned, into it.
That effectively guarantees us always the same space taken up by this variable as long as the size of the variable is
smaller than `width`.

How did we come up with the `width`, you may ask?

```console
1 + BOARD_WIDTH * 2 + 1 - 1

^-- Border size
       ^-- Board width
                  ^-- Each tile is two columns wide
                      ^-- Border size
                          ^-- Level number width
```

We could leave this illustration as a comment in our code... or we could just *not* use magic numbers and stick them
into named variables:

```rust {data-file="game.rs", data-fold="['7-54']", hl_lines=[4, "56-57", 65]}
use std::io::{Read, stdin};

use crate::{
	BOARD_HEIGHT, BOARD_WIDTH, Direction, TILE_SIZE, board::Board, level::Level,
	player::Player,
};

#[derive(Debug)]
pub struct Game {
	board: Board,
	player: Player,
	level: Level,
}

impl Game {
	pub fn new() -> Self {
		Self {
			board: Board::new(),
			player: Player::new(),
			level: Level::One,
		}
	}

	pub fn play(&mut self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];
		println!("{}", self.render());

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

			println!("\x1B[{}F{}", BOARD_HEIGHT + 1 + 1, self.render());
		}
	}

	fn render(&self) -> String {
		const BORDER_SIZE: usize = 1;
		const FOOTER_SIZE: usize = 1;

		let mut board = String::new();
		board.push_str(&format!(
			"{board}\n{footer:>width$}{level}",
			board = self.board.render(),
			footer = "Level: ",
			level = self.level,
			width = BORDER_SIZE + BOARD_WIDTH * TILE_SIZE + BORDER_SIZE - FOOTER_SIZE,
		));

		board
	}
}
```

That's at least readable and we may even understand what's happening here in a few months from now when we come back to
this code.
But when we run this code we notice, as we move along the board, the output is eating its way downward through our
terminal buffer.

```console
cargo run
<span style="font-weight:bold;color:yellow;">warning</span><span style="font-weight:bold;">: variants `Two` and `Three` are never constructed</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/level.rs:9:2
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">7</span>  <span style="font-weight:bold;color:#3333FF;">|</span> pub enum Level {
   <span style="font-weight:bold;color:#3333FF;">|</span>          <span style="font-weight:bold;color:#3333FF;">-----</span> <span style="font-weight:bold;color:#3333FF;">variants in this enum</span>
<span style="font-weight:bold;color:#3333FF;">8</span>  <span style="font-weight:bold;color:#3333FF;">|</span>     One,
<span style="font-weight:bold;color:#3333FF;">9</span>  <span style="font-weight:bold;color:#3333FF;">|</span>     Two,
   <span style="font-weight:bold;color:#3333FF;">|</span>     <span style="font-weight:bold;color:yellow;">^^^</span>
<span style="font-weight:bold;color:#3333FF;">10</span> <span style="font-weight:bold;color:#3333FF;">|</span>     Three,
   <span style="font-weight:bold;color:#3333FF;">|</span>     <span style="font-weight:bold;color:yellow;">^^^^^</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: `Level` has a derived impl for the trait `Debug`, but this is intentionally ignored during dead code analysis
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: `#[warn(dead_code)]` on by default

<span style="font-weight:bold;color:yellow;">warning</span><span style="font-weight:bold;">:</span> `beast` (bin &quot;beast&quot;) generated 1 warning
<span style="font-weight:bold;color:lime;">    Finished</span> `dev` profile [unoptimized + debuginfo] target(s) in 0.01s
<span style="font-weight:bold;color:lime;">     Running</span> `target/debug/beast`
<span style="color:yellow;">▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜</span>
<span style="color:yellow;">▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜</span>
<span style="color:yellow;">▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜</span>
<span style="color:yellow;">▌</span>    <span style="color:aqua;">◀▶</span>                                                                        <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                <span style="color:lime;">░░                      ░░              ░░░░</span>  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>      <span style="color:lime;">░░                                      ░░</span>                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                <span style="color:lime;">░░          ░░                          ░░</span>                    <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                          <span style="color:yellow;">▓▓</span>                  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                  <span style="color:lime;">░░                                      ░░░░        ░░</span>      <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                              <span style="color:lime;">░░</span>                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                      <span style="color:lime;">░░                          ░░                  ░░</span>      <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                    <span style="color:yellow;">▓▓</span>                                        <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>            <span style="color:lime;">░░</span>                                                                <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                  <span style="color:lime;">░░      ░░</span>                                  <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>            <span style="color:lime;">░░                        ░░</span>                                      <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                              <span style="color:yellow;">▓▓</span>  <span style="color:lime;">░░</span><span style="color:yellow;">▓▓</span>                                        <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                  <span style="color:lime;">░░</span>          <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>        <span style="color:lime;">░░                                              ░░</span>                    <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                <span style="color:lime;">░░</span>                                                            <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                        <span style="color:lime;">░░</span>                                    <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>            <span style="color:yellow;">▓▓</span>                                          <span style="color:lime;">░░</span>                    <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                    <span style="color:lime;">░░</span>                                                        <span style="color:yellow;">▐</span>
<span style="color:yellow;">▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟</span>
                                                                        Level: 1
```

That's because we have added our footer which increases the height of our board and have not adjusted our ANSI escape
sequence that moves our cursor up `n` lines.
We're printing our sequence right now in our `play` function and now we would need to add a magic number to that
output but we just named all of those numbers nicely within our `render` function.
So let's move this reset into our `render` function and clean it up:

```rust {data-file="game.rs", data-fold="['1-23', '30-49']", hl_lines=[28, 51, "59-66"]}
use std::io::{Read, stdin};

use crate::{
	BOARD_HEIGHT, BOARD_WIDTH, Direction, TILE_SIZE, board::Board, level::Level,
	player::Player,
};

#[derive(Debug)]
pub struct Game {
	board: Board,
	player: Player,
	level: Level,
}

impl Game {
	pub fn new() -> Self {
		Self {
			board: Board::new(),
			player: Player::new(),
			level: Level::One,
		}
	}

	pub fn play(&mut self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];
		println!("{}", self.render(false));

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

			println!("{}", self.render(true));
		}
	}

	fn render(&self, reset: bool) -> String {
		const BORDER_SIZE: usize = 1;
		const FOOTER_SIZE: usize = 1;

		let mut board = if reset {
			format!(
				"\x1B[{}F",
				BORDER_SIZE + BOARD_HEIGHT + BORDER_SIZE + FOOTER_SIZE
			)
		} else {
			String::new()
		};

		board.push_str(&format!(
			"{board}\n{footer:>width$}{level}",
			board = self.board.render(),
			footer = "Level: ",
			level = self.level,
			width = BORDER_SIZE + BOARD_WIDTH * TILE_SIZE + BORDER_SIZE - FOOTER_SIZE,
		));

		board
	}
}
```

Now our board renders again nicely, we display a footer with a right aligned `level` display and we kept each of our
render functions to their respective areas of concerns.
Now let's stop the player from eating everything on the board.

## A Hungry Hungry Player

Right now, when we move around the board, we just overwrite anything in our path with `Tile::Empty` which isn't right.
Ideally we need to push blocks and stop at static blocks.
So what does our advance method look like right now?

```rust {data-file="player.rs", data-fold="['1-14']", hl_lines=[]}
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Coord, Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: Coord,
}

impl Player {
	pub fn new() -> Self {
		Self {
			position: Coord { column: 0, row: 0 },
		}
	}

	pub fn advance(&mut self, board: &mut Board, direction: Direction) {
		board[&self.position] = Tile::Empty;

		match direction {
			Direction::Up => {
				if self.position.row > 0 {
					self.position.row -= 1
				}
			},
			Direction::Right => {
				if self.position.column < BOARD_WIDTH - 1 {
					self.position.column += 1
				}
			},
			Direction::Down => {
				if self.position.row < BOARD_HEIGHT - 1 {
					self.position.row += 1
				}
			},
			Direction::Left => {
				if self.position.column > 0 {
					self.position.column -= 1
				}
			},
		}

		board[&self.position] = Tile::Player;
	}
}
```

Regardless of what the next tile is we move into, we just overwrite it with `Tile::Player` and when we leave the tile we
set it to `Tile::Empty`.
We're probably going to have to match on the `Tile` we're about to move into and then decide what to do there:

```rust {data-file="player.rs", data-fold="['1-14']", hl_lines=[16, "20-21", "25-26", "30-31", "35-36", "41-51"]}
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Coord, Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: Coord,
}

impl Player {
	pub fn new() -> Self {
		Self {
			position: Coord { column: 0, row: 0 },
		}
	}

	pub fn advance(&mut self, board: &mut Board, direction: Direction) {
		let mut next_position = self.position;

		match direction {
			Direction::Up => {
				if next_position.row > 0 {
					next_position.row -= 1
				}
			},
			Direction::Right => {
				if next_position.column < BOARD_WIDTH - 1 {
					next_position.column += 1
				}
			},
			Direction::Down => {
				if next_position.row < BOARD_HEIGHT - 1 {
					next_position.row += 1
				}
			},
			Direction::Left => {
				if next_position.column > 0 {
					next_position.column -= 1
				}
			},
		}

		match board[&next_position] {
			Tile::Empty => {
				board[&self.position] = Tile::Empty;
				self.position = next_position;
				board[&next_position] = Tile::Player;
			},
			Tile::Block => {
				// TODO: we need to move this block and any behind it
			},
			Tile::Player | Tile::StaticBlock => {},
		}
	}
}
```
Instead of manipulating `self.position` in place, we change a copy of it and then match the tile for that position from
our board.
- When we find an `Empty` we do what we did before: set our last position to `Empty`, store our new position
and set the new position on the board to `Player`.
- When we find that the next tile is of type `Player` or `StaticBlock` we do nothing because our player should be
prevented from walking into these.
- But when we find a `Block`, we note we will push it, which we will implement in the next section.

For now when we're walking around the board, we can bump into obstacles but never overwrite them or move them.

## Pushing, Not Eating

OK let's think about what we expect to happen when we hit a block while moving around.
If we move the player to the right:

```console
  <span style="color:aqua;">◀▶</span><span style="color:lime;">░░</span>
```

We would expect the player to push the block to the right:

```console
    <span style="color:aqua;">◀▶</span><span style="color:lime;">░░</span>
```

But it's entirely possible there are more blocks than just one:

```console
  <span style="color:aqua;">◀▶</span><span style="color:lime;">░░░░░░</span>
```

Or there is a static block at the end:

```console
  <span style="color:aqua;">◀▶</span><span style="color:lime;">░░░░</span><span style="color:yellow;">▓▓</span>
```

Or the board ends:

```console
  <span style="color:aqua;">◀▶</span><span style="color:lime;">░░░░</span><span style="color:yellow;">▐</span>
```

The problem is, we don't know what's beyond our `next_position` yet and we will have to search in a direction until we
find anything other than a `Tile::Block`.

We will need to loop in a given direction and calculate the next position for each iteration.
Best to move our next position logic into its own function so we can use it in our loop later:

```rust {data-file="player.rs", data-fold="['1-14']", hl_lines=["15-41", 44]}
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Coord, Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: Coord,
}

impl Player {
	pub fn new() -> Self {
		Self {
			position: Coord { column: 0, row: 0 },
		}
	}

	fn get_next_position(position: Coord, direction: Direction) -> Coord {
		let mut next_position = position;
		match direction {
			Direction::Up => {
				if next_position.row > 0 {
					next_position.row -= 1
				}
			},
			Direction::Right => {
				if next_position.column < BOARD_WIDTH - 1 {
					next_position.column += 1
				}
			},
			Direction::Down => {
				if next_position.row < BOARD_HEIGHT - 1 {
					next_position.row += 1
				}
			},
			Direction::Left => {
				if next_position.column > 0 {
					next_position.column -= 1
				}
			},
		}

		next_position
	}

	pub fn advance(&mut self, board: &mut Board, direction: Direction) {
		let next_position = Self::get_next_position(self.position, direction);

		match board[&next_position] {
			Tile::Empty => {
				board[&self.position] = Tile::Empty;
				self.position = next_position;
				board[&next_position] = Tile::Player;
			},
			Tile::Block => {
				// TODO: we need to move this block and any behind it
			},
			Tile::Player | Tile::StaticBlock => {},
		}
	}
}
```

All we did here is we moved our logic into a new private method called `get_next_position` and use that in our `advance`
method.
This all works but if we walk against the boundary of our board we will just get back the same coordinate as we passed
into the function and end up setting the same tile first to `Empty` and then to `Player` right after.
This isn't just inefficient, it also makes it hard for us to know we bumped against the wall of the board.
So let's change our function signature to return an `Option` and return `None` when we hit the board walls.

```rust {data-file="player.rs", data-fold="['1-14']", hl_lines=[15, "21-23", "28-30", "35-37", "42-44", 48, "52-54", 66]}
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Coord, Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: Coord,
}

impl Player {
	pub fn new() -> Self {
		Self {
			position: Coord { column: 0, row: 0 },
		}
	}

	fn get_next_position(position: Coord, direction: Direction) -> Option<Coord> {
		let mut next_position = position;
		match direction {
			Direction::Up => {
				if next_position.row > 0 {
					next_position.row -= 1
				} else {
					return None;
				}
			},
			Direction::Right => {
				if next_position.column < BOARD_WIDTH - 1 {
					next_position.column += 1
				} else {
					return None;
				}
			},
			Direction::Down => {
				if next_position.row < BOARD_HEIGHT - 1 {
					next_position.row += 1
				} else {
					return None;
				}
			},
			Direction::Left => {
				if next_position.column > 0 {
					next_position.column -= 1
				} else {
					return None;
				}
			},
		}

		Some(next_position)
	}

	pub fn advance(&mut self, board: &mut Board, direction: Direction) {
		if let Some(next_position) =
			Self::get_next_position(self.position, direction)
		{
			match board[&next_position] {
				Tile::Empty => {
					board[&self.position] = Tile::Empty;
					self.position = next_position;
					board[&next_position] = Tile::Player;
				},
				Tile::Block => {
					// TODO: we need to move this block and any behind it
				},
				Tile::Player | Tile::StaticBlock => {},
			}
		}
	}
}
```

Now that we're returning an `Option`, we can use
[`if let Some`](https://doc.rust-lang.org/rust-by-example/flow_control/if_let.html) which is pretty cool.
We don't have to match on the `Option` since we're only interested in the `Some` case.

Now we can look into pushing a bunch of blocks, a "*chain*" of blocks, if you will.

## Implementing The Blockchain

_(My favorite pun in this entire tutorial series)_

What do we actually need to execute a "blockchain move"?
Your first instinct might be to take each block in the chain and move it, one by one.

Consider this scenario:

```console
<table class="console_grid">
	<thead>
		<tr>
			<th>0</th>
			<th>1</th>
			<th>2</th>
			<th>3</th>
			<th>4</th>
			<th>5</th>
			<th>6</th>
			<th>7</th>
			<th>8</th>
			<th>9</th>
			<th>10</th>
		</tr>
	</thead>
	<tr>
		<td><span style="color:aqua;">◀▶</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
	</tr>
</table>
```

The changes required to move would be this:

```console
<table class="console_grid">
	<thead>
		<tr>
			<th>0</th>
			<th>1</th>
			<th>2</th>
			<th>3</th>
			<th>4</th>
			<th>5</th>
			<th>6</th>
			<th>7</th>
			<th>8</th>
			<th>9</th>
			<th>10</th>
		</tr>
	</thead>
	<tr>
		<td><span>  </span></td>
		<td><span style="color:aqua;">◀▶</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
	</tr>
</table>
```

- Position at coordinate `0` has to be set to `Empty`
- Position at coordinate `1` has to be set to `Player`
- Position at coordinate `2` has to be set to `Block`

That makes sense.
But what is required to do the same for a longer chain?

```console
<table class="console_grid">
	<thead>
		<tr>
			<th>0</th>
			<th>1</th>
			<th>2</th>
			<th>3</th>
			<th>4</th>
			<th>5</th>
			<th>6</th>
			<th>7</th>
			<th>8</th>
			<th>9</th>
			<th>10</th>
		</tr>
	</thead>
	<tr>
		<td><span style="color:aqua;">◀▶</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span>  </span></td>
		<td><span>  </span></td>
	</tr>
</table>
```

A successful push would look like this:

```console
<table class="console_grid">
	<thead>
		<tr>
			<th>0</th>
			<th>1</th>
			<th>2</th>
			<th>3</th>
			<th>4</th>
			<th>5</th>
			<th>6</th>
			<th>7</th>
			<th>8</th>
			<th>9</th>
			<th>10</th>
		</tr>
	</thead>
	<tr>
		<td><span>  </span></td>
		<td><span style="color:aqua;">◀▶</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span style="color:lime;">░░</span></td>
		<td><span>  </span></td>
	</tr>
</table>
```

- Position at coordinate `0` has to be set to `Empty`
- Position at coordinate `1` has to be set to `Player`
- Position at coordinate `9` has to be set to `Block`

Even though the chain is much longer we're still only doing 3 operations!
So, what we really need to execute the blockchain push, however long it might be, is:

- The previous position the player was at
- The new position the player is moving into
- The first `Empty` tile at the end of the block chain we're pushing

So as soon as we hit a `Block`, when calculating the next position, we need to start iterating over each tile in that
direction until we hit anything other than `Block`.

```rust {data-file="player.rs", data-fold="['1-50']", hl_lines=["62-80"]}
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Coord, Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: Coord,
}

impl Player {
	pub fn new() -> Self {
		Self {
			position: Coord { column: 0, row: 0 },
		}
	}

	fn get_next_position(position: Coord, direction: Direction) -> Option<Coord> {
		let mut next_position = position;
		match direction {
			Direction::Up => {
				if next_position.row > 0 {
					next_position.row -= 1
				} else {
					return None;
				}
			},
			Direction::Right => {
				if next_position.column < BOARD_WIDTH - 1 {
					next_position.column += 1
				} else {
					return None;
				}
			},
			Direction::Down => {
				if next_position.row < BOARD_HEIGHT - 1 {
					next_position.row += 1
				} else {
					return None;
				}
			},
			Direction::Left => {
				if next_position.column > 0 {
					next_position.column -= 1
				} else {
					return None;
				}
			},
		}

		Some(next_position)
	}

	pub fn advance(&mut self, board: &mut Board, direction: Direction) {
		if let Some(next_position) =
			Self::get_next_position(self.position, direction)
		{
			match board[&next_position] {
				Tile::Empty => {
					board[&self.position] = Tile::Empty;
					self.position = next_position;
					board[&next_position] = Tile::Player;
				},
				Tile::Block => {
					let mut current_tile = Tile::Block;
					let mut current_position = next_position;

					while current_tile == Tile::Block {
						if let Some(next_position) =
							Self::get_next_position(current_position, direction)
						{
							current_position = next_position;
							current_tile = board[&current_position];

							match current_tile {
								Tile::Block => { /* continue looking */ },
								Tile::Empty => {
									// we found the end
								},
								Tile::StaticBlock | Tile::Player => break,
							}
						}
					}
				},
				Tile::Player | Tile::StaticBlock => {},
			}
		}
	}
}
```

When we find a `Block` in the position the player is about to move into, we first store our tile and position into a
mutable variable.
Then we start a while loop that will go on until `current_tile` isn't `Tile::Block` anymore.
Inside the loop we get the next tile for our given direction with our handy `get_next_position` method and re-assign our
`current_tile` to the tile we find in this iteration.
Now we can do things inside this loop, like matching on that tile.

If that tile is a `Block` we just continue our search.
If the tile is `Empty` we have found the end of the blockchain and can execute our push.
If the tile is `StaticBlock` or `Player` we break from our loop because we now know the blocks we're trying to move
push up against an immovable object.

Now when we try to run the compiler, we are told about an issue:

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/code/beast)
<span style="font-weight:bold;color:red;">error[E0382]</span><span style="font-weight:bold;">: use of moved value: `direction`</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/player.rs:67:50
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">51</span> <span style="font-weight:bold;color:#3333FF;">|</span>     pub fn advance(&amp;mut self, board: &amp;mut Board, direction: Direction) {
   <span style="font-weight:bold;color:#3333FF;">|</span>                                                  <span style="font-weight:bold;color:#3333FF;">---------</span> <span style="font-weight:bold;color:#3333FF;">move occurs because `direction` has type `Direction`, which does not implement the `Copy` trait</span>
<span style="font-weight:bold;color:#3333FF;">52</span> <span style="font-weight:bold;color:#3333FF;">|</span>         if let Some(next_position) =
<span style="font-weight:bold;color:#3333FF;">53</span> <span style="font-weight:bold;color:#3333FF;">|</span>             Self::get_next_position(self.position, direction)
   <span style="font-weight:bold;color:#3333FF;">|</span>                                                    <span style="font-weight:bold;color:#3333FF;">---------</span> <span style="font-weight:bold;color:#3333FF;">value moved here</span>
<span style="font-weight:bold;color:#3333FF;">...</span>
<span style="font-weight:bold;color:#3333FF;">67</span> <span style="font-weight:bold;color:#3333FF;">|</span>                             Self::get_next_position(current_position, direction)
   <span style="font-weight:bold;color:#3333FF;">|</span>                                                                       <span style="font-weight:bold;color:red;">^^^^^^^^^</span> <span style="font-weight:bold;color:red;">value used here after move</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:lime;">note</span>: consider changing this parameter type in method `get_next_position` to borrow instead if owning the value isn't necessary
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/player.rs:15:51
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">15</span> <span style="font-weight:bold;color:#3333FF;">|</span>     fn get_next_position(position: Coord, direction: Direction) -&gt; Option&lt;Coord&gt; {
   <span style="font-weight:bold;color:#3333FF;">|</span>        <span style="font-weight:bold;color:#3333FF;">-----------------</span> <span style="font-weight:bold;color:#3333FF;">in this method</span>              <span style="font-weight:bold;color:lime;">^^^^^^^^^</span> <span style="font-weight:bold;color:lime;">this parameter takes ownership of the value</span>

<span style="font-weight:bold;">For more information about this error, try `rustc --explain E0382`.</span>
<span style="font-weight:bold;color:red;">error</span><span style="font-weight:bold;">:</span> could not compile `beast` (bin &quot;beast&quot;) due to 1 previous error
```

We're taking ownership of `direction` when we wrote the `advance` method's function signature but the type `Direction`
isn't a copy type.
Then we're trying to pass `direction` by value to the `get_next_position` method twice which is also told to own it.

That's no good so let's fix that up.
We don't need ownership, we can just pass `direction` by reference:

```rust {data-file="player.rs", data-fold="['1-14', '19-51', '55-87']", hl_lines=["15-18", 54]}
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Coord, Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: Coord,
}

impl Player {
	pub fn new() -> Self {
		Self {
			position: Coord { column: 0, row: 0 },
		}
	}

	fn get_next_position(
		position: Coord,
		direction: &Direction,
	) -> Option<Coord> {
		let mut next_position = position;
		match direction {
			Direction::Up => {
				if next_position.row > 0 {
					next_position.row -= 1
				} else {
					return None;
				}
			},
			Direction::Right => {
				if next_position.column < BOARD_WIDTH - 1 {
					next_position.column += 1
				} else {
					return None;
				}
			},
			Direction::Down => {
				if next_position.row < BOARD_HEIGHT - 1 {
					next_position.row += 1
				} else {
					return None;
				}
			},
			Direction::Left => {
				if next_position.column > 0 {
					next_position.column -= 1
				} else {
					return None;
				}
			},
		}

		Some(next_position)
	}

	pub fn advance(&mut self, board: &mut Board, direction: &Direction) {
		if let Some(next_position) =
			Self::get_next_position(self.position, direction)
		{
			match board[&next_position] {
				Tile::Empty => {
					board[&self.position] = Tile::Empty;
					self.position = next_position;
					board[&next_position] = Tile::Player;
				},
				Tile::Block => {
					let mut current_tile = Tile::Block;
					let mut current_position = next_position;

					while current_tile == Tile::Block {
						if let Some(next_position) =
							Self::get_next_position(current_position, direction)
						{
							current_position = next_position;
							current_tile = board[&current_position];

							match current_tile {
								Tile::Block => { /* continue looking */ },
								Tile::Empty => {
									// we found the end
								},
								Tile::StaticBlock | Tile::Player => break,
							}
						}
					}
				},
				Tile::Player | Tile::StaticBlock => {},
			}
		}
	}
}
```

Now just fix our `advance` calls in our game module:

```rust {data-file="game.rs", data-fold="['1-30', '48-78']", hl_lines=[33, 36, 39, 42]}
use std::io::{Read, stdin};

use crate::{
	BOARD_HEIGHT, BOARD_WIDTH, Direction, TILE_SIZE, board::Board, level::Level,
	player::Player,
};

#[derive(Debug)]
pub struct Game {
	board: Board,
	player: Player,
	level: Level,
}

impl Game {
	pub fn new() -> Self {
		Self {
			board: Board::new(),
			player: Player::new(),
			level: Level::One,
		}
	}

	pub fn play(&mut self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];
		println!("{}", self.render(false));

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					self.player.advance(&mut self.board, &Direction::Up);
				},
				'd' => {
					self.player.advance(&mut self.board, &Direction::Right);
				},
				's' => {
					self.player.advance(&mut self.board, &Direction::Down);
				},
				'a' => {
					self.player.advance(&mut self.board, &Direction::Left);
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}

			println!("{}", self.render(true));
		}
	}

	fn render(&self, reset: bool) -> String {
		const BORDER_SIZE: usize = 1;
		const FOOTER_SIZE: usize = 1;

		let mut board = if reset {
			format!(
				"\x1B[{}F",
				BORDER_SIZE + BOARD_HEIGHT + BORDER_SIZE + FOOTER_SIZE
			)
		} else {
			String::new()
		};

		board.push_str(&format!(
			"{board}\n{footer:>width$}{level}",
			board = self.board.render(),
			footer = "Level: ",
			level = self.level,
			width = BORDER_SIZE + BOARD_WIDTH * TILE_SIZE + BORDER_SIZE - FOOTER_SIZE,
		));

		board
	}
}
```

And our friend the compiler is happy again.
We haven't done anything when we try to push a block, though.
Naming is hard which we're now seeing in our code.
If the first step our player takes in our algorithm is called `next_position`, what do we call the steps within our
iterator?

```rust {data-file="player.rs", data-fold="['1-53']", hl_lines=[55, 58, "61-62", 66, "78-81"]}
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Coord, Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: Coord,
}

impl Player {
	pub fn new() -> Self {
		Self {
			position: Coord { column: 0, row: 0 },
		}
	}

	fn get_next_position(
		position: Coord,
		direction: &Direction,
	) -> Option<Coord> {
		let mut next_position = position;
		match direction {
			Direction::Up => {
				if next_position.row > 0 {
					next_position.row -= 1
				} else {
					return None;
				}
			},
			Direction::Right => {
				if next_position.column < BOARD_WIDTH - 1 {
					next_position.column += 1
				} else {
					return None;
				}
			},
			Direction::Down => {
				if next_position.row < BOARD_HEIGHT - 1 {
					next_position.row += 1
				} else {
					return None;
				}
			},
			Direction::Left => {
				if next_position.column > 0 {
					next_position.column -= 1
				} else {
					return None;
				}
			},
		}

		Some(next_position)
	}

	pub fn advance(&mut self, board: &mut Board, direction: &Direction) {
		if let Some(first_position) =
			Self::get_next_position(self.position, direction)
		{
			match board[&first_position] {
				Tile::Empty => {
					board[&self.position] = Tile::Empty;
					self.position = first_position;
					board[&first_position] = Tile::Player;
				},
				Tile::Block => {
					let mut current_tile = Tile::Block;
					let mut current_position = first_position;

					while current_tile == Tile::Block {
						if let Some(next_position) =
							Self::get_next_position(current_position, direction)
						{
							current_position = next_position;
							current_tile = board[&current_position];

							match current_tile {
								Tile::Block => { /* continue looking */ },
								Tile::Empty => {
									board[&self.position] = Tile::Empty;
									self.position = first_position;
									board[&first_position] = Tile::Player;
									board[&current_position] = Tile::Block;
								},
								Tile::StaticBlock | Tile::Player => break,
							}
						}
					}
				},
				Tile::Player | Tile::StaticBlock => {},
			}
		}
	}
}
```

We renamed our `next_position` to `first_position` because it's the first tile we move into and we will need that
position when executing our push.
We name the variable to store positions within our loop `next_position` as that seems most fitting.
We could have also come up with a new name for the `next_position` variable inside our `while` loop but I can't think of
a better name right now.

So we hit a block, seek until the end of the blockchain in the direction we're going in until we find an empty tile.
Then we set our last position to `Empty`, our new position to `Player`, store our new position in our player instance
and set the first `Empty` tile we found at the end of the chain to `Block`.

But there is a bug!

When you push a bunch of blocks against the wall of our board, the game stops responding and eventually crashes.
That's because we are doing nothing in our `while` loop when the `if let` statement is `false`, meaning when the next
position while we're looking for the end of the blockchain, is outside the board.
Because we do nothing, the loop continues indefinitely.

```rust {data-file="player.rs", data-fold="['1-63', '72-83', '90-94']", hl_lines=["85-87"]}
use crate::{BOARD_HEIGHT, BOARD_WIDTH, Coord, Direction, Tile, board::Board};

#[derive(Debug)]
pub struct Player {
	position: Coord,
}

impl Player {
	pub fn new() -> Self {
		Self {
			position: Coord { column: 0, row: 0 },
		}
	}

	fn get_next_position(
		position: Coord,
		direction: &Direction,
	) -> Option<Coord> {
		let mut next_position = position;
		match direction {
			Direction::Up => {
				if next_position.row > 0 {
					next_position.row -= 1
				} else {
					return None;
				}
			},
			Direction::Right => {
				if next_position.column < BOARD_WIDTH - 1 {
					next_position.column += 1
				} else {
					return None;
				}
			},
			Direction::Down => {
				if next_position.row < BOARD_HEIGHT - 1 {
					next_position.row += 1
				} else {
					return None;
				}
			},
			Direction::Left => {
				if next_position.column > 0 {
					next_position.column -= 1
				} else {
					return None;
				}
			},
		}

		Some(next_position)
	}

	pub fn advance(&mut self, board: &mut Board, direction: &Direction) {
		if let Some(first_position) =
			Self::get_next_position(self.position, direction)
		{
			match board[&first_position] {
				Tile::Empty => {
					board[&self.position] = Tile::Empty;
					self.position = first_position;
					board[&first_position] = Tile::Player;
				},
				Tile::Block => {
					let mut current_tile = Tile::Block;
					let mut current_position = first_position;

					while current_tile == Tile::Block {
						if let Some(next_position) =
							Self::get_next_position(current_position, direction)
						{
							current_position = next_position;
							current_tile = board[&current_position];

							match current_tile {
								Tile::Block => { /* continue looking */ },
								Tile::Empty => {
									board[&self.position] = Tile::Empty;
									self.position = first_position;
									board[&first_position] = Tile::Player;
									board[&current_position] = Tile::Block;
								},
								Tile::StaticBlock | Tile::Player => break,
							}
						} else {
							break;
						}
					}
				},
				Tile::Player | Tile::StaticBlock => {},
			}
		}
	}
}
```

Now our loop stops when a blockchain we're about to push hits the wall of our board.

## We've Done It

![A screen recording of the board with the player walking around pushing blocks as they go.](assets/pushing.svg)

That's it!
We did it.
Part two is done.

In [part three](../learning-rust-by-building-the-old-terminal-game-beast-from-1984-part-3/) we will add beasts and
pathfinding and finally a real game loop.

<br><br><br>
![A vintage-style roadside billboard features a sleazy-looking man with slicked-back hair and a smug expression,
pointing directly at the viewer. He's wearing a brown pinstripe suit with a shiny tie. The billboard background is a
dull yellow, and large red block letters read: \"SHARE THIS POST.\" The overall tone mimics tacky 1980s lawyer ads, with
an intentionally over-the-top, untrustworthy vibe.](assets/share.png)
{title="I won't tell you how to share it, that's up to you. Tell you friends, share on some social site, whisper it to you imaginary friend... up to you. All of it is appreciated"}
