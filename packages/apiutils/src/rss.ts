import Parser from "rss-parser"

const rssParser = new Parser()

export const parseXML = async (feedUrl: string) => {
  const response = await fetch(feedUrl)
  const xmlData = await response.text()
  const feed = await rssParser.parseString(xmlData)

  return feed
}

export const parseRSSFeed = async (xmlData: string) => {
  const feed = await rssParser.parseString(xmlData)
  return feed
}
