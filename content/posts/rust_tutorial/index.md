---
title: 'Rust_tutorial'
date: '2025-04-25T21:11:29+10:00'
draft: true
summary: "TODO"
description: "TODO"
toc: true
readTime: true
autonumber: true
math: true
tags: ["TODO"]
showTags: true
hideBackToTop: false
---

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
