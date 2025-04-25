---
title: "About"
description: "TODO"
autonumber: true
showTags: false
hideBackToTop: true
hideBreadcrumbs: true
---

```rust {hl_lines=[3,"6-9"]}
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

_This site was built with <a href="https://gohugo.io/" target="_blank">Hugo</a> and <a href="https://github.com/tomfran/typo" target="_blank">tomfran/typo</a> and is <a href="https://github.com/dominikwilkowski/dominikwilkowski" target="_blank">open source</a>._
