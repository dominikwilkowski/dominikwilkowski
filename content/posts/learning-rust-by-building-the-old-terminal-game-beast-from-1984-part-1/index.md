---
title: 'An intro into rust by building the old terminal game BEAST from 1984, Part 1'
date: '2025-04-26T21:11:29+10:00'
draft: true
summary: >
  I've found building the BEAST game from 1984 helped me teach rust as it touches many concepts of rust and gets us to
  something visible quickly.
description: "We are building the temrinal game BEAST together to learn to apply rust to a project"
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

```console
cargo new beast
cd beast
```

This will create a new rust project named `beast` with a binary target:

```console
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

```toml {data-file="Cargo.toml"}
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

```rust {data-file="main.rs"}
fn main() {
	println!("Hello, world!");
}
```

Let's take our crate for a spin:
```console
cargo run
   <span style="color:#00ff00">Compiling</span> beast v0.1.0 (/Users/code/beast)
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

So we could represent the buffer of our board as a two dimensional
[array](https://doc.rust-lang.org/std/primitive.array.html) of tiles.
Each inner array represents a row of tiles and contains all its columns:

`[[Tile; BOARD_WIDTH]; BOARD_HEIGHT]`

The render function would iterate over the the array and print a new line for each row.

Ok this was a lot of text, let's get out of our heads and into code.

The first thing we need to do is define our tiles.
The tile should encapsulate what each tile on our board can represent.
A natrual fit for an [enum](https://doc.rust-lang.org/std/keyword.enum.html).

```rust {data-file="main.rs", hl_lines=["1-6"]}
enum Tile {
	Empty, // There will be empty spaces on our board "  "
	Player, // We will need the player "◀▶"
	Block, // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

fn main() {
	println!("Hello, world!");
}
```

That's fine for now.
Now let's work on the board.
Let's keep any board logic in a single [struct](https://doc.rust-lang.org/std/keyword.struct.html) we call `Board`.
Structs are a great way to encapsulate data and behavior.

```rust {data-file="main.rs", hl_lines=["8-10"]}
enum Tile {
	Empty, // There will be empty spaces on our board "  "
	Player, // We will need the player "◀▶"
	Block, // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

struct Board {
	buffer: [[Tile; 50]; 30],
}

fn main() {
	println!("Hello, world!");
}
```

So our board is a 2D array of the `Tile` enum we defined earlier.
Let's implement the `new` method on the struct so we can get a squeaky clean new board out.

```rust {data-file="main.rs", hl_lines=["12-18"]}
enum Tile {
	Empty, // There will be empty spaces on our board "  "
	Player, // We will need the player "◀▶"
	Block, // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

struct Board {
	buffer: [[Tile; 50]; 30],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 50]; 30],
		}
	}
}

fn main() {
	println!("Hello, world!");
}
```

So our `buffer` after calling the `new()` method would look like this:

```rust {lineNos=false}
[
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
]
```

It helps to visualize it because if you squit a little it actually looks like a board.
We have rows and columns, we have items for each tile, it's square.

Now let's actually try to get this output ourself by printing our board:

```rust {data-file="main.rs", hl_lines=[21]}
enum Tile {
	Empty, // There will be empty spaces on our board "  "
	Player, // We will need the player "◀▶"
	Block, // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

struct Board {
	buffer: [[Tile; 50]; 30],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 50]; 30],
		}
	}
}

