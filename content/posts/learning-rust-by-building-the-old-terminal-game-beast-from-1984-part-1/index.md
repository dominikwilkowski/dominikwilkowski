---
title: 'An intro into rust by building an old terminal game from 1984, Part 1'
date: '2025-04-26T21:11:29+10:00'
draft: false
visibility: false
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

<div class="ribbon"><img alt="Certified organic content, no AI used" src="/img/stamp.svg" title="I'm perfectly able to add my own em dashes, thank you very much!"></div>

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
1. <span class="console-line"><span style="color:red;">error[E0277]</span>: the trait bound `Tile: Copy` is not satisfied</span><br>
    This error occurs because our `Tile` enum is being copied into our array but doesn't currenlty have the ability
    ([trait](https://doc.rust-lang.org/book/ch10-02-traits.html)) to be copied.
    Rust will actually tell us how to solve it too in two different ways which is awesome.
2. <span class="console-line"><span style="color:red;">error[E0277]</span>: `Board` doesn't implement `Debug`</span><br>
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
		output.push_str(&format!("▙{}▟\n", "▄".repeat(BOARD_WIDTH * TILE_SIZE)));

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
rust has built in.

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

The syntaxt of them is: `ESCAPE` `[` `CODE` and when you print this to most terminals it will be interpreted as a command
rather than as text.

There are many different things you can control with those sequences but for the purpose of this tutorial we will be
focusing only on color and cursor position.

Here is a short summary of colors and cursor codes we might need:

### Colors

| Code               | What it does       |
| ------------------ | ------------------ |
| `ESCAPE` `[` `30m` | White font color   |
| `ESCAPE` `[` `31m` | Red font color     |
| `ESCAPE` `[` `32m` | Green font color   |
| `ESCAPE` `[` `33m` | Yellow font color  |
| `ESCAPE` `[` `34m` | Blue font color    |
| `ESCAPE` `[` `35m` | Magenta font color |
| `ESCAPE` `[` `36m` | Cyan font color    |
| `ESCAPE` `[` `37m` | Black font color   |
| `ESCAPE` `[` `39m` | Reset font color   |

### Cursor

| Code                | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `ESCAPE` `[` `?25l` | Hide cursor                                      |
| `ESCAPE` `[` `?25h` | Show cursor                                      |
| `ESCAPE` `[` n `F`  | Move cursor to beginning of line, `n` lines up   |
| `ESCAPE` `[` n `E`  | Move cursor to beginning of line, `n` lines down |

`ESCAPE` in rust via the print macro would be `\x1B` so looking at this we could make something yellow within a sentence
so let's try it out:

```rust {data-file="main.rs", data-fold="['1-51']" hl_lines=["53-55"]}
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

```rust {data-file="main.rs", data-fold="['1-51']" hl_lines=["55-56"]}
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

```rust {data-file="main.rs", data-fold="['1-51']" hl_lines=["55-57"]}
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
	// let board = Board::new();
	// println!("{}", board.render());
	println!("Hello");
	std::thread::sleep(std::time::Duration::from_secs(3));
	println!("\x1B[1FWorld");
}
```

Now when you run `cargo run` you see "Hello" printed first, then after 3 seconds it's replaced by "World".
This is how any anymations in the terminal work, by moving the cursor we constantly just overwrite the previous frame
with the next frame.
We will use this technique later when we start moving around on the board.

## Rendering but with colors

Now that we know how to add colors to our output let's make our `render` method prettier:

```rust {data-file="main.rs", data-fold="['1-30']" hl_lines=[32, 35, "39-41", 44, 46, "53-54"]}
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
		let mut output = format!("\x1B[33m▛{}▜\x1B[39m\n", "▀".repeat(BOARD_WIDTH * TILE_SIZE));

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
		output.push_str(&format!("\x1B[33m▙{}▟\x1B[39m\n", "▄".repeat(BOARD_WIDTH * TILE_SIZE)));

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

But I gotta say: looking at the code, it's hard to see where an ANSI escape sequence ends and our output starts.
Let's clean this up by adding some consts for each of the colors:

```rust {data-file="main.rs", data-fold="['1-3', '10-35', '56-60']" hl_lines=["5-8", 37, 40, "44-46", 49, 51]}
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
		let mut output = format!("{ANSI_YELLOW}▛{}▜{ANSI_RESET}\n", "▀".repeat(BOARD_WIDTH * TILE_SIZE));

		for rows in self.buffer {
			output.push_str(&format!("{ANSI_YELLOW}▌{ANSI_RESET}"));
			for tile in rows {
				match tile {
					Tile::Empty => output.push_str("  "),
					Tile::Player => output.push_str(&format!("{ANSI_CYAN}◀▶{ANSI_RESET}")),
					Tile::Block => output.push_str(&format!("{ANSI_GREEN}░░{ANSI_RESET}")),
						Tile::StaticBlock => output.push_str(&format!("{ANSI_YELLOW}▓▓{ANSI_RESET}")),
				}
			}
			output.push_str(&format!("{ANSI_YELLOW}▐{ANSI_RESET}\n"));
		}
		output.push_str(&format!("{ANSI_YELLOW}▙{}▟{ANSI_RESET}\n", "▄".repeat(BOARD_WIDTH * TILE_SIZE)));

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
> Here, however, we peak into what a crate like crossterm would do under the hood for a terminal that supports our
> sequences.

Our code is much more readable now and we can start listening to keyboard input.

## Listening to `stdin`

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
So we need a `play` method that listens to keyboad input and calls `render` when the right keys have been pressed.

Listening to `stdin` means we have to lock `stdin` for reading and direct that stream to a buffer which we can `match`
against:

```rust {data-file="main.rs", data-fold="['3-56']" hl_lines=[1, "58-72", 77]}
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
		let mut output = format!("{ANSI_YELLOW}▛{}▜{ANSI_RESET}\n", "▀".repeat(BOARD_WIDTH * TILE_SIZE));

		for rows in self.buffer {
			output.push_str(&format!("{ANSI_YELLOW}▌{ANSI_RESET}"));
			for tile in rows {
				match tile {
					Tile::Empty => output.push_str("  "),
					Tile::Player => output.push_str(&format!("{ANSI_CYAN}◀▶{ANSI_RESET}")),
					Tile::Block => output.push_str(&format!("{ANSI_GREEN}░░{ANSI_RESET}")),
					Tile::StaticBlock => output.push_str(&format!("{ANSI_YELLOW}▓▓{ANSI_RESET}")),
				}
			}
			output.push_str(&format!("{ANSI_YELLOW}▐{ANSI_RESET}\n"));
		}
		output.push_str(&format!("{ANSI_YELLOW}▙{}▟{ANSI_RESET}\n", "▄".repeat(BOARD_WIDTH * TILE_SIZE)));

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
[`Write`](https://doc.rust-lang.org/std/io/trait.Write.html) trait from the [`io`](https://doc.rust-lang.org/std/io/)
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
Since it's easier to read characters then bytes I convert the byte into a `char` and then match against it.

> [!Note]
> You could very well also write the below but I find that less readable:
> ```rust
> match buffer[0] {
> 	b'q' => {
> 		println!("Good bye");
> 		break;
> 	},
> 	_ => {},
> }
> ```
> In my very limited testing both compile to the same assembly: [char](https://play.rust-lang.org/?version=stable&mode=release&edition=2024&gist=41ae4f4a647997baf5b951ba2a283ebc) vs [byte](https://play.rust-lang.org/?version=stable&mode=release&edition=2024&gist=3122c1ff9734439bd3dc78fe437973b6)

Inside the match we just check for the letter `q` (lowercase) and print a good bye message and break our `while` loop
thus ending our program.

## Terminal modes

https://en.wikipedia.org/wiki/Terminal_mode

By default, Unix-style tty (i.e. console) drivers will take input in "cooked mode". In this mode, it provides a certain amount of command-line editing. The user can type in a line of input, possibly deleting and retyping some of it (but that doesn't always work) and the program won't see it until the user hits enter.

This probably harkens back to the days of hardware terminals connected to the computer via a serial line; if the terminal handles some of the low-level editing, the computer doesn't have to. It also gives trivial C programs some basic input editing for free.

In contrast, raw mode sets up the TTY driver to pass every character to the program as it is typed. Programs (on Unixish operating systems) are started in cooked mode by default and need to enable raw mode.

How to do this used to vary wildly between operating systems, although POSIX has standardized this stuff these days. On Linux, you can read the "termios" and "tty_ioctl" man pages for the documentation. Basically, you get a data structure containing the tty settings, modify the parts you care about (specifically, enabling raw mode) and then pass it back.

Another possibility is to just use the ncurses library. It abstracts away all of that stuff for you.

in raw mode it is the application's job to echo the characters typed

## Generating the terrain

## Pushing blocks

![A blue rectangular sign reading ‘PLEASE SHARE THIS POST’ mounted on a rustic wooden fence post, with a backdrop of
dense green foliage and a grassy clearing.](assets/share.jpg)
