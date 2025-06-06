---
title: 'An Introduction to Rust by Building an Old Terminal Game from 1984, Part 1'
date: '2025-05-21T21:11:29+10:00'
draft: false
visibility: false
summary: >
  You just read the Rust book and now want to apply your new skills to something real.
  Let's build a terminal game I grew up with, learn how the terminal works and how to control it.
description: >
  We are building the terminal game BEAST together to learn to apply Rust to a project.
  This is the first part in which we setup our board and learn how to move our player.
toc: true
readTime: true
tags: ["rust", "terminal", "game development", "tutorial"]
showTags: true
hideBackToTop: false
header: assets/header.jpg
---

<div class="ribbon"><img alt="Certified organic content, no AI used" src="/img/stamp.svg" title="I'm perfectly able to add my own em dashes, thank you very much!" width="120px" height="120px"></div>

## Why Though?

I've been teaching Rust to a couple of friends and colleagues in lots of different ways.
In my latest sessions, I've been using [this game I built as a homage](https://github.com/dominikwilkowski/beast) to
apply their newly learned rust skills to a project.
It seems to go over well with people because it's something real people can reason about, it's fun to work on as you can
add your own spin to it and it happens to touch on a lot of the important aspects of the language.
So I thought I'd write it up in a series of blog posts.

