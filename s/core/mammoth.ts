
import {Kv} from "@e280/kv"
import {lane, queue} from "@e280/stz"

import {consts} from "./consts.js"
import {save} from "./utils/save.js"
import {Hash, Bucket} from "./types.js"
import {cleanup} from "./utils/cleanup.js"
import {randomId} from "./utils/random-id.js"
import {MemoryBucket} from "./memory-bucket.js"
import {Manifest} from "./manifest/manifest.js"
import {commit} from "./manifest/fns/commit.js"
import {needInfo} from "./manifest/fns/need-info.js"
import {getStats} from "./manifest/fns/get-stats.js"
import {scheduleDeletion} from "./manifest/fns/schedule-deletion.js"
import {moveWriteToTrash} from "./manifest/fns/move-write-to-trash.js"

/** file storage datalake, content-addressed with blake3 hashes. */
export class Mammoth {
	#bucket
	#manifest
	#wholesome = lane(consts.max_jobs)

	constructor(bucket: Bucket = new MemoryBucket(), kv = new Kv()) {
		this.#bucket = bucket
		this.#manifest = new Manifest(kv)
	}

	async* entries() {
		yield* this.#manifest.catalog.entries()
	}

	async has(hash: Hash) {
		return this.#manifest.catalog.has(hash)
	}

	async info(hash: Hash) {
		return needInfo(this.#manifest, hash)
	}

	async stats() {
		return getStats(this.#manifest)
	}

	async read(hash: Hash) {
		const {id} = await this.info(hash)
		return this.#bucket.read(id)
	}

	async delete(hash: Hash) {
		await this.#wholesome(async() => {
			const info = await this.#manifest.catalog.get(hash)
			if (info)
				await scheduleDeletion(this.#manifest, hash, info)
		})
		await this.#cleanup()
	}

	async write(readable: ReadableStream<Uint8Array>): Promise<Hash> {
		const id = randomId()
		await this.#manifest.writes.set(id, {created: Date.now()})
		try {
			const analysis = await save(this.#bucket, id, readable)
			const {hash, size} = analysis
			const info = {id, size, added: Date.now()}
			await this.#wholesome(() => commit(this.#manifest, hash, info))
			return analysis.hash
		}
		catch (error) {
			await moveWriteToTrash(this.#manifest, id)
			throw error
		}
		finally {
			void this.#cleanup().catch(e => console.error("cleanup failed", e))
		}
	}

	#cleanup = queue(() => cleanup(this.#bucket, this.#manifest), consts.max_jobs)
}

