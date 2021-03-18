import fs from "fs"
import path from "path"
import { ASSETS_PATH, CONTENT_PATH, OUT_PATH, PAGES_PATH } from "./constants"
import marked from "marked"
import { Page } from "./types"

// remove output directory
fs.rmSync(OUT_PATH, { recursive: true })

// create output directory
fs.mkdirSync(OUT_PATH)

// copy assets first
for (const filename of fs.readdirSync(ASSETS_PATH)) {
  fs.copyFileSync(
    path.join(ASSETS_PATH, filename),
    path.join(OUT_PATH, filename)
  )
}

// add content to html
const contents = fs.readdirSync(CONTENT_PATH).map((filename) => {
  return {
    name: path.basename(filename, ".md"),
    content: marked(
      fs.readFileSync(path.join(CONTENT_PATH, filename)).toString()
    ),
  }
})
const pages: Page[] = fs.readdirSync(PAGES_PATH).map((filename) => {
  return {
    filename,
    content: fs.readFileSync(path.join(PAGES_PATH, filename)).toString(),
  }
})

const newPages: Page[] = []

for (const page of pages) {
  if (/{{(.*?)}}/g.test(page.content)) {
    let bufPageContent = page.content
    for (const content of contents) {
      bufPageContent = bufPageContent.replace(
        `{{#include ${content.name}}}`,
        content.content
      )
    }
    newPages.push({ filename: page.filename, content: bufPageContent })
  } else {
    newPages.push(page)
  }
}

for (const page of newPages) {
  console.log("Writing", page.filename, "...")

  fs.writeFileSync(path.join(OUT_PATH, page.filename), page.content)
}
