import Handlebars from "handlebars"
import fs from "fs-extra"
import path from "path"
import { dirs } from "./values"
import cp from "child_process"
import marked from "marked"
import glob from "glob"
import fm from "front-matter"

type TemplateData = {
  [key: string]: any
}

async function buildHTML(source: string, data: TemplateData) {
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

  // recipes
  const recipeCatalog = []
  for (const filePath of glob.sync(path.join(dirs.RECIPES, "**", "*.md"))) {
    const fileContents = fs.readFileSync(filePath).toString()
    const contents = fm(fileContents)
    const recipeCategoryIndex = recipeCatalog.findIndex(
      (e) => e.category === contents.attributes["category"]
    )
    const recipePath = `/recipes/${contents.attributes["dirname"]}/index.html`
    if (recipeCategoryIndex !== -1) {
      recipeCatalog[recipeCategoryIndex].recipes.push({
        name: contents.attributes["title"],
        path: recipePath,
      })
    } else {
      recipeCatalog.push({
        category: contents.attributes["category"],
        recipes: [
          {
            name: contents.attributes["title"],
            path: recipePath,
          },
        ],
      })
    }
  }

  templateData.recipes = recipeCatalog

  // components
  const componentData = {}
  for (const filename of fs.readdirSync(dirs.COMPONENTS)) {
    const componentCode = fs
      .readFileSync(path.join(dirs.COMPONENTS, filename))
      .toString()
    componentData[filename.replace(".html", "")] = componentCode
  }
  templateData.components = componentData

  // generate html from templates
  for (const filePath of glob.sync(path.join(dirs.SRC, "**", "*.html"), {
    ignore: [path.join(dirs.COMPONENTS, "**", "*")],
  })) {
    const fileContent = fs.readFileSync(filePath).toString()

    buildHTML(fileContent, templateData).then((html) => {
      fs.writeFile(filePath.replace("src", "dist"), html)
        .then(() => {
          console.log(`${filePath} built.`)
        })
        .catch((e) => {
          if (e) throw e
        })
    })
  }

  // special cases
  const templatePath = path.join(dirs.RECIPES, "template.html")
  const template = fs.readFileSync(templatePath).toString()
  fs.copySync(dirs.RECIPES, path.join(dirs.DST, "recipes"))
  for (const filePath of glob.sync(path.join(dirs.RECIPES, "**", "*.md"))) {
    const fileContents = fs.readFileSync(filePath).toString()
    const contents = fm(fileContents)
    const htmlContents = marked(contents.body)
    const newFileContents = template
      .replace("<!--CONTENT-->", htmlContents)
      .replace("<!--TITLE-->", contents.attributes["title"])
      .replace("<!--PREVIEW_IMAGE-->", contents.attributes["preview"])

    const outFilePath = filePath.replace("src", "dist").replace(".md", ".html")

    const finalHTML = await buildHTML(newFileContents, templateData)
    fs.writeFileSync(outFilePath, finalHTML)
    console.log(`${filePath} built.`)
  }
}

main()
