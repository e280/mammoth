
import {Kv} from "@e280/kv"
import {collect, got, lane, queue} from "@e280/stz"

import {consts} from "./consts.js"
import {randomId} from "./utils/random-id.js"
import {notFound} from "./utils/not-found.js"
import {MemoryBucket} from "./memory-bucket.js"
import {isExpired} from "./utils/is-expired.js"
import {Hash, Bucket, Stats, Wip} from "./types.js"
import {saveAndHash} from "./utils/save-and-hash.js"

/** file storage datalake, content-addressed with blake3 hashes. */
export class Mammoth {
	#ids // associates file hashes with bucket ids
	#wip // temporary record of writes in-progress
	#stats // statistics about the whole datalake
	#bucket // file blobstore

	// sensitive operations happen sequentially
	#wholesome = lane(consts.max_jobs)

	constructor(bucket: Bucket = new MemoryBucket(), kv = new Kv()) {
		this.#ids = kv.scope<string>("ids")
		this.#wip = kv.scope<Wip>("wip")
		this.#stats = kv.store<Stats>("stats")
		this.#bucket = bucket
	}

	async has(hash: Hash) {
		return this.#ids.has(hash)
	}

	async size(hash: Hash) {
		const id = got(await this.#ids.get(hash), notFound(hash))
		return this.#bucket.size(id)
	}

	async read(hash: Hash) {
		const id = got(await this.#ids.get(hash), notFound(hash))
		return this.#bucket.read(id)
	}

	async delete(hash: Hash) {
		await this.#wholesome(async() => {
			const id = await this.#ids.get(hash)
			if (id) {
				const size = await this.#bucket.size(id)
				await this.#ids.del(hash)
				await this.#bucket.delete(id)
				await this.#updateStats(stats => {
					stats.count -= 1
					stats.size -= size
				})
			}
		})
	}

	async write(readable: ReadableStream<Uint8Array>): Promise<Hash> {
		const id = randomId()

		await this.#wip.set(id, {created: Date.now()})
		const {hash, size} = await saveAndHash(this.#bucket, id, readable)

		await this.#wholesome(async() => {
			if (await this.#ids.has(hash)) {
				await this.#bucket.delete(id) // forget this new file (we already have it)
			}
			else {
				await this.#ids.set(hash, id)
				await this.#updateStats(stats => {
					stats.count += 1
					stats.size += size
				})
			}
		})

		await this.#wip.del(id)
		void this.#selfClean().catch(() => {})
		return hash
	}

	async* hashes() {
		yield* this.#ids.keys()
	}

	async stats() {
		return structuredClone((await this.#stats.get()) ?? {count: 0, size: 0})
	}

	async #updateStats(fn: (stats: Stats) => void) {
		const stats = await this.stats()
		fn(stats)
		await this.#stats.set(stats)
	}

	#selfClean = queue(async() => {
		const limit = consts.self_clean_limit
		const expiredIds = (await collect(this.#wip.entries({limit})))
			.filter(([,wip]) => isExpired(wip))
			.map(([id]) => id)
		await Promise.all(expiredIds.map(id => this.#bucket.delete(id)))
		await this.#wip.del(...expiredIds)
	})
}

