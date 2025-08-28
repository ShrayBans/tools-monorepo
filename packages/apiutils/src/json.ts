const fs = require("fs")

export const writeToJsonFile = (outputData: any, filePath = ".") => {
  const timestamp = new Date().getTime()
  const fileName = `${filePath}/${timestamp}.json`

  fs.writeFile(fileName, JSON.stringify(outputData), (err: NodeJS.ErrnoException | null) => {
    if (err) throw err
    console.log("The file has been saved!")
  })
}
