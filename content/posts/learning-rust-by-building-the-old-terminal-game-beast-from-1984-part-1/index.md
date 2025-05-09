---
title: 'An intro into rust by building an old terminal game from 1984, Part 1'
date: '2025-04-26T21:11:29+10:00'
draft: true
summary: >
  I've found building the game BEAST from 1984 helped me teach rust as it touches many concepts of rust and gets us to
  see something pretty quickly.
description: "We are building the terminal game BEAST together to learn to apply rust to a project"
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
So I thought I write it up in a series of blog posts.

A small note to start: I'm by no means an expert in rust. I love the language and continue to learn so if you find
anything fishy in these posts (and it's not a [_turbofish_](https://turbo.fish/)), do let me know by submitting
[a pull request or an issue](https://github.com/dominikwilkowski/dominikwilkowski).

## Prerequisites

I will assume you have some basic knowledge of rust and won't go too deep into language features.
What I want to focus on is the use of the language for something you can see and play with.
This is how I learn myself.

> It's not just knowing what each of the bits are in the language, it's how you use them and how it all comes together.

But if you don't know the bits, I recommend you start with the [official book](https://doc.rust-lang.org/book/).
And if you're so inclined, do have a look at [easy_rust](github.com/Dhghomon/easy_rust) which is a great way to learn
rust as it is organized in small chapters not longer than 20min each with videos in plain language.
Lastely you should check out [rustlings](https://github.com/rust-lang/rustlings) to get a feel for the language.

## What we're building

[BEAST](https://en.wikipedia.org/wiki/Beast_(video_game)) is a text-based action game developed for MS-DOS by Dan Baker, Alan Brown, Mark Hamilton, and Derrick Shadel. It was distributed as shareware in 1984.

It's a game I grew up with back when I was young _(and everything was still black and white, there were no mobile phones
and computer monitors were monochrome and emitted radiation)_.

<div style="position:relative;height:0;padding-bottom:68.547%;margin:1.5rem 0;">
	<iframe src="https://archive.org/embed/Beast_1020" width="560" height="384" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>
</div>

To get a feel for the game, play it in the iframe above or on [archive.org](https://archive.org/embed/Beast_1020)
directly.
But here in borad strokes:

- You're a player on a 2D board ◀▶
- The board contains blocks you can push ░░
- ... and blocks you can't push ▓▓
- There are beasts trying to get you ├┤
- To win you have to squish the beasts between two blocks ◀▶░░├┤░░

![Animated scene from the 1984 ASCII game BEAST, showing a blue diamond-shaped player character navigating a maze-like environment made of green block clusters, avoiding obstacles and moving toward a yellow target area in the top right
corner.
The screen features a classic DOS-style black background with retro text-based graphics](assets/movements.gif#small)

![The player moves a blue diamond character to push a wall block, crushing a red H-shaped beast between two blocks](assets/squish.gif#small)

There are more advanced challenges in later levels but for this tutorial we will focus only on the basics so you can add
your own levels later yourself.

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

Ok let's start thinking what we're about to do.

![Screenshot from the 1984 ASCII game BEAST. The screen is filled with a grid of green and yellow blocky patterns representing movable blocks and solid blocks. The player, shown as a cyan diamond shape, is located in the bottom-left corner. Several red 'H' characters, representing hostile beasts, are scattered on the right side of the screen. The game has a dark black background bordered by a yellow frame, with the environment laid out in a procedurally generated maze-like pattern.](assets/board.png "How do we want to represent this board in code, where's the source of truth, how do we render it and all that while keeping the sanity of future-us?")

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
each side (`30 * 2 + 1 + 1 = 80`) and so we stay within the
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

It helps to visualize it because if you squit a little it actually looks like a board.
We have rows and columns, we have items for each tile, it's square.

Now let's actually try to get this output ourself by printing our board:

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
1. ``error[E0277]: the trait bound `Tile: Copy` is not satisfied``<br>
    This error occurs because our `Tile` enum is being copied into our array but doesn't currenlty have the ability
    ([trait](https://doc.rust-lang.org/book/ch10-02-traits.html)) to be copied.
    Rust will actually tell us how to solve it too in two different ways which is awesome.
2. ```error[E0277]: `Board` doesn't implement `Debug```<br>
    The second error happens because we're trying to print the struct and rust doesn't know how to display this custom data
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
``error[E0277]: the trait bound `Tile: Copy` is not satisfied`` is gone

**The bad news**: a new one poped up:<br>
``error[E0277]: the trait bound `Tile: Clone` is not satisfied``

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
Ok let's just ride this wave and solve the second issue as well.
We can see our `Board` struct needs the `Debug` trait.
But because we are at the top of our game and feel great, we notice that part of the `Board` struct is the `Tile` enum
and if we were to just give the `Board` the debug trait we're guessing the compiler will let us gently know that the
enum, being part of the thing we're trying to display with the `Debug` trait, will also need this trait.
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

And what do you know: the compiler shows us some warnings about unused options and fields but it does ... **compile**.
Yay us!

The output is ... large and more importantly, it doesn't look like a board yet.
So let's work on rendering the output in a way that feels more board-game-y.

## Rendering

To render the board we add a `render` method to the `Board` struct.
We will have to interate over each row in our `buffer` and within each row we will iterate over each column in each row.
Then we [`match`](https://doc.rust-lang.org/std/keyword.match.html) against the column which contains our tile.

Lastely we have to go into our `main` function and create an instance of our `Board` and then call the render method and
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

> By now you've seen us use two different types of something called "self":
> - `Self` in the `new` method
> - `self` in the `render` method
> 
> The way I keep them separated in my head is like this:
> - `Self` _points to the type._<br>
> 	It's like in our case we COULD use `Board` but because `Self` means the same thing and never changes even if we change
> 	the struct name, it's more "stable".
> - `self` _points to the instance._<br>
> 	An instance will have data associated with it so we can access it.
> 	A type has no data, only types.

Then we make a new mutable `String` called `output` and iterate in a nested loop over each tile and push into `output`
what the tile we match should be displayed as, before returning it.

Note in the code above, we use two different methods on `output`: `push_str` and `push`.
That's because a line break `\n` is a `char` and those can be pushed into a `String` much faster than other string
slices.

We also opted for a tile being 2 characters long from the terminal perspective.
That's what the original games does, (I'm just trying to stay consistent).
You're welcome to change it to anything you like.

Running `cargo run`, we still get a few warnings about unused options, which is fair, but we also get a big empty blob
that gets printed.
Functionally this is correct, there is a board that is just completely empty so we really don't print anything for
`Tile::Empty`.
But we're missing a refernce to where the board starts and ends to really see the empty board.
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
		output.push_str(&format!("▙{}▟\n", "▄".repeat(39 * 2)));

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
Lastely we add the bottom border in a very similar way we added the top.

I don't know about you but I don't like magic numbers in my code.
We now have `39 * 2` and multiple instances of hardcoded `39` and `20` throughout our code.
At some point our future-self is going to ask:
> What does this number mean?

or

> Where else do I have to change this number to change the window size?

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
		output.push_str(&format!("▙{}▟\n", "▄".repeat(BOARD_WIDTH * TILE_SIZE)));

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

Ok our game is getting closer:

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

Ok this looks good.
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
		output.push_str(&format!("▙{}▟\n", "▄".repeat(BOARD_WIDTH * TILE_SIZE)));

		output
	}
}

fn main() {
	let board = Board::new();
	println!("{}", board.render());
}
```

We create a mutable variable called `buffer` where we stick the nested array into and then set a couple tiles in that
buffer to `Tile::Player`, `Tile::Block` and `Tile::StaticBlock`.
We don't have to do `buffer: buffer` in the `Self` block because of
[field init shorthand syntax](https://doc.rust-lang.org/book/ch05-01-defining-structs.html?utm_source=chatgpt.com#using-the-field-init-shorthand)
rust has built in.

All that gets us this little preview via `cargo run`:

```console
cargo run
<span style="font-weight:bold;"></span><span style="font-weight:bold;color:lime;">    Finished</span> `dev` profile [unoptimized + debuginfo] target(s) in 0.11s
<span style="font-weight:bold;"></span><span style="font-weight:bold;color:lime;">     Running</span> `target/debug/beast`
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

Next up: Adding <span style="color:#ff0000;">c</span><span style="color:#ff00cb;">o</span><span style="color:#6600ff;">l</span><span style="color:#0065ff;">o</span><span style="color:#00ffcb;">r</span><span style="color:#00ff00;">s</span>.

## A Brief Intro into ANSI Escape Sequences

Install the [Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/install).

## Rendering but with colors

## Listening to `stdin`

## Generating the terrain

## Pushing blocks
