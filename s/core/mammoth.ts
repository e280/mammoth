
import {Kv} from "@e280/kv"
import {collect, got, queue} from "@e280/stz"

import {randomId} from "./utils/random-id.js"
import {notFound} from "./utils/not-found.js"
import {MemoryBucket} from "./memory-bucket.js"
import {isExpired} from "./utils/is-expired.js"
import {saveAndHash} from "./utils/save-and-hash.js"
import {Hash, Bucket, Id, Stats, Wip} from "./types.js"

/** file storage datalake, content-addressed with blake3 hashes. */
export class Mammoth {
	#ids // associates file hashes with bucket ids
	#wip // temporary record of writes in-progress
	#stats // statistics about the whole datalake
	#bucket // file blobstore

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
		const id = await this.#ids.get(hash)
		if (id) {
			const size = await this.#bucket.size(id)
			await this.#ids.del(hash)
			await this.#bucket.delete(id)
			await this.#addSize(-size)
		}
	}

	async write(readable: ReadableStream<Uint8Array>): Promise<Hash> {
		const id = randomId()
		await this.#wip.set(id, {created: Date.now()})

		const {hash, size} = await saveAndHash(this.#bucket, id, readable)
		await this.#wip.del(id)
		await this.#finalizeWrite(hash, id, size)

		void this.#selfClean().catch(() => {})
		return hash
	}

	async* hashes() {
		yield* this.#ids.keys()
	}

	async stats() {
		return (await this.#stats.get()) ?? {size: 0}
	}

	#addSize = queue(async(sizeChange: number) => {
		const stats = await this.stats()
		const size = stats.size + sizeChange
		await this.#stats.set({...stats, size})
	})

	#finalizeWrite = queue(async(hash: Hash, id: Id, size: number) => {
		if (await this.#ids.has(hash)) {
			await this.#bucket.delete(id)
		}
		else {
			await this.#ids.set(hash, id)
			await this.#addSize(size)
		}
	})

	#selfClean = queue(async() => {
		const expiredIds = (await collect(this.#wip.entries({limit: 64})))
			.filter(([,wip]) => isExpired(wip))
			.map(([id]) => id)
		await Promise.all(expiredIds.map(id => this.#bucket.delete(id)))
		await this.#wip.del(...expiredIds)
	})
}

