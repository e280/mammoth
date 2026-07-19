
import {Id} from "../../types.js"
import {Manifest} from "../manifest.js"

export async function moveWriteToTrash({kv, writes, trash}: Manifest, id: Id) {
	await kv.transaction(() => [
		writes.write.del(id),
		trash.write.set(id, true),
	])
}

