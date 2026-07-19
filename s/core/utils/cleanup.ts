
import {Bucket} from "../types.js"
import {Manifest} from "./manifest.js"

export async function cleanup(bucket: Bucket, manifest: Manifest) {
	for await (const id of manifest.getExpiredWipIds())
		await manifest.moveWipToTrash(id)

	for await (const id of manifest.listTrashIds()) {
		await bucket.delete(id)
		await manifest.dropTrashRecord(id)
	}
}

