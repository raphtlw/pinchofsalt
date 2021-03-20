import fs from "fs-extra"
import path from "path"
import {
  ASSETS_PATH,
  COMPONENTS_PATH,
  CONTENT_PATH,
  OUT_PATH,
  PAGES_PATH,
} from "./constants"
import marked from "marked"
import { Page } from "./types"
import glob from "glob"
import postcss from "postcss"
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer"

// create output directory
try {
  fs.mkdirSync(OUT_PATH)
} catch (e) {}

// copy assets first
;(async () => {
  for (const folderpath of fs.readdirSync(ASSETS_PATH)) {
    if (folderpath === "styles") {
      fs.copySync(
        path.join(ASSETS_PATH, "styles"),
        path.join(OUT_PATH, "styles"),
        { recursive: true }
      )
      const srcStylesPath = path.join(ASSETS_PATH, folderpath, "styles.css")
      const dstStylesPath = path.join(OUT_PATH, "styles", "styles.css")
      const srcStyles = fs.readFileSync(srcStylesPath)
      postcss([tailwindcss, autoprefixer])
        .process(srcStyles, {
          from: srcStylesPath,
          to: dstStylesPath,
        })
        .then((res) => fs.writeFileSync(dstStylesPath, res.css))
    } else {
      fs.copy(
        path.join(ASSETS_PATH, folderpath),
        path.join(OUT_PATH, folderpath)
      )
    }
  }
})()

// get contents
const contents = fs.readdirSync(CONTENT_PATH).map((filename) => {
  return {
    name: path.basename(filename, ".md"),
    content: marked(
      fs.readFileSync(path.join(CONTENT_PATH, filename)).toString()
    ),
  }
})

// get pages
const pages: Page[] = fs.readdirSync(PAGES_PATH).map((filename) => {
  return {
    filename,
    content: fs.readFileSync(path.join(PAGES_PATH, filename)).toString(),
  }
})

// get components
const components = fs.readdirSync(COMPONENTS_PATH).map((filename) => {
  return {
    name: path.basename(filename, ".html"),
    content: fs.readFileSync(path.join(COMPONENTS_PATH, filename)).toString(),
  }
})

const newPages: Page[] = []

// replace variables with relevant items
for (const page of pages) {
  for (const content of contents) {
    page.content = page.content.replace(
      `{{#content ${content.name}}}`,
      content.content
    )
  }

  for (const component of components) {
    page.content = page.content.replace(
      `{{#include ${component.name}}}`,
      component.content
    )
  }

  newPages.push(page)
}

for (const page of newPages) {
  console.log(`Writing ${page.filename}...`)

  fs.writeFile(path.join(OUT_PATH, page.filename), page.content)
}
