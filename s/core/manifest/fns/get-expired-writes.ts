
import {Manifest} from "../manifest.js"
import {isExpired} from "../../utils/is-expired.js"

export async function* getExpiredWrites({writes}: Manifest) {
	for await (const [id, w] of writes.entries()) {
		if (isExpired(w.created))
			yield id
	}
}