A small note to start: I'm by no means an expert in Rust.
I love the language and continue to learn, so if you find anything fishy in these posts (and it's not a
[_turbofish_](https://turbo.fish/)), do let me know by submitting
[a pull request or an issue](https://github.com/dominikwilkowski/dominikwilkowski).

## What We Need

I will assume you have some basic knowledge of Rust and won't go too deep into how the language works.
What I want to focus on is the use of the language for something you can see and play with.
This is how I learn myself.

> It's not just knowing what each of the bits are in the language, it's how you use them and how it all comes together.

I recommend you have read the [official book](https://doc.rust-lang.org/book/) and if you're so inclined, do have a look
at [easy_rust](https://github.com/Dhghomon/easy_rust), which is a great way to learn Rust as it is organized in small
chapters, not longer than 20 minutes each, with videos in plain language.
Lastly, checking out [rustlings](https://github.com/rust-lang/rustlings) helps you to get a feel for the language.

## What We're Building

[BEAST](https://en.wikipedia.org/wiki/Beast_(video_game)) is a terminal-based action game developed for MS-DOS by Dan
Baker, Alan Brown, Mark Hamilton, and Derrick Shadel.
It was distributed as shareware in 1984.

It's a game I grew up with back when I was young _(everything was still black and white, there were no mobile phones,
computer monitors were monochrome and emitted radiation)_.

<div style="position:relative;height:0;padding-bottom:68.547%;margin:1.5rem 0;">
	<iframe src="https://archive.org/embed/Beast_1020" width="560" height="384" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;" title="Archive.org Beast Game to play in the browser"></iframe>
</div>

To get a feel for the game, play it in the iframe above or on [archive.org](https://archive.org/embed/Beast_1020)
directly.

The broad strokes are:

- You're a player on a 2D board ◀▶
- The board contains blocks you can push ░░
- &hellip; and blocks you can't push ▓▓
- There are beasts trying to get you ├┤
- To win you have to squish the beasts between two blocks &nbsp;&nbsp;◀▶░░├┤░░

![Animated scene from the 1984 ASCII game BEAST, showing a blue diamond-shaped player character navigating a maze-like environment made of green block clusters, avoiding obstacles and moving toward a yellow target area in the top right
corner.
The screen features a classic DOS-style black background with retro text-based graphics](assets/movements.gif#small)

![The player moves a blue diamond character to push a wall block, crushing a red H-shaped beast between two blocks](assets/squish.gif#small)

There are more advanced challenges in later levels, but for this tutorial, we will focus only on the basics so you can
add your own levels later yourself.

For part 1, this post, we will be doing a bit of setup, go through some of the tooling and build our board to allow our
player to move around on it.

## Setting It Up

Let's build a terminal game in Rust <span role="img" aria-label="Excitment" tabIndex="0" class="emoji">🥳</span>!

We start by creating our Rust project:

```console
cargo new beast
cd beast
```

This will create a new Rust project named `beast` with a
[binary target](https://doc.rust-lang.org/cargo/reference/cargo-targets.html#binaries):

```console
.
├── Cargo.toml
└── src
    └── main.rs
```

Cargo has two [entry points](https://doc.rust-lang.org/stable/cargo/reference/cargo-targets.html#cargo-targets)
for its crates, and you can choose either or both in your project:
- a binary, the `main.rs` file with a `main()` function which executes when you run the program
- a library, the `lib.rs` file which can be imported by other crates

For a game we don't really need a library, so we will focus on the binary and `cargo new` will default to a binary
target anyway.

Our `Cargo.toml` file in the root is like the `package.json` file of our project:

```toml {data-file="Cargo.toml"}
[package]
name = "beast"
version = "0.1.0"
edition = "2024"

[dependencies]
```

We have our `name` and `version` set for us and something called `edition`.
[The edition](https://doc.rust-lang.org/edition-guide/editions/index.html) is the version of the Rust language we want
to use and `2024` is the latest as of this writing.

Our `src/main.rs` file is our entry point.
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
Building binaries and executing them like there's no tomorrow.
<span role="img" aria-label="High five hands" tabIndex="0" class="emoji">🙌</span>

## Let's Think About This

OK, what are we doing?

![Screenshot from the 1984 ASCII game BEAST. The screen is filled with a grid of green and yellow blocky patterns representing movable blocks and solid blocks. The player, shown as a cyan diamond shape, is located in the bottom-left corner. Several red 'H' characters, representing hostile beasts, are scattered on the right side of the screen. The game has a dark black background bordered by a yellow frame, with the environment laid out in a procedurally generated maze-like pattern.](assets/board.png "How do we want to represent this board in code, where's the source of truth, how do we render it and all that while keeping the sanity of future-us?")

There are a couple of ways we could approach this.
You could create instances of each tile you expect to see on the board, give each of them a position and a way to
represent themselves and in the render function we just iterate over each entity and place them on a temporary buffer
that then gets to be iterated over to form a String we simply print to
[`stdout`](https://en.wikipedia.org/wiki/Standard_streams).
This is indeed a good way to approach this for a game with a large number of entities which all require instances
to keep track of their own states.

But our board isn't very large, our blocks don't really need state and we have way more blocks than beasts.
Beasts need state to keep moving and path-find their way to the player and the player itself should probably remember
where it is.
Knowing that, we could simplify the approach above by skipping instances for blocks, going straight to keeping a buffer
of the board in memory and in the render function simply iterate over it and print it to stdout.

It's a simple version of [scan-line rendering](https://en.m.wikipedia.org/wiki/Scanline_rendering) as you would see in
old [CRT screens](https://en.wikipedia.org/wiki/Cathode-ray_tube).

![A hand-drawn grid representing a 2D game board, labeled “Columns” across the top and “Rows” along the left. The grid
is divided into 21 columns and 12 rows, with several cells shaded or marked to indicate different game elements. The
style mimics how CRT screens render images using rows and columns.](assets/board-sketch.png "We split the board into
rows and columns which now also means we have coordinates for each tile")

So, we could represent the buffer of our board as a two-dimensional
[array](https://doc.rust-lang.org/std/primitive.array.html) of tiles.
Each inner array represents a row of tiles and contains all its columns:

`[[Tile; BOARD_WIDTH]; BOARD_HEIGHT]`

The render function would iterate over the array and print a new line for each row.

OK, this was a lot of text, let's get out of our heads and into code.

## Creating A Board

The first thing we need to do is define our tiles.
The tile should encapsulate what each tile on our board can represent.
A natural fit for an [enum](https://doc.rust-lang.org/std/keyword.enum.html).

```rust {data-file="main.rs", hl_lines=["1-6"]}
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

fn main() {
	println!("Hello, world!");
}
```

That's fine for now.
Now let's work on the board.
Let's keep any board logic in a single [struct](https://doc.rust-lang.org/std/keyword.struct.html) we call `Board`.
Structs are there to encapsulate data and behavior.

```rust {data-file="main.rs", hl_lines=["8-10"]}
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

struct Board {
	buffer: [[Tile; 39]; 20],
}

fn main() {
	println!("Hello, world!");
}
```

So our board is a 2D array of the `Tile` enum we defined earlier.
We use `39` as width because we know each tile will be 2 chars wide and our frame most likely will take up a space on
each side (`39 * 2 + 1 + 1 = 80`) and so we stay within the
[80 column width](https://en.wikipedia.org/wiki/Characters_per_line) limit.

Let's implement the `new` method on the struct so we can get a squeaky clean new board out.

```rust {data-file="main.rs", hl_lines=["12-18"]}
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

struct Board {
	buffer: [[Tile; 39]; 20],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 39]; 20],
		}
	}
}

fn main() {
	println!("Hello, world!");
}
```

Our `buffer` in the `new()` method looks like this:

```rust {lineNos=false}
[
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty],
	[Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty]
]
```

It helps to visualize it because if you squint a little, it actually looks like a board.
We have rows and columns, we have items for each tile, it's square.

## The Compiler, Our Friend

Now let's actually try to get this output ourselves by printing our board:

```rust {data-file="main.rs", hl_lines=[21]}
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

struct Board {
	buffer: [[Tile; 39]; 20],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 39]; 20],
		}
	}
}

fn main() {
	println!("{:?}", Board::new());
}
```

But once we save it all, rust-analyzer will be upset with us and if we try running `cargo run`, rustc will say this:

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/dominik/beast)
<span style="font-weight:bold;color:red;">error[E0277]</span><span style="font-weight:bold;">: the trait bound `Tile: Copy` is not satisfied</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:17:14
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">17</span> <span style="font-weight:bold;color:#3333FF;">|</span>             buffer: [[Tile::Empty; 39]; 20],
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
<span style="font-weight:bold;color:#3333FF;">17</span> <span style="color:red;">- </span>            buffer: [[<span style="color:red;">Tile::Empty</span>; 39]; 20],
<span style="font-weight:bold;color:#3333FF;">17</span> <span style="color:lime;">+ </span>            buffer: [[<span style="color:lime;">const { Tile::Empty }</span>; 39]; 20],
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

We're told about two errors here:
1. <span class="console-line"><span style="color:red;">error[E0277]</span>: the trait bound `Tile: Copy` is not satisfied</span><br>
    This error occurs because our `Tile` enum is being copied into our array but doesn't currently have the ability
    ([trait](https://doc.rust-lang.org/book/ch10-02-traits.html)) to be copied.
    Rust will actually tell us how to solve it too in two different ways which is awesome.
2. <span class="console-line"><span style="color:red;">error[E0277]</span>: `Board` doesn't implement `Debug`</span><br>
    The second error happens because we're trying to print the struct and Rust doesn't know how to display this custom data
    structure we have built even in the debug mode we choose here in the
    [format macro](https://doc.rust-lang.org/std/macro.format.html).

It feels like the compiler is yelling at us and you'd be forgiven if this was your first impression but if you, _right
from the start_, see the compiler more as a seasoned pair-coder sitting patiently next to you, trying to help you,
you will have a much healthier relationship with it.
It's just trying to help, I promise.

So let's fix `1.`: the compiler tells us `Tile` needs the `Copy` trait.
Let's [derive](https://doc.rust-lang.org/reference/procedural-macros.html#derive-macros) it:

```rust {data-file="main.rs", data-fold="['5-23']", hl_lines=[1]}
#[derive(Copy)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

struct Board {
	buffer: [[Tile; 39]; 20],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 39]; 20],
		}
	}
}

fn main() {
	println!("{:?}", Board::new());
}
```

Let's check in with our friend:

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/dominik/beast)
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
<span class="console-line"><span style="color:red;">error[E0277]</span>: the trait bound `Tile: Copy` is not satisfied</span><br>

**The bad news**: a new one poped up:<br>
<span class="console-line"><span style="color:red;">error[E0277]</span>: the trait bound `Tile: Clone` is not satisfied</font>

But that's solvable since it seems we just have to add another trait to our derive proc macro.

```rust {data-file="main.rs",data-fold="['5-23']", hl_lines=[1]}
#[derive(Copy, Clone)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

struct Board {
	buffer: [[Tile; 39]; 20],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 39]; 20],
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
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/dominik/beast)
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
OK, let's just ride this wave and solve the second issue as well.
We can see our `Board` struct needs the `Debug` trait.
But because we are at the top of our game and feel great, we notice that part of the `Board` struct is the `Tile` enum
and if we were to just give the `Board` the debug trait we're guessing the compiler will let us gently know that the
enum, being part of the thing we're trying to display with the `Debug` trait, will also need this trait.
So we boldly just add the trait to both elements:

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
	buffer: [[Tile; 39]; 20],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 39]; 20],
		}
	}
}

fn main() {
	println!("{:?}", Board::new());
}
```

And what do you know: the compiler shows us some warnings about unused options and fields but it does &hellip; **compile**.
Yay us!

The output is &hellip; large and more importantly, it doesn't look like a board yet.
So let's work on rendering the output in a way that feels more board-game-y.

## Rendering

To render the board we add a `render` method to the `Board` struct.
We will have to iterate over each row in our `buffer` and within each row we will iterate over each column in each row.
Then we [`match`](https://doc.rust-lang.org/std/keyword.match.html) against the column which contains our tile.

Lastly we have to go into our `main` function and create an instance of our `Board` and then call the render method and
print it to `stdout`.

```rust {data-file="main.rs", data-fold="['1-20']", hl_lines=["21-37", "41-42"]}
#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; 39]; 20],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 39]; 20],
		}
	}

	fn render(&self) -> String {
		let mut output = String::new();

		for rows in self.buffer {
			for tile in rows {
				match tile {
					Tile::Empty => output.push_str("  "),
					Tile::Player => output.push_str("◀▶"),
					Tile::Block => output.push_str("░░"),
					Tile::StaticBlock => output.push_str("▓▓"),
				}
			}
			output.push('\n');
		}

		output
	}
}

fn main() {
	let board = Board::new();
	println!("{}", board.render());
}
```

So we made a new method that takes a reference to `self` and returns a `String`.

> [!TIP]
> By now you've seen us use two different types of something called "self":
> - `Self` in the `new` method
> - `self` in the `render` method
> 
> The way I keep them separated in my head is like this:
> - `Self` **points to the type**<br>
> 	It's like in our case we COULD use `Board` but because `Self` means the same thing and never changes even if we change
> 	the struct name, it's more "stable".
> - `self` **points to the instance**<br>
> 	An instance will have data associated with it so we can access it.
> 	A type has no data, only types.

Then we make a new mutable `String` called `output` and iterate in a nested loop over each tile and push into `output`
what the tile we match should be displayed as, before returning it.

> [!Note]
> In the code above, we use two different methods on `output`: `push_str` and `push`.
> That's because a line break `\n` is a `char` and those can be pushed into a `String` much faster than other string
slices.

We also opted for a tile being 2 characters long from the terminal perspective.
That's what the original game does, (I'm just trying to stay consistent).
You're welcome to change it to anything you like.

Running `cargo run`, we still get a few warnings about unused options, which is fair, but we also get a big empty blob
that gets printed.
Functionally this is correct, there is a board that is just completely empty so we really don't print anything for
`Tile::Empty`.
But we're missing a reference to where the board starts and ends to really see the empty board.
So let's add a frame that surrounds the board:

```rust {data-file="main.rs", data-fold="['1-20']", hl_lines=[22, 25, 34, 36]}
#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; 39]; 20],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; 39]; 20],
		}
	}

	fn render(&self) -> String {
		let mut output = format!("▛{}▜\n", "▀".repeat(39 * 2));

		for rows in self.buffer {
			output.push_str("▌");
			for tile in rows {
				match tile {
					Tile::Empty => output.push_str("  "),
					Tile::Player => output.push_str("◀▶"),
					Tile::Block => output.push_str("░░"),
					Tile::StaticBlock => output.push_str("▓▓"),
				}
			}
			output.push_str("▐\n");
		}
		output.push_str(&format!("▙{}▟", "▄".repeat(39 * 2)));

		output
	}
}

fn main() {
	let board = Board::new();
	println!("{}", board.render());
}
```

Instead of creating an empty `String` at the start, we use the
[`format`](https://doc.rust-lang.org/std/macro.format.html) macro which returns a `String`.
Inside there we use the [`repeat`](https://doc.rust-lang.org/std/string/struct.String.html#method.repeat) method to
allow us to not have to write the entire length of the border out.
We repeat the border `39 * 2` because the width of the board is `39` and the tile size is `2`.

Then we add the side border on line 25 before we start iterating over each item in this row and add the other side on
line 34.
We had to change our `push` to `push_str` because now we add more than a char into the `String`.
Lastly we add the bottom border in a very similar way we added the top.

## Taking The Magic Out Of Coding

I don't know about you, but I don't like magic numbers in my code.
We now have `39 * 2` and multiple instances of hardcoded `39` and `20` throughout our code.
At some point our future-self is going to ask:
> What does this number even mean?
{caption="Future Me"}

or

> Where else do I have to change this number to change the window size?
{caption="Future Me"}

Let's be kind to future-you and create a couple [constants](https://doc.rust-lang.org/std/keyword.const.html).

```rust {data-file="main.rs", data-fold="['5-12']", hl_lines=["1-3", 15, 21, 26, 40]}
const BOARD_WIDTH: usize = 39;
const BOARD_HEIGHT: usize = 20;
const TILE_SIZE: usize = 2;

#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	fn new() -> Self {
		Self {
			buffer: [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT],
		}
	}

	fn render(&self) -> String {
		let mut output = format!("▛{}▜\n", "▀".repeat(BOARD_WIDTH * TILE_SIZE));

		for rows in self.buffer {
			output.push_str("▌");
			for tile in rows {
				match tile {
					Tile::Empty => output.push_str("  "),
					Tile::Player => output.push_str("◀▶"),
					Tile::Block => output.push_str("░░"),
					Tile::StaticBlock => output.push_str("▓▓"),
				}
			}
			output.push_str("▐\n");
		}
		output.push_str(&format!("▙{}▟", "▄".repeat(BOARD_WIDTH * TILE_SIZE)));

		output
	}
}

fn main() {
	let board = Board::new();
	println!("{}", board.render());
}
```

Now even future-me will understand what `BOARD_WIDTH * TILE_SIZE` means and there is only one place to change the size
of the board.

OK, our game is getting closer:

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/dominik/beast)
<span style="font-weight:bold;color:yellow;">warning</span><span style="font-weight:bold;">: variants `Player`, `Block`, and `StaticBlock` are never constructed</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:8:2
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">6</span>  <span style="font-weight:bold;color:#3333FF;">|</span> enum Tile {
   <span style="font-weight:bold;color:#3333FF;">|</span>      <span style="font-weight:bold;color:#3333FF;">----</span> <span style="font-weight:bold;color:#3333FF;">variants in this enum</span>
<span style="font-weight:bold;color:#3333FF;">7</span>  <span style="font-weight:bold;color:#3333FF;">|</span>     Empty,       // There will be empty spaces on our board &quot;  &quot;
<span style="font-weight:bold;color:#3333FF;">8</span>  <span style="font-weight:bold;color:#3333FF;">|</span>     Player,      // We will need the player &quot;◀▶&quot;
   <span style="font-weight:bold;color:#3333FF;">|</span>     <span style="font-weight:bold;color:yellow;">^^^^^^</span>
<span style="font-weight:bold;color:#3333FF;">9</span>  <span style="font-weight:bold;color:#3333FF;">|</span>     Block,       // Some tiles will be blocks &quot;░░&quot;
   <span style="font-weight:bold;color:#3333FF;">|</span>     <span style="font-weight:bold;color:yellow;">^^^^^</span>
<span style="font-weight:bold;color:#3333FF;">10</span> <span style="font-weight:bold;color:#3333FF;">|</span>     StaticBlock, // Others will be blocks that can't be moved &quot;▓▓&quot;
   <span style="font-weight:bold;color:#3333FF;">|</span>     <span style="font-weight:bold;color:yellow;">^^^^^^^^^^^</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: `Tile` has derived impls for the traits `Debug` and `Clone`, but these are intentionally ignored during dead code analysis
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: `#[warn(dead_code)]` on by default

<span style="font-weight:bold;color:yellow;">warning</span><span style="font-weight:bold;">:</span> `beast` (bin &quot;beast&quot;) generated 1 warning
<span style="font-weight:bold;color:lime;">    Finished</span> `dev` profile [unoptimized + debuginfo] target(s) in 0.14s
<span style="font-weight:bold;color:lime;">     Running</span> `target/debug/beast`
▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟
```

This looks good.
Let's hardcode some blocks and the player just to see what it would look like on the board:

```rust {data-file="main.rs", data-fold="['1-18', '30-55']", hl_lines=["20-28"]}
const BOARD_WIDTH: usize = 39;
const BOARD_HEIGHT: usize = 20;
const TILE_SIZE: usize = 2;

#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		buffer[0][0] = Tile::Player;
		buffer[2][5] = Tile::Block;
		buffer[2][6] = Tile::Block;
		buffer[2][7] = Tile::Block;
		buffer[3][6] = Tile::StaticBlock;

		Self { buffer }
	}

	fn render(&self) -> String {
		let mut output = format!("▛{}▜\n", "▀".repeat(BOARD_WIDTH * TILE_SIZE));

		for rows in self.buffer {
			output.push_str("▌");
			for tile in rows {
				match tile {
					Tile::Empty => output.push_str("  "),
					Tile::Player => output.push_str("◀▶"),
					Tile::Block => output.push_str("░░"),
					Tile::StaticBlock => output.push_str("▓▓"),
				}
			}
			output.push_str("▐\n");
		}
		output.push_str(&format!("▙{}▟", "▄".repeat(BOARD_WIDTH * TILE_SIZE)));

		output
	}
}

fn main() {
	let board = Board::new();
	println!("{}", board.render());
}
```

We create a mutable variable called `buffer` which we assign our nested array to and then set a couple tiles in that
buffer to `Tile::Player`, `Tile::Block` and `Tile::StaticBlock`.
We don't have to do `buffer: buffer` in the `Self` block because of
[field init shorthand syntax](https://doc.rust-lang.org/book/ch05-01-defining-structs.html?utm_source=chatgpt.com#using-the-field-init-shorthand)
Rust has built in.

All that gets us this little preview via `cargo run`:

```console
cargo run
<span style="font-weight:bold;color:lime;">    Finished</span> `dev` profile [unoptimized + debuginfo] target(s) in 0.11s
<span style="font-weight:bold;color:lime;">     Running</span> `target/debug/beast`
▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜
▌◀▶                                                                            ▐
▌                                                                              ▐
▌          ░░░░░░                                                              ▐
▌            ▓▓                                                                ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▌                                                                              ▐
▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟
```

Oh and look, no more warnings <span role="img" aria-label="Sparkles" tabIndex="0" class="emoji">✨</span>!

Next up: Adding <span class="rainbow">colors</span>.

## A Brief Intro into ANSI Escape Sequences

> [!NOTE]
> To keep things simple we will follow along the unix standards so if you're working on a windows machine make sure you
> install the [Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/install) and run our game from
> there.

How do you even add color to a terminal?
All we have is our trusted [`println`](https://doc.rust-lang.org/std/macro.println.html) macro.
How do you add color to the output if all you have is a pipe that expects a string?

This is where [ANSI escape sequences](https://en.wikipedia.org/wiki/ANSI_escape_code) come in.<br>
From Wikipedia:

> ANSI escape sequences are a standard for in-band signaling to control cursor location, color, font styling, and other options on video text terminals and terminal emulators. Certain sequences of bytes, most starting with an ASCII escape character and a bracket character, are embedded into text.

The syntax of them is: `ESCAPE` `[` `CODE` and when you print this to most terminals it will be interpreted as a command
rather than as text.

There are many different things you can control with those sequences but for the purpose of this tutorial we will be
focusing only on color and cursor position.

Here is a short summary of colors and cursor codes we might need:

### Colors

| Code               | What it does       |
| ------------------ | ------------------ |
| `ESCAPE` `[` `30m` | Black font color   |
| `ESCAPE` `[` `31m` | Red font color     |
| `ESCAPE` `[` `32m` | Green font color   |
| `ESCAPE` `[` `33m` | Yellow font color  |
| `ESCAPE` `[` `34m` | Blue font color    |
| `ESCAPE` `[` `35m` | Magenta font color |
| `ESCAPE` `[` `36m` | Cyan font color    |
| `ESCAPE` `[` `37m` | White font color   |
| `ESCAPE` `[` `39m` | Reset font color   |

### Cursor

| Code                | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `ESCAPE` `[` `?25l` | Hide cursor                                      |
| `ESCAPE` `[` `?25h` | Show cursor                                      |
| `ESCAPE` `[` n `F`  | Move cursor to beginning of line, `n` lines up   |
| `ESCAPE` `[` n `E`  | Move cursor to beginning of line, `n` lines down |

`ESCAPE` in Rust via the print macro would be `\x1B` so looking at this we could make something yellow within a sentence
so let's try it out:

```rust {data-file="main.rs", data-fold="['1-51']", hl_lines=["53-55"]}
const BOARD_WIDTH: usize = 39;
const BOARD_HEIGHT: usize = 20;
const TILE_SIZE: usize = 2;

#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		buffer[0][0] = Tile::Player;
		buffer[2][5] = Tile::Block;
		buffer[2][6] = Tile::Block;
		buffer[2][7] = Tile::Block;
		buffer[3][6] = Tile::StaticBlock;

		Self { buffer }
	}

	fn render(&self) -> String {
		let mut output = format!("▛{}▜\n", "▀".repeat(BOARD_WIDTH * TILE_SIZE));

		for rows in self.buffer {
			output.push_str("▌");
			for tile in rows {
				match tile {
					Tile::Empty => output.push_str("  "),
					Tile::Player => output.push_str("◀▶"),
					Tile::Block => output.push_str("░░"),
					Tile::StaticBlock => output.push_str("▓▓"),
				}
			}
			output.push_str("▐\n");
		}
		output.push_str(&format!("▙{}▟", "▄".repeat(BOARD_WIDTH * TILE_SIZE)));

		output
	}
}

fn main() {
	// let board = Board::new();
	// println!("{}", board.render());
	println!("This is normal color, \x1B[33mthis is yellow,\x1B[39m and this is normal again");
}
```

Which will give us:

```console
cargo run
[..some warnings about unused items in our code..]
<span style="font-weight:bold;color:lime;">    Finished</span> `dev` profile [unoptimized + debuginfo] target(s) in 0.34s
<span style="font-weight:bold;color:lime;">     Running</span> `target/debug/beast`
This is normal color, <span style="color:yellow;">this is yellow,</span> and this is normal again
```

> [!TIP]
> Most terminals will keep the color once it has been set which means even after your program has finished the color
> of the terminal might still be set to something other than the default which will alienate your users.
> Make sure you clean up after yourself and use the appropriate reset sequence.

Now we know how to make our text colorful in the terminal which is something we will need for the frame, our blocks and
eventually our beasts.

Another thing you can do in the terminal is animations.
I'm sure you've seen it before when installing things: ![Animated terminal output](assets/loading.gif#lineheight#inline).

You still only have `println!("My output");` though so how would you do something like a loading animation?

The answer again is ANSI escape sequences.
If you look at [our sequences for cursor movements](#cursor) then we spot our ability to move the cursor to the start
of a line which means we can print a thing, reset the cursor to the start of that line, and print again over the
previous output, slowly changing what we print, frame by frame, to make an animation.

```rust {data-file="main.rs", data-fold="['1-51']", hl_lines=["55-56"]}
const BOARD_WIDTH: usize = 39;
const BOARD_HEIGHT: usize = 20;
const TILE_SIZE: usize = 2;

#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		buffer[0][0] = Tile::Player;
		buffer[2][5] = Tile::Block;
		buffer[2][6] = Tile::Block;
		buffer[2][7] = Tile::Block;
		buffer[3][6] = Tile::StaticBlock;

		Self { buffer }
	}

	fn render(&self) -> String {
		let mut output = format!("▛{}▜\n", "▀".repeat(BOARD_WIDTH * TILE_SIZE));

		for rows in self.buffer {
			output.push_str("▌");
			for tile in rows {
				match tile {
					Tile::Empty => output.push_str("  "),
					Tile::Player => output.push_str("◀▶"),
					Tile::Block => output.push_str("░░"),
					Tile::StaticBlock => output.push_str("▓▓"),
				}
			}
			output.push_str("▐\n");
		}
		output.push_str(&format!("▙{}▟", "▄".repeat(BOARD_WIDTH * TILE_SIZE)));

		output
	}
}

fn main() {
	// let board = Board::new();
	// println!("{}", board.render());
	println!("Hello");
	println!("\x1B[1FWorld");
}
```

This will just print out "World" after you run `cargo run`.
This is what's happening:

![Hand-drawn black-and-white diagram of four side-by-side terminal windows illustrating a simple ANSI animation. The first window shows an empty prompt. The second shows println!(Hello) as the label and the prompt Hello with the cursor at the right of the word. The third and forth window has the label println!(x1B1A World) and in the third window the cursor has moved to the start of the word Hello indicating the cursor moving. The fourth window shows World in place of Hello, demonstrating how the line is overwritten.](assets/ansi.png "See where the cursor moved in each step of the code above")

Let's use [`sleep`](https://doc.rust-lang.org/std/thread/fn.sleep.html) from the standard library to make what is
happening more visible:

```rust {data-file="main.rs", data-fold="['1-51']", hl_lines=["55-57"]}
const BOARD_WIDTH: usize = 39;
const BOARD_HEIGHT: usize = 20;
const TILE_SIZE: usize = 2;

#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		buffer[0][0] = Tile::Player;
		buffer[2][5] = Tile::Block;
		buffer[2][6] = Tile::Block;
		buffer[2][7] = Tile::Block;
		buffer[3][6] = Tile::StaticBlock;

		Self { buffer }
	}

	fn render(&self) -> String {
		let mut output = format!("▛{}▜\n", "▀".repeat(BOARD_WIDTH * TILE_SIZE));

		for rows in self.buffer {
			output.push_str("▌");
			for tile in rows {
				match tile {
					Tile::Empty => output.push_str("  "),
					Tile::Player => output.push_str("◀▶"),
					Tile::Block => output.push_str("░░"),
					Tile::StaticBlock => output.push_str("▓▓"),
				}
			}
			output.push_str("▐\n");
		}
		output.push_str(&format!("▙{}▟", "▄".repeat(BOARD_WIDTH * TILE_SIZE)));

		output
	}
}

fn main() {
	// let board = Board::new();
	// println!("{}", board.render());
	println!("Hello");
	std::thread::sleep(std::time::Duration::from_secs(3));
	println!("\x1B[1FWorld");
}
```

Now when you run `cargo run` you see "Hello" printed first, then after 3 seconds it's replaced by "World".
This is how any animations in the terminal work, by moving the cursor we constantly just overwrite the previous frame
with the next frame.
We will use this technique later when we start moving around on the board.

## Rendering But This Time Pretty

Now that we know how to add colors to our output let's make our `render` method prettier:

```rust {data-file="main.rs", data-fold="['1-30']", hl_lines=["32-33", 36, "40-42", 45, "47-50", "57-58"]}
const BOARD_WIDTH: usize = 39;
const BOARD_HEIGHT: usize = 20;
const TILE_SIZE: usize = 2;

#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		buffer[0][0] = Tile::Player;
		buffer[2][5] = Tile::Block;
		buffer[2][6] = Tile::Block;
		buffer[2][7] = Tile::Block;
		buffer[3][6] = Tile::StaticBlock;

		Self { buffer }
	}

	fn render(&self) -> String {
		let mut output =
			format!("\x1B[33m▛{}▜\x1B[39m\n", "▀".repeat(BOARD_WIDTH * TILE_SIZE));

		for rows in self.buffer {
			output.push_str("\x1B[33m▌\x1B[39m");
			for tile in rows {
				match tile {
					Tile::Empty => output.push_str("  "),
					Tile::Player => output.push_str("\x1B[36m◀▶\x1B[39m"),
					Tile::Block => output.push_str("\x1B[32m░░\x1B[39m"),
					Tile::StaticBlock => output.push_str("\x1B[33m▓▓\x1B[39m"),
				}
			}
			output.push_str("\x1B[33m▐\x1B[39m\n");
		}
		output.push_str(&format!(
			"\x1B[33m▙{}▟\x1B[39m",
			"▄".repeat(BOARD_WIDTH * TILE_SIZE)
		));

		output
	}
}

fn main() {
	let board = Board::new();
	println!("{}", board.render());
}
```

This will give us a board that is pretty close to the original game:

```console
cargo run
<span style="font-weight:bold;color:lime;">    Finished</span> `dev` profile [unoptimized + debuginfo] target(s) in 0.00s
<span style="font-weight:bold;color:lime;">     Running</span> `target/debug/beast`
<span style="color:yellow;">▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜</span>
<span style="color:yellow;">▌</span><span style="color:aqua;">◀▶</span>                                                                            <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>          <span style="color:lime;">░░</span><span style="color:lime;">░░</span><span style="color:lime;">░░</span>                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>            <span style="color:yellow;">▓▓</span>                                                                <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟</span>
```

## How Did Magic Get Back Into The Code?

But I gotta say: looking at the code, it's hard to see where an ANSI escape sequence ends and our output starts.
Let's clean this up by adding some consts for each of the colors:

```rust {data-file="main.rs", data-fold="['1-3', '10-35', '69-72']", hl_lines=["5-8", "38-40", 43, "47-55", 58, "60-63"]}
const BOARD_WIDTH: usize = 39;
const BOARD_HEIGHT: usize = 20;
const TILE_SIZE: usize = 2;

const ANSI_YELLOW: &str = "\x1B[33m";
const ANSI_GREEN: &str = "\x1B[32m";
const ANSI_CYAN: &str = "\x1B[36m";
const ANSI_RESET: &str = "\x1B[39m";

#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		buffer[0][0] = Tile::Player;
		buffer[2][5] = Tile::Block;
		buffer[2][6] = Tile::Block;
		buffer[2][7] = Tile::Block;
		buffer[3][6] = Tile::StaticBlock;

		Self { buffer }
	}

	fn render(&self) -> String {
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

fn main() {
	let board = Board::new();
	println!("{}", board.render());
}
```

Because the method [`push_str`](https://doc.rust-lang.org/std/string/struct.String.html#method.push_str) expects a
[`&str`](https://doc.rust-lang.org/std/primitive.str.html) and the macro
[`format`](https://doc.rust-lang.org/std/macro.format.html) returns a `String` we have to pass what `format` returns by
reference so we end up doing this: `output.push_str(&format!("Foo"));`.

> [!NOTE]
> In a real-world application, you’d typically rely on a library like [crossterm](https://crates.io/crates/crossterm)
> to handle terminals that don’t fully support every ANSI escape sequence.
> Here, however, we peek into what a crate like crossterm would do under the hood for a terminal that supports our
> sequences.

Our code is much more readable now and we can start listening to keyboard input.

## Listening To Keyboard Input

I mentioned `stdout` before but now it's time to actually briefly talk about what that is.
`stdout` stands for `standard out` and is part of the three
[standard streams](https://en.wikipedia.org/wiki/Standard_streams) between programs and their environment:

- `stdout` - "Standard out"; the stream we output our data into
- `stderr` - "Standard error"; the stream we output all of our error into
- `stdin` - "Standard in"; the stream we read for input

We've been using `stdout` via the `println` macro and you would have been using it via `console.log`, `print()`, `echo`
etc in other languages.
Now we need to listen for keyboard input because we want to know if the user of our game hit a key to move the player so
we need to listen to `stdin`.

And if we think about it: we really only want to render the board when things have changed in our state so only when the
user has hit a key to move the player.
So we need a `play` method that listens to keyboard input and calls `render` when the right keys have been pressed.

Listening to `stdin` means we have to lock `stdin` for reading and direct that stream to a buffer which we can `match`
against:

```rust {data-file="main.rs", data-fold="['3-68']", hl_lines=[1, "70-84", 89]}
use std::io::{Read, stdin};

const BOARD_WIDTH: usize = 39;
const BOARD_HEIGHT: usize = 20;
const TILE_SIZE: usize = 2;

const ANSI_YELLOW: &str = "\x1B[33m";
const ANSI_GREEN: &str = "\x1B[32m";
const ANSI_CYAN: &str = "\x1B[36m";
const ANSI_RESET: &str = "\x1B[39m";

#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		buffer[0][0] = Tile::Player;
		buffer[2][5] = Tile::Block;
		buffer[2][6] = Tile::Block;
		buffer[2][7] = Tile::Block;
		buffer[3][6] = Tile::StaticBlock;

		Self { buffer }
	}

	fn render(&self) -> String {
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

	fn play(&self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}
		}
	}
}

fn main() {
	let board = Board::new();
	board.play();
}
```

We're importing [`stdin`](https://doc.rust-lang.org/std/io/fn.stdin.html) function and the
[`Read`](https://doc.rust-lang.org/std/io/trait.Read.html) trait from the [`io`](https://doc.rust-lang.org/std/io/)
module in the standard library at the top of our `main.rs` file.

Then we call `stdin()` to get a handle for the standard-in stream and then call
[`lock`](https://doc.rust-lang.org/std/io/struct.Stdin.html#method.lock) on it so we can read from this stream
(and no-one else can).
Think of the way we read from a stream as the same as reading from a file, we have to put a read-lock on it to make sure
no other processes are making changes to the stream while we're reading from it.

We're expecting the user to use the <kbd>A</kbd>, <kbd>W</kbd>, <kbd>S</kbd> and <kbd>D</kbd> for direction (mainly
because it's simpler to listen to letter keys than arrow keys for now) which means we will need a buffer with exactly
one byte and use the [`read_exact`](https://doc.rust-lang.org/std/io/trait.Read.html#method.read_exact) method to fill
it.
`read_exact` returns a [`Result`](https://doc.rust-lang.org/std/io/type.Result.html) because reading from the stream
could fail.
While it doesn't fail, and the `Result` is `Ok`, we loop over the input and match against the byte we're getting back.
Since it's easier to read characters than bytes I convert the byte into a `char` and then match against it.

> [!Note]
> You could very well also write it this way:
> ```rust
> match buffer[0] {
> 	b'q' => {
> 		println!("Good bye");
> 		break;
> 	},
> 	_ => {},
> }
> ```
> But I find that less readable and the difference is only noticeable if you run this in a hot loop with billions of 
> iterations.

Inside the match we just check for the letter `q` (lowercase) and print a good bye message and break our `while` loop
thus ending our program.

When you run this you notice the program doesn't finish until you hit <kbd>q</kbd> and <kbd>Enter</kbd>.
This is great.
Now we can add the four branches for our directions.

```rust {data-file="main.rs", data-fold="['1-69', '98-102']", hl_lines=["77-88"]}
use std::io::{Read, stdin};

const BOARD_WIDTH: usize = 39;
const BOARD_HEIGHT: usize = 20;
const TILE_SIZE: usize = 2;

const ANSI_YELLOW: &str = "\x1B[33m";
const ANSI_GREEN: &str = "\x1B[32m";
const ANSI_CYAN: &str = "\x1B[36m";
const ANSI_RESET: &str = "\x1B[39m";

#[derive(Copy, Clone, Debug)]
enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Board {
	buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		buffer[0][0] = Tile::Player;
		buffer[2][5] = Tile::Block;
		buffer[2][6] = Tile::Block;
		buffer[2][7] = Tile::Block;
		buffer[3][6] = Tile::StaticBlock;

		Self { buffer }
	}

	fn render(&self) -> String {
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

	fn play(&self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					println!("Go Up");
				},
				'd' => {
					println!("Go Right");
				},
				's' => {
					println!("Go Down");
				},
				'a' => {
					println!("Go Left");
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}
		}
	}
}

fn main() {
	let board = Board::new();
	board.play();
}
```

## What Is This Smell?

OK, point of order: Looking at our code I'm getting a [code smell](https://en.wikipedia.org/wiki/Code_smell).

> [!TIP]
> Never ignore code smells (your gut instincts), they will **always** get stronger and harder to fix with time

What is this smell?
We have a `Board` struct that now contains `new`, `render` and now also `play`.
The first two make sense to me, the board needs to be instantiated and rendered.
But `play`?
Should the board deal with the play logic?

No, I think we should quickly clean up as we go and separate these things.
We will likely do more things within our game like deal with scores, game state and other things so why not just create
a `Game` struct that contains all that logic and keep the `Board` isolated to just board business?

Let's create a new file in our `src` folder called `board.rs` and move all our board logic there:

```console
.
├── Cargo.lock
├── Cargo.toml
└── src
<span class="console-add">    ├── board.rs</span>
    └── main.rs
```

```rust {data-file="board.rs"}
#[derive(Debug)]
struct Board {
	buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
}

impl Board {
	fn new() -> Self {
		let mut buffer = [[Tile::Empty; BOARD_WIDTH]; BOARD_HEIGHT];

		buffer[0][0] = Tile::Player;
		buffer[2][5] = Tile::Block;
		buffer[2][6] = Tile::Block;
		buffer[2][7] = Tile::Block;
		buffer[3][6] = Tile::StaticBlock;

		Self { buffer }
	}

	fn render(&self) -> String {
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

And our `main.rs` file can be cleaned up a little:

```rust {data-file="main.rs", hl_lines=["21-22", 25, 28, "62-63"]}
use std::io::{Read, stdin};

const BOARD_WIDTH: usize = 39;
const BOARD_HEIGHT: usize = 20;
const TILE_SIZE: usize = 2;

const ANSI_YELLOW: &str = "\x1B[33m";
const ANSI_GREEN: &str = "\x1B[32m";
const ANSI_CYAN: &str = "\x1B[36m";
const ANSI_RESET: &str = "\x1B[39m";

#[derive(Copy, Clone, Debug)]
pub enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Game {
	board: Board,
}

impl Game {
	fn new() -> Self {
		Self {
			board: Board::new(),
		}
	}

	fn play(&self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					println!("Go Up");
				},
				'd' => {
					println!("Go Right");
				},
				's' => {
					println!("Go Down");
				},
				'a' => {
					println!("Go Left");
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}
		}
	}
}

fn main() {
	let game = Game::new();
	game.play();
}
```

Now having separated these we need to tell Rust that we just created a new
[module](https://doc.rust-lang.org/stable/book/ch07-02-defining-modules-to-control-scope-and-privacy.html).

```rust {data-file="main.rs", data-fold="['5-66']", hl_lines=[3]}
use std::io::{Read, stdin};

mod board;

const BOARD_WIDTH: usize = 39;
const BOARD_HEIGHT: usize = 20;
const TILE_SIZE: usize = 2;

const ANSI_YELLOW: &str = "\x1B[33m";
const ANSI_GREEN: &str = "\x1B[32m";
const ANSI_CYAN: &str = "\x1B[36m";
const ANSI_RESET: &str = "\x1B[39m";

#[derive(Copy, Clone, Debug)]
pub enum Tile {
	Empty,       // There will be empty spaces on our board "  "
	Player,      // We will need the player "◀▶"
	Block,       // Some tiles will be blocks "░░"
	StaticBlock, // Others will be blocks that can't be moved "▓▓"
}

#[derive(Debug)]
struct Game {
	board: Board,
}

impl Game {
	fn new() -> Self {
		Self {
			board: Board::new(),
		}
	}

	fn play(&self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					println!("Go Up");
				},
				'd' => {
					println!("Go Right");
				},
				's' => {
					println!("Go Down");
				},
				'a' => {
					println!("Go Left");
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}
		}
	}
}

fn main() {
	let game = Game::new();
	game.play();
}
```

This includes our `board.rs` file into our codebase and we can watch the rust-analyzer errors flooding in.
The compiler reminds us that everything by default in Rust is private and has to be explicitly made public.
So let's throw in some [`pub`](https://doc.rust-lang.org/std/keyword.pub.html) keywords where we need them:

```rust {data-file="main.rs", data-fold="['16-68']", hl_lines=["7-9", "11-14"]}
use std::io::{Read, stdin};

mod board;

use crate::board::Board;

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

#[derive(Debug)]
struct Game {
	board: Board,
}

impl Game {
	fn new() -> Self {
		Self {
			board: Board::new(),
		}
	}

	fn play(&self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					println!("Go Up");
				},
				'd' => {
					println!("Go Right");
				},
				's' => {
					println!("Go Down");
				},
				'a' => {
					println!("Go Left");
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}
		}
	}
}

fn main() {
	let game = Game::new();
	game.play();
}
```

And import those public variables now in our `board.rs` file and make `Board` and its method `new` public as well:

```rust {data-file="board.rs", data-fold="['15-55']", hl_lines=["1-4", 7, 12]}
use crate::{
	ANSI_CYAN, ANSI_GREEN, ANSI_RESET, ANSI_YELLOW, BOARD_HEIGHT, BOARD_WIDTH,
	TILE_SIZE, Tile,
};

#[derive(Debug)]
pub struct Board {
	buffer: [[Tile; BOARD_WIDTH]; BOARD_HEIGHT],
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

	fn render(&self) -> String {
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

This compiles again and feels much cleaner.

Running this code we notice something odd though.
You have to hit <kbd>Enter</kbd> before our game does anything with the input.
Even when you hit <kbd>a</kbd>, <kbd>w</kbd> and <kbd>s</kbd> all after one another and then <kbd>Enter</kbd> we see
this in our terminal:

```console
awd
Go Left
Go Up
Go Right
```

A few issues:
- We are required to hit <kbd>Enter</kbd> before our program does anything
- Moving is bunched together until we hit <kbd>Enter</kbd>
- Hitting any of our direction keys echos them to our output

That's not a good way for a game to operate.
Having to hit <kbd>Enter</kbd> after each move or even seeing the letters appear in my terminal when playing.
We can fix all that by setting our terminal to "raw mode".

## Would You Like Your Terminal Cooked Or Raw?

Unix-style terminals have [modes](https://en.wikipedia.org/wiki/Terminal_mode) that have different purposes.

By default terminals are set to `cooked mode`.
In this mode commands can be typed out, edited by deleting or adding to the text before hitting <kbd>Enter</kbd> which
sends it to the program and echos it back to the user.
This dates back to the days of hardware terminals connected to the computer via a serial line.
The computer expected the terminals to handle the low-level editing so it didn't have to implement it itself.

In contrast, `raw mode` sets up the [TTY](https://en.wikipedia.org/wiki/Tty_(Unix)) driver to pass every character to
the program as it's typed and keeps it the program's responsibility to echo anything back to the user.

Programs are started in `cooked mode` by default and need to enable `raw mode` because imagine the mayhem `raw mode`
would cause if every single keystroke you type would be sent to the shell instantly.

Switching to raw mode in our Linux-like-shell will be this command: `stty -icanon -echo`.
Switching back is: `stty icanon echo`.
So we have to call these commands in our program at the start and end to make sure we're in the right mode for our game.
Let's do this by creating a new module called `raw_mode` in a new file `raw_mode.rs`:

```console
.
├── Cargo.lock
├── Cargo.toml
└── src
    ├── board.rs
    ├── main.rs
<span class="console-add">    └── raw_mode.rs</span>
```

In there we will use the [`std::process::Command`](https://doc.rust-lang.org/std/process/struct.Command.html) struct to
execute the commands and put it all into a struct called `RawMode`:

```rust {data-file="raw_mode.rs"}
use std::process::Command;

pub struct RawMode;

impl RawMode {
	pub fn enter() {
		let _ = Command::new("stty")
			.arg("-icanon")
			.arg("-echo")
			.spawn()
			.and_then(|mut child| child.wait());
	}
}
```

We implemented a new method on our struct called `enter` which creates a new instance of `Command`, adds two arguments
to it and calls [`spawn`](https://doc.rust-lang.org/std/process/struct.Command.html#method.spawn) to create a new child
process to execute this command in.
Then we use [`and_then`](https://doc.rust-lang.org/std/result/enum.Result.html#method.and_then) to unwrap the `Result`
which is returned from `spawn` and call `wait` on the child handle inside of it to make sure we return from our function
only after the command was executed.
We use `let _ =` to ignore the actual instance created by the struct because we don't need it.
`_` is a catch all convention in Rust that allows us to tell the compiler to ignore whatever is returned here.

Calling `RawMode::enter()` will now execute our command telling our terminal to enter `raw mode`.
Let's add one more thing in here: let's hide the cursor while the program is running because we don't need a cursor and
we have learned we can use ANSI escape sequences to do this.

```rust {data-file="raw_mode.rs", hl_lines=[12]}
use std::{io, process::Command};

pub struct RawMode;

impl RawMode {
	pub fn enter() {
		let _ = Command::new("stty")
			.arg("-icanon")
			.arg("-echo")
			.spawn()
			.and_then(|mut child| child.wait());
		print!("\x1b[?25l");
	}
}
```

OK, now let's include our new module into our codebase in the `main.rs` file and call our `enter` method at the start of
our `main` function:

```rust {data-file="main.rs", data-fold="['8-64']", hl_lines=[4, 6, 67]}
use std::io::{Read, stdin};

mod board;
mod raw_mode;

use crate::{board::Board, raw_mode::RawMode};

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

#[derive(Debug)]
struct Game {
	board: Board,
}

impl Game {
	fn new() -> Self {
		Self {
			board: Board::new(),
		}
	}

	fn play(&self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					println!("Go Up");
				},
				'd' => {
					println!("Go Right");
				},
				's' => {
					println!("Go Down");
				},
				'a' => {
					println!("Go Left");
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}
		}
	}
}

fn main() {
	RawMode::enter();

	let game = Game::new();
	game.play();
}
```

Running our program now we notice we instantly get feedback on each keystroke and we also don't see the cursor anymore.
This is great.
Hitting <kbd>q</kbd> quits the game flawlessly and we feel a rush of accomplishment.

Oh but we also notice that the cursor is now hidden, even after the program has finished.
That's a side effect we didn't want.
Let's quickly run this in our terminal to get the cursor back: `echo "\x1b[?25h"`.
OK, we're back to normal but we can't expect our users to do this after they played our game so we need to do this in our
program.
We COULD create a new method now called `leave` or something that just echos the sequence and we call it at the end of
the program but instead we will do it a bit more "rusty".

As you know, Rust cleans up its variables whenever they go out of scope.
When cleaning up, Rust will call the `destructor` via the [`Drop`](https://doc.rust-lang.org/std/ops/trait.Drop.html)
trait.
Let's use this to our advantage and implement this trait for our `RawMode` struct and have Rust take care of when to
call the clean up crew.

```rust {data-file="raw_mode.rs", data-fold="['5-14']", hl_lines=["16-24"]}
use std::{io, process::Command};

pub struct RawMode;

impl RawMode {
	pub fn enter() {
		let _ = Command::new("stty")
			.arg("-icanon")
			.arg("-echo")
			.spawn()
			.and_then(|mut child| child.wait());
		print!("\x1b[?25l");
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

The `Drop` trait expects a function called `drop` to be implemented and inside we just reverse whatever we did in
`enter` and have Rust take care of the rest.

But when we run our program now this function doesn't seem to be called at all because our cursor is still hidden after
the program quits.

That's because there is nothing to be cleaned up.
While we call `enter` in our `main` function, we don't actually create an instance of `RawMode` that can be cleaned up
by Rust so the destructor on our struct is never called.
Let's change that by returning `Self` from the `enter` method.

```rust {data-file="raw_mode.rs", data-fold="['17-26']", hl_lines=[6, 13]}
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

But wait a minute, I hear you say.
Now running `cargo run` gets us back to `cooked mode` because we have to hit <kbd>Enter</kbd> after each keyboard hit
again.
Why is that happening?

Well if we look at our `main` function we see what the issue is:

```rust {data-file="main.rs", data-fold="['1-65']"}
use std::io::{Read, stdin};

mod board;
mod raw_mode;

use crate::{board::Board, raw_mode::RawMode};

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

#[derive(Debug)]
struct Game {
	board: Board,
}

impl Game {
	fn new() -> Self {
		Self {
			board: Board::new()
		}
	}

	fn play(&self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					println!("Go Up");
				},
				'd' => {
					println!("Go Right");
				},
				's' => {
					println!("Go Down");
				},
				'a' => {
					println!("Go Left");
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}
		}
	}
}

fn main() {
	RawMode::enter();

	let game = Game::new();
	game.play();
}
```

While we return an instance of `RawMode` (via `Self`) from the `enter` function, we don't actually put it anywhere.
The instance is created but because it's never stored anywhere it's also cleaned up instantly thus calling our drop
method and resetting our terminal.
We need to create a variable to keep this instance in but we also don't need to do anything with it.
We just want to keep it around for the duration of the `main` function which represents the duration of our program.
So to do that and prevent the linter to warn us about an unused variable, we can prefix our variable with an underscore
to communicate to the compiler this is a thing we don't want to use any further.

```rust {data-file="main.rs", data-fold="['1-65']", hl_lines=[67]}
use std::io::{Read, stdin};

mod board;
mod raw_mode;

use crate::{board::Board, raw_mode::RawMode};

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

#[derive(Debug)]
struct Game {
	board: Board,
}

impl Game {
	fn new() -> Self {
		Self {
			board: Board::new()
		}
	}

	fn play(&self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					println!("Go Up");
				},
				'd' => {
					println!("Go Right");
				},
				's' => {
					println!("Go Down");
				},
				'a' => {
					println!("Go Left");
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}
		}
	}
}

fn main() {
	let _raw_mode = RawMode::enter();

	let game = Game::new();
	game.play();
}
```

Now running our game we get the benefits of our terminal being in `raw mode` and things are cleaned up for us nicely
without side effects.

> [!Note]
> I kept this `raw_mode` module simple for the sake of the tutorial but at this stage it wouldn't be able to detect
> the [`sigint`](https://en.wikipedia.org/wiki/Signal_(IPC)) signal and thus not clean up when you stop the program with
> <kbd>Ctrl</kbd> + <kbd>c</kbd>.
> You should use [`crossterm`](https://docs.rs/crossterm/latest/crossterm/terminal/index.html#raw-mode) to do this
> in a game you want to distribute or at least add an event handler for the sigint signal.

We now listen to the user's keyboard and are executing functions on each key we're interested in for navigation.
Naturally our next step should be to actually navigate our player on the board.

## Giving Our Player Legs

How do we move our player around the board?
We have a board buffer that we need to manipulate in order for our `render` method to work.
So when moving our player we would need to set the previous tile our player was in to `Tile::Empty` and the new tile our
player is moving into, to `Tile::Player`.
We have a branch for each direction in our `play` method so we can easily pass an enum for each direction into our
function that calculates our move.
Though we need to know where the player is in order to calculate the new position for a given direction.
We could do that by scanning the board buffer and find the location of `Tile::Player`.
That seems like a lot of work to do for each move.
Perhaps we keep track of our position each time we move and just recall that position from memory.

OK, that sounds good, now let's think about where to put all this code.
Moving a player doesn't seem appropriate for the board module.
Also doesn't seem like a good fit for our `Game` struct really?
Perhaps we create a new module just for the player that can handle movements, re-spawning and scores.

With all that in mind let's create a new file called `player.rs`:

```console
.
├── Cargo.lock
├── Cargo.toml
└── src
    ├── board.rs
    ├── main.rs
<span class="console-add">    ├── player.rs</span>
    └── raw_mode.rs
```

In there we create a new struct called `Player` that holds our position and implements a `new` method.

```rust {data-file="player.rs"}
pub struct Player {
	position: (usize, usize),
}

impl Player {
	pub fn new() -> Self {
		Self { position: (0, 0) }
	}
}
```

Our position requires two things: column and row.
Let's keep it simple for now and just use a [`tuple`](https://doc.rust-lang.org/std/primitive.tuple.html) for this until
it gets too messy.

Now we need a new method to move our player.
Since `move` is a reserved word in Rust, let's call the method `advance`.
This method would need to know what direction we're advancing in so perhaps we start with adding a new enum to our
`main.rs` file which lays out each direction a player can go:

```rust {data-file="main.rs", data-fold="['1-24', '32-78']", hl_lines=["25-30"]}
use std::io::{Read, stdin};

mod board;
mod raw_mode;

use crate::{board::Board, raw_mode::RawMode};

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
}

impl Game {
	fn new() -> Self {
		Self {
			board: Board::new()
		}
	}

	fn play(&self) {
		let stdin = stdin();
		let mut lock = stdin.lock();
		let mut buffer = [0_u8; 1];

		while lock.read_exact(&mut buffer).is_ok() {
			match buffer[0] as char {
				'w' => {
					println!("Go Up");
				},
				'd' => {
					println!("Go Right");
				},
				's' => {
					println!("Go Down");
				},
				'a' => {
					println!("Go Left");
				},
				'q' => {
					println!("Good bye");
					break;
				},
				_ => {},
			}
		}
	}
}

fn main() {
	let _raw_mode = RawMode::enter();

	let game = Game::new();
	game.play();
}
```

We will make this enum `pub` because we will need to use (_import_) it in our player module:

```rust {data-file="player.rs", hl_lines=[1, "12-14"]}
use crate::Direction;

pub struct Player {
	position: (usize, usize),
}

impl Player {
	pub fn new() -> Self {
		Self { position: (0, 0) }
	}

	pub fn advance(&mut self, direction: Direction) {
		todo!("We still need to write the logic here")
	}
}
```

Our new advance method now takes a mutable reference to self because we will have to change `position` and `direction`
to tell us which direction the player is advancing in.
Inside our method naturally we use the all-powerful `match` statement to branch off each `Direction` value.
What do we do in each branch?

If we go to the right, for example, we have to:
- Change our old position on the buffer to `Tile::Empty`
- Add `1` to the column of our position
- Add `Tile::Player` to the board buffer at this new position

That way when we call `render` next, the player has moved and the next time we call the `advance` we go from the new
position.

```rust {data-file="player.rs", hl_lines=[1, 3, "13-23"]}
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

Let's add our new player instance to our `Game` struct and call the `advance` method on keypress:

```rust {data-file="main.rs", data-fold="['9-31', '74-84']", hl_lines=[7, 36, 43, 56, 59, 62, 65]}
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

This gets us this:

```console
cargo run
<span style="font-weight:bold;color:lime;">   Compiling</span> beast v0.1.0 (/Users/code/beast)
<span style="font-weight:bold;color:red;">error[E0616]</span><span style="font-weight:bold;">: field `buffer` of struct `Board` is private</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/player.rs:13:9
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">13</span> <span style="font-weight:bold;color:#3333FF;">|</span>         board.buffer[self.position.1][self.position.0] = Tile::Empty;
   <span style="font-weight:bold;color:#3333FF;">|</span>               <span style="font-weight:bold;color:red;">^^^^^^</span> <span style="font-weight:bold;color:red;">private field</span>

<span style="font-weight:bold;color:red;">error[E0616]</span><span style="font-weight:bold;">: field `buffer` of struct `Board` is private</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/player.rs:22:9
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">22</span> <span style="font-weight:bold;color:#3333FF;">|</span>         board.buffer[self.position.1][self.position.0] = Tile::Player;
   <span style="font-weight:bold;color:#3333FF;">|</span>               <span style="font-weight:bold;color:red;">^^^^^^</span> <span style="font-weight:bold;color:red;">private field</span>

<span style="font-weight:bold;color:red;">error[E0277]</span><span style="font-weight:bold;">: `Player` doesn't implement `Debug`</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:36:2
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">33</span> <span style="font-weight:bold;color:#3333FF;">|</span> #[derive(Debug)]
   <span style="font-weight:bold;color:#3333FF;">|</span>          <span style="font-weight:bold;color:#3333FF;">-----</span> <span style="font-weight:bold;color:#3333FF;">in this derive macro expansion</span>
<span style="font-weight:bold;color:#3333FF;">...</span>
<span style="font-weight:bold;color:#3333FF;">36</span> <span style="font-weight:bold;color:#3333FF;">|</span>     player: Player,
   <span style="font-weight:bold;color:#3333FF;">|</span>     <span style="font-weight:bold;color:red;">^^^^^^^^^^^^^^</span> <span style="font-weight:bold;color:red;">`Player` cannot be formatted using `{:?}`</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">help</span>: the trait `Debug` is not implemented for `Player`
   <span style="font-weight:bold;color:#3333FF;">= </span><span style="font-weight:bold;">note</span>: add `#[derive(Debug)]` to `Player` or manually `impl Debug for Player`
<span style="font-weight:bold;color:aqua;">help</span>: consider annotating `Player` with `#[derive(Debug)]`
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/player.rs:3:1
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">3</span>  <span style="color:lime;">+ #[derive(Debug)]</span>
<span style="font-weight:bold;color:#3333FF;">4</span>  <span style="font-weight:bold;color:#3333FF;">| </span>pub struct Player {
   <span style="font-weight:bold;color:#3333FF;">|</span>

<span style="font-weight:bold;color:red;">error[E0624]</span><span style="font-weight:bold;">: method `render` is private</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:51:29
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">51</span> <span style="font-weight:bold;color:#3333FF;">|</span>         println!(&quot;{}&quot;, self.board.render());
   <span style="font-weight:bold;color:#3333FF;">|</span>                                   <span style="font-weight:bold;color:red;">^^^^^^</span> <span style="font-weight:bold;color:red;">private method</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
  <span style="font-weight:bold;color:#3333FF;">::: </span>src/board.rs:24:2
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">24</span> <span style="font-weight:bold;color:#3333FF;">|</span>     fn render(&amp;self) -&gt; String {
   <span style="font-weight:bold;color:#3333FF;">|</span>     <span style="font-weight:bold;color:#3333FF;">--------------------------</span> <span style="font-weight:bold;color:#3333FF;">private method defined here</span>

<span style="font-weight:bold;color:red;">error[E0624]</span><span style="font-weight:bold;">: method `render` is private</span>
  <span style="font-weight:bold;color:#3333FF;">--&gt; </span>src/main.rs:74:60
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">74</span> <span style="font-weight:bold;color:#3333FF;">|</span>             println!(&quot;\x1B[{}F{}&quot;, BOARD_HEIGHT + 1 + 1, self.board.render());
   <span style="font-weight:bold;color:#3333FF;">|</span>                                                                     <span style="font-weight:bold;color:red;">^^^^^^</span> <span style="font-weight:bold;color:red;">private method</span>
   <span style="font-weight:bold;color:#3333FF;">|</span>
  <span style="font-weight:bold;color:#3333FF;">::: </span>src/board.rs:24:2
   <span style="font-weight:bold;color:#3333FF;">|</span>
<span style="font-weight:bold;color:#3333FF;">24</span> <span style="font-weight:bold;color:#3333FF;">|</span>     fn render(&amp;self) -&gt; String {
   <span style="font-weight:bold;color:#3333FF;">|</span>     <span style="font-weight:bold;color:#3333FF;">--------------------------</span> <span style="font-weight:bold;color:#3333FF;">private method defined here</span>

<span style="font-weight:bold;">Some errors have detailed explanations: E0277, E0616, E0624.</span>
<span style="font-weight:bold;">For more information about an error, try `rustc --explain E0277`.</span>
<span style="font-weight:bold;color:red;">error</span><span style="font-weight:bold;">:</span> could not compile `beast` (bin &quot;beast&quot;) due to 5 previous errors
```

Ok that's fair.
The compiler let's us know that we've been using the `buffer` and the `render` method that hasn't been set to public
yet:

```rust {data-file="board.rs", data-fold="['1-4', '11-22', '30-55']", hl_lines=[8, 24]}
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

It also told us that `Player` doesn't implement `Debug`.
That's also fair because the `Player` struct is used in our `Game` struct and that struct has the `Debug` trait derived.
If that struct has it, all its data must have it too.

```rust {data-file="player.rs", data-fold="['7-25']", hl_lines=[3]}
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

So we added the derive and all the other code but when we run our program again and walk left as the first thing we get
a panic:

```console
cargo run
<span style="font-weight:bold;color:lime;">    Finished</span> `dev` profile [unoptimized + debuginfo] target(s) in 0.00s
<span style="font-weight:bold;color:lime;">     Running</span> `target/debug/beast`
<span style="color:yellow;">▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜</span>
<span style="color:yellow;">▌</span><span style="color:aqua;">◀▶</span>                                                                            <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>          <span style="color:lime;">░░</span><span style="color:lime;">░░</span><span style="color:lime;">░░</span>                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>            <span style="color:yellow;">▓▓</span>                                                                <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟</span>

thread 'main' panicked at src/player.rs:20:32:
attempt to subtract with overflow
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

What does "_attempt to subtract with overflow_" mean?
Also our trusty compiler tells us where this error happened in our code: on line 20 in the `player.rs` file.

```rust {data-file="player.rs", data-fold="['1-12']", hl_lines=[20]}
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

When we start the game our position is `(0,0)` and on line 20 we attempt to subtract `1` from `0`.
But the type of that number is `usize` which means it can't be a value of anything below `0` so Rust panics.
Now thinking about this, what would happen when you walk across to the right and further:

```console
cargo run
<span style="color:yellow;">▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜</span>
<span style="color:yellow;">▌</span>                                                                            <span style="color:aqua;">◀▶</span><span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>          <span style="color:lime;">░░</span><span style="color:lime;">░░</span><span style="color:lime;">░░</span>                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>            <span style="color:yellow;">▓▓</span>                                                                <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▌</span>                                                                              <span style="color:yellow;">▐</span>
<span style="color:yellow;">▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟</span>

thread 'main' panicked at src/player.rs:23:9:
index out of bounds: the len is 39 but the index is 39
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

Yeah that panics too because we're trying to index into our board buffer with a number larger than the index of our
array.

Basically we need to guard against each boundary of our board.

```rust {data-file="player.rs", data-fold="['3-11']", hl_lines=[1, "17-35"]}
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

Now we're checking to make sure we don't do anything illegal with our buffer or our position and running this code gives
us a nice way to walk across our board.

We notice that we're "eating" the blocks on the board as we walk over them but that's OK for now.

## We Have The Start Of A Game

![A screen recording of the board with the player walking around randomly including over Blocks and StaticBlocks and
erasing them as they walk over the tiles.](assets/moving.svg)

This is it.
We did it!
The first part of this tutorial is done and we got a board we can walk around on with a couple tiles hardcoded.

In the next part we will generate a terrain, implement pushing blocks around and look into adding beasts.

<br><br><br>
![A blue rectangular sign reading ‘PLEASE SHARE THIS POST’ mounted on a rustic wooden fence post, with a backdrop of
dense green foliage and a grassy clearing.](assets/share.jpg)
