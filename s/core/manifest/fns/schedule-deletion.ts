
import {getStats} from "./get-stats.js"
import {Manifest} from "../manifest.js"
import {Hash, Info} from "../../types.js"

export async function scheduleDeletion(manifest: Manifest, hash: Hash, info: Info) {
	const {kv, stats, catalog, trash} = manifest

	const s = await getStats(manifest)
	s.count -= 1
	s.size -= info.size

	await kv.commit([
		catalog.op.delete(hash),
		trash.op.set(info.id, true),
		stats.op.set(s),
	])
}

