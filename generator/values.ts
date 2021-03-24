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
}
