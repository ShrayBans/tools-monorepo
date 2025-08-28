import Fuse from "fuse.js"
import { map, trim } from "lodash-es"


/**
 * FULL EXAMPLE

  const formattedContent = WORKFLOW_TEMPLATES_STATIC
  const [searchQuery, setSearchQuery] = useState("")
  const fuseKeys = ["name", "description"]
  const fuseFormattedContent = useMemo(() => createFuseSearch(fuseKeys, formattedContent), [])
  const filteredContent = useMemo(() => {
    const res = searchTokenizedFuse(searchQuery, formattedContent, fuseFormattedContent, fuseKeys)
    return res
  }, [searchQuery, formattedContent, fuseFormattedContent])

 *
 */

/**
 * Split the provided string by spaces (ignoring spaces within "quoted text") into an array of tokens.
 *
 * @param string
 *
 * @see https://stackoverflow.com/a/16261693/1265472
 *
 * @debt Depending on the outcome of https://github.com/github/codeql/issues/5964 we may end up needing to change
 *   this regex for performance reasons.
 */
export const tokeniseStringWithQuotesBySpaces = (string: string): string[] =>
  string.match(/("[^"]*?"|[^"\s]+)+(?=\s*|\s*$)/g) ?? []

/**
 * Searches fuse with advanced token separation
 *
 * Example:
  const filteredContent = useMemo(() => {
    const res = searchTokenizedFuse(
      searchQuery,
      formattedContent,
      fuseFormattedContent,
      fuseKeys
    )
    return res
  }, [searchQuery, formattedContent, fuseFormattedContent])
 *
 * @param normalizedSearchQuery
 * @param allData
 * @param fuseData
 * @param fuseKeys
 * @returns
 */
export const searchTokenizedFuse = (searchQuery: string, allData, fuseData, fuseKeys: string[]) => {
  const normalizedSearchQuery = trim(searchQuery)

  const tokenisedSearchQuery = tokeniseStringWithQuotesBySpaces(normalizedSearchQuery)

  if (tokenisedSearchQuery.length === 0) return allData

  return fuseData
    .search({
      $and: tokenisedSearchQuery.map((searchToken: string) => {
        const orFields = [
          { name: searchToken },
          ...map(fuseKeys, (key) => {
            return { [key]: searchToken }
          }),
        ]

        return {
          $or: orFields,
        }
      }),
    })
    .map((fuseResult) => fuseResult.item)
}

/**
 * Creates fuse indexed dataset
Example:
  const fuseFormattedContent = useMemo(
    () => createFuseSearch(['id', 'domain', 'artistName'], formattedContent),
    [formattedContent]
  )
 */
export const createFuseSearch = (fuseKeys: string[], data) => {
  const fuse = new Fuse(data, {
    keys: fuseKeys,
    threshold: 0.2,
    ignoreLocation: true, // default False: True - to search ignoring location of the words.
    findAllMatches: true,
  })

  return fuse
}


