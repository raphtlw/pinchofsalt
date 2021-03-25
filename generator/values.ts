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

type RecipeItem = {
  name: string
  path: string
}
type RecipeCatalogItem = {
  category: string
  recipes: RecipeItem[]
}

// Recipe catalog
export const recipeCatalog: RecipeCatalogItem[] = [
  {
    category: "Easy to cook",
    recipes: [
      {
        name: "Garlicky Lamb Chops",
        path: "/recipes/garlicky-lamb-chops/index.html",
      },
      {
        name: "Baked Feta Pasta",
        path: "/recipes/baked-feta-pasta/index.html",
      },
      {
        name: "Honey Garlic Glazed Salmon",
        path: "/recipes/honey-garlic-glazed-salmon/index.html",
      },
    ],
  },
]