fn main() {
	println!("{:?}", Board::new());
}
```

But once we save it all rust-analyzer will be upset with is and if we try running `cargo run` rustc will say this:

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/dominik/Desktop/beast)
<span style="font-weight:bold;color:red;">error[E0277]</span><span style="font-weight:bold;">: the trait bound `Tile: Copy` is not satisfied</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:17:14
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">17</span> <span style="font-weight:bold;color:#3333FF;">|</span>             buffer: [[Tile::Empty; 50]; 30],
   <span style="font-weight:bold;color:#3333FF;">|</span>                       <span style="font-weight:bold;color:red;">^^^^^^^^^^^</span> <span style="font-weight:bold;color:red;">the trait `Copy` is not implemented for `Tile`</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: the `Copy` trait is required because this value will be copied for each element of the array
<span style="font-weight:bold;color:aqua;">help</span>: consider annotating `Tile` with `#[derive(Copy)]`
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">2</span>  <span style="color:lime;">+ #[derive(Copy)]</span>
<span style="font-weight:bold;color:#3333FF;">3</span>  <span style="font-weight:bold;color:#3333FF;">| </span>enum Tile {
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:aqua;">help</span>: create an inline `const` block
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">17</span> <span style="color:red;">- </span>            buffer: [[<span style="color:red;">Tile::Empty</span>; 50]; 30],
<span style="font-weight:bold;color:#3333FF;">17</span> <span style="color:lime;">+ </span>            buffer: [[<span style="color:lime;">const { Tile::Empty }</span>; 50]; 30],
   <span style="font-weight:bold;color:#3333FF;">|</span>

<span style="font-weight:bold;color:red;">error[E0277]</span><span style="font-weight:bold;">: `Board` doesn't implement `Debug`</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:23:19
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">23</span> <span style="font-weight:bold;color:#3333FF;">|</span>     println!(&quot;{:?}&quot;, Board::new());
   <span style="font-weight:bold;color:#3333FF;">|</span>                      <span style="font-weight:bold;color:red;">^^^^^^^^^^^^</span> <span style="font-weight:bold;color:red;">`Board` cannot be formatted using `{:?}`</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">help</span>: the trait `Debug` is not implemented for `Board`
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: add `#[derive(Debug)]` to `Board` or manually `impl Debug for Board`
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)

<span style="font-weight:bold;">For more information about this error, try `rustc --explain E0277`.</span>
<span style="font-weight:bold;color:red;">error</span><span style="font-weight:bold;">:</span> could not compile `beast` (bin &quot;beast&quot;) due to 2 previous errors
```

We are told about two errors here:
1. ``error[E0277]: the trait bound `Tile: Copy` is not satisfied``<br>
    This error occurs because our `Tile` enum is being copied into our array but doesn't currenlty have the ability
    (trait) to be copied.
    Rust will actually tell us how to solve it too in two different ways which is awesome.
2. ```error[E0277]: `Board` doesn't implement `Debug```<br>
    The second error happens because we're trying to print the struct and rust doesn't know how to display this custom data
    structure we have built even in the debug mode we choose here in the
    [format macro](https://doc.rust-lang.org/std/macro.format.html).

I feels like the compiler is yelling at us and you'd be forgiven if this was your first impression but if you, right
from the start, see the compiler more as a seasoned pair-coder sitting patiently next to you, trying to help you,
you will have a much healthier relationship with it.
It's just trying to help, I promise.

So let's fix `1.`: the compiler tells us `Tile` needs the `Copy` trait.
Let's derive it:

```rust {data-file="main.rs", data-fold="['5-23']", hl_lines=[1]}
#[derive(Copy)]
enum Tile {
	Empty, // There will be empty spaces on our board "  "
	Player, // We will need the player "◀▶"
	Block, // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

struct Board {
	buffer: [[Tile; 50]; 30],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 50]; 30],
		}
	}
}

fn main() {
	println!("{:?}", Board::new());
}
```

Let's check in with our friend again:

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/dominik/Desktop/beast)
<span style="font-weight:bold;color:red;">error[E0277]</span><span style="font-weight:bold;">: the trait bound `Tile: Clone` is not satisfied</span>
   <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:1:10
    <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">1</span>   <span style="font-weight:bold;color:#3333FF;">|</span> #[derive(Copy)]
    <span style="font-weight:bold;color:#3333FF;">|</span>          <span style="font-weight:bold;color:red;">^^^^</span> <span style="font-weight:bold;color:red;">the trait `Clone` is not implemented for `Tile`</span>
    <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:lime;">note</span>: required by a bound in `Copy`
   <span style="font-weight:bold;color:#3333FF;">--&gt; </span>/Users/dominik/.rustup/toolchains/stable-aarch64-apple-darwin/lib/rustlib/src/rust/library/core/src/marker.rs:420:17
    <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">420</span> <span style="font-weight:bold;color:#3333FF;">|</span> pub trait Copy: Clone {
    <span style="font-weight:bold;color:#3333FF;">|</span>                 <span style="font-weight:bold;color:lime;">^^^^^</span> <span style="font-weight:bold;color:lime;">required by this bound in `Copy`</span>
    <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: this error originates in the derive macro `Copy` (in Nightly builds, run with -Z macro-backtrace for more info)
