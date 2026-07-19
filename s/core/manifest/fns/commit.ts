
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
		await kv.transaction(() => [
			writes.write.del(info.id),
			catalog.write.set(hash, info),
			stats.write.set(s)
		])
	}
	else {
		await kv.transaction(() => [
			writes.write.del(info.id),
			trash.write.set(info.id, true),
		])
	}
}

