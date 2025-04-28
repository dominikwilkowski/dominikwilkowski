# How to run this site

## Prerequisites

- Install [Hugo](https://gohugo.io/)

## Local development

```sh
hugo server --buildDrafts --disableFastRender
```

or to make sure you get the absolute latest (from the repo root folder)

```sh
rm -rf public && hugo --gc --ignoreCache && hugo server --buildDrafts --disableFastRender
```

## Add new blog posts

```sh
hugo new content posts/your-title
```

## Deployment

```sh
make deploy
```