<span style="font-weight:bold;color:aqua;">help</span>: consider annotating `Tile` with `#[derive(Clone)]`
    <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">2</span>   <span style="color:lime;">+ #[derive(Clone)]</span>
<span style="font-weight:bold;color:#3333FF;">3</span>   <span style="font-weight:bold;color:#3333FF;">| </span>enum Tile {
    <span style="font-weight:bold;color:#3333FF;">|</span>

<span style="font-weight:bold;color:red;">error[E0277]</span><span style="font-weight:bold;">: `Board` doesn't implement `Debug`</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:22:19
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">22</span> <span style="font-weight:bold;color:#3333FF;">|</span>     println!(&quot;{:?}&quot;, Board::new());
   <span style="font-weight:bold;color:#3333FF;">|</span>                      <span style="font-weight:bold;color:red;">^^^^^^^^^^^^</span> <span style="font-weight:bold;color:red;">`Board` cannot be formatted using `{:?}`</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">help</span>: the trait `Debug` is not implemented for `Board`
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: add `#[derive(Debug)]` to `Board` or manually `impl Debug for Board`
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)

<span style="font-weight:bold;">For more information about this error, try `rustc --explain E0277`.</span>
<span style="font-weight:bold;color:red;">error</span><span style="font-weight:bold;">:</span> could not compile `beast` (bin &quot;beast&quot;) due to 2 previous errors
```

**The good news**: we fixed our previous error:<br>
``error[E0277]: the trait bound `Tile: Copy` is not satisfied``

**The bad news**: a new one poped up:<br>
``error[E0277]: the trait bound `Tile: Clone` is not satisfied``

But that's solvable since it seems we just have to add another trait to our derive macro.

```rust {data-file="main.rs",data-fold="['5-23']", hl_lines=[1]}
#[derive(Copy, Clone)]
enum Tile {
	Empty, // There will be empty spaces on our board "  "
	Player, // We will need the player "◀▶"
	Block, // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

struct Board {
	buffer: [[Tile; 50]; 30],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 50]; 30],
		}
	}
}

fn main() {
	println!("{:?}", Board::new());
}
```

And upon checking in with our trusty compiler/helper it appears we have solved the first issue.

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/dominik/Desktop/beast)
<span style="font-weight:bold;color:red;">error[E0277]</span><span style="font-weight:bold;">: `Board` doesn't implement `Debug`</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:22:19
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">22</span> <span style="font-weight:bold;color:#3333FF;">|</span>     println!(&quot;{:?}&quot;, Board::new());
   <span style="font-weight:bold;color:#3333FF;">|</span>                      <span style="font-weight:bold;color:red;">^^^^^^^^^^^^</span> <span style="font-weight:bold;color:red;">`Board` cannot be formatted using `{:?}`</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">help</span>: the trait `Debug` is not implemented for `Board`
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: add `#[derive(Debug)]` to `Board` or manually `impl Debug for Board`
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)

<span style="font-weight:bold;">For more information about this error, try `rustc --explain E0277`.</span>
<span style="font-weight:bold;color:red;">error</span><span style="font-weight:bold;">:</span> could not compile `beast` (bin &quot;beast&quot;) due to 1 previous error
```

This feels great.
Ok let's just solve the second issue as well.
We can see our `Board` struct needs the `Debug` trait.
But because we are on the top of our game and feel great it notice that part of the `Board` struct is the `Tile` enum
and if we were to just give the `Board` the debug trait we're guessing the compiler will let us gently know that the
enum, being part of the thing you're trying to display with the `Debug` trait, will also need this trait.
So we boldy just add the trait to both elements:

```rust {data-file="main.rs", data-fold="['13-24']", hl_lines=[1, 9]}
#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; 50]; 30],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 50]; 30],
		}
	}
}

fn main() {
	println!("{:?}", Board::new());
}
```

And what do you know: the compiler shows us some warnings about unused options and fields but it does ... **compile**.
Yay us!

The output is ... large and more importantly, it doesn't look like a board yet.
So let's work on rendering the output in a way that feels more board-game-y.

## Rendering

## A Brief Intro into ANSI Escape Sequences

## Rendering but with colors

## Listening to `stdin`

## Generating the terrain

## Pushing blocks
