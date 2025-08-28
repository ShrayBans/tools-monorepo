import _ from "lodash-es";

type PlainObject = Record<string, any>;

/**
 * Performs a full‐text search over an array of objects, returning only
 * those items where every “term” in the query appears (as a substring,
 * case‐insensitive) in at least one of the specified fields (or any
 * string/number field if no keys are provided).
 *
 * @template T
 * @param data
 *   The array of objects to search.
 * @param query
 *   The full‐text query. Splits on whitespace and treats each segment as a required term.
 * @param keys
 *   (Optional) A list of keys of T to search in. If omitted, all own enumerable
 *   properties whose values are string or number will be checked.
 * @returns
 *   A filtered array of objects where each object matches all terms.
 */
export function fullTextSearch<T extends PlainObject>(
	data: T[],
	query: string,
	keys?: (keyof T)[],
): T[] {
	// 1. Split query into individual terms, ignore empty strings:
	const terms = _.chain(query)
		.toLower() // case‐insensitive
		.split(/\s+/) // split on whitespace
		.filter((t) => t.length > 0)
		.uniq()
		.value() as string[];

	if (terms.length === 0) {
		// If query is empty or only whitespace, return original array:
		return data;
	}

	return _.filter(data, (item) => {
		// 2. Determine which keys to inspect for this item
		const searchKeys: string[] = keys
			? // user‐specified keys (we’ll coerce to string[])
				(keys as string[])
			: // all enumerable keys whose values are string or number
				_.chain(item)
					.keys()
					.filter((k) => {
						const v = (item as any)[k];
						return _.isString(v) || _.isNumber(v);
					})
					.value();

		// 3. Pre‐compute a lowercase “haystack” map
		const haystacks: string[] = searchKeys.map((k) => {
			const val = _.get(item, k);
			// Convert undefined/null to empty, numbers to string, etc.
			return _.toLower(String(val ?? ""));
		});

		// 4. Check that every term appears in at least one of the haystacks
		return _.every(terms, (term) =>
			_.some(haystacks, (fieldText) => fieldText.includes(term)),
		);
	});
}
