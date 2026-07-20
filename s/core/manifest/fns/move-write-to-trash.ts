
import {Id} from "../../types.js"
import {Manifest} from "../manifest.js"

export async function moveWriteToTrash({kv, writes, trash}: Manifest, id: Id) {
	await kv.commit([
		writes.x.delete(id),
		trash.x.set(id, true),
	])
}

