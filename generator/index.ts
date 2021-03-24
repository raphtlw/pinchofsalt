import Handlebars from "handlebars"
import fs from "fs-extra"
import path from "path"
import { dirs } from "./values"
import cp from "child_process"
import marked from "marked"
import glob from "glob"

type TemplateData = {
  [key: string]: any
}

async function buildHTML(srcPath: string, data: TemplateData) {
  const source = fs.readFileSync(srcPath).toString()
  const template = Handlebars.compile(source)
  const output = template(data)

  return output
}

async function main() {
  // create output folder first to avoid errors
  if (!fs.existsSync(dirs.DST)) {
    fs.mkdir(dirs.DST).catch((e) => {
      if (e) console.log(e)
    })
  }

  // build css
  if (!fs.existsSync(dirs.STYLES)) {
    fs.mkdir(dirs.STYLES).catch((e) => {
      if (e) console.log(e)
    })
  }

  cp.exec(
    `postcss ${path.join(dirs.STYLES, "styles.css")} -o ${path.join(
      dirs.DST,
      "styles",
      "styles.css"
    )}`,
    (err, stdout, stderr) => {
      if (err) throw err

      if (stdout) console.log(stdout)
      if (stderr) console.log(stderr)
    }
  )

  // copy assets to output first
  fs.copy(dirs.ASSETS, dirs.DST).catch((e) => {
    if (e) throw e
  })

  // also get all the data that is used to fill up the html templates
  let templateData: TemplateData = {}

  const componentData = {}
  for (const filename of fs.readdirSync(dirs.COMPONENTS)) {
    const componentCode = fs
      .readFileSync(path.join(dirs.COMPONENTS, filename))
      .toString()
    componentData[filename.replace(".html", "")] = componentCode
  }
  templateData.components = componentData

  // generate html from templates
  for (const filename of fs.readdirSync(dirs.SRC)) {
    if (filename.endsWith(".html") || filename.endsWith(".htm")) {
      const srcPath = path.join(dirs.SRC, filename)

      buildHTML(srcPath, templateData).then((html) => {
        fs.writeFile(path.join(dirs.DST, filename), html)
          .then(() => {
            console.log(`${filename} built.`)
          })
          .catch((e) => {
            if (e) throw e
          })
      })
    }
  }

  // special cases
  const templatePath = path.join(dirs.RECIPES, "template.html")
  const template = fs.readFileSync(templatePath).toString()
  fs.copySync(dirs.RECIPES, path.join(dirs.DST, "recipes"))
  for (const filePath of glob.sync(path.join(dirs.RECIPES, "**", "*.md"))) {
    const markdownContents = fs.readFileSync(filePath).toString()
    const htmlContents = marked(markdownContents)
    const newFileContents = template.replace("<!--CONTENT-->", htmlContents)

    const htmlFilePath = path.join(
      dirs.DST,
      "recipes",
      `${path.basename(filePath, ".md")}.html`
    )

    fs.writeFileSync(htmlFilePath, newFileContents)

    const finalHTML = await buildHTML(htmlFilePath, templateData)
    fs.writeFileSync(htmlFilePath, finalHTML)
    console.log(`${htmlFilePath} built.`)
  }
}

main()
