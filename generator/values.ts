import path from "path"

export const dirs = {
  get SRC() {
    return path.join(process.cwd(), "src")
  },
  get ASSETS() {
    return path.join(this.SRC, "assets")
  },
  get DST() {
    return path.join(process.cwd(), "dist")
  },
  get COMPONENTS() {
    return path.join(this.SRC, "components")
  },
  get STYLES() {
    return path.join(this.SRC, "styles")
  },
  get RECIPES() {
    return path.join(this.SRC, "recipes")
  },
}

// Recipe catalog
export const recipeCatalog = [
  {
    category: "Easy to cook",
    recipes: [
      {
        name: "Garlicky Lamb Chops",
        path: "/recipes/garlicky-lamb-chops/index.html",
      },
    ],
  },
]
