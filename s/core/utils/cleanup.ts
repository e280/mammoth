
import {Depot} from "../types.js"
import {Manifest} from "../manifest/manifest.js"
import {getExpiredWrites} from "../manifest/fns/get-expired-writes.js"
import {moveWriteToTrash} from "../manifest/fns/move-write-to-trash.js"

export async function cleanup(depot: Depot, manifest: Manifest) {
	for await (const id of getExpiredWrites(manifest))
		await moveWriteToTrash(manifest, id)

	for await (const id of manifest.trash.keys()) {
		await depot.delete(id)
		await manifest.trash.delete(id)
	}
}

