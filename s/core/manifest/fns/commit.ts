
import {getStats} from "./get-stats.js"
import {Manifest} from "../manifest.js"
import {Hash, Info} from "../../types.js"

export async function commit(manifest: Manifest, hash: Hash, info: Info) {
	const {kv, stats, catalog, writes, trash} = manifest
	const isNewFile = !await catalog.has(hash)

	if (isNewFile) {
		const s = await getStats(manifest)
		s.count += 1
		s.size += info.size
		await kv.commit([
			writes.op.delete(info.id),
			catalog.op.set(hash, info),
			stats.op.set(s),
		])
	}
	else {
		await kv.commit([
			writes.op.delete(info.id),
			trash.op.set(info.id, true),
		])
	}
}

