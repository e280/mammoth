
import {Manifest} from "../manifest.js"

export async function getStats({stats}: Manifest) {
	return structuredClone(
		(await stats.get())
			?? {count: 0, size: 0}
	)
}

