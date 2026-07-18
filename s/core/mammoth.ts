
import {Kv} from "@e280/kv"
import {lane, queue} from "@e280/stz"

import {consts} from "./consts.js"
import {save} from "./utils/save.js"
import {Hash, Bucket} from "./types.js"
import {Manifest} from "./utils/manifest.js"
import {randomId} from "./utils/random-id.js"
import {MemoryBucket} from "./memory-bucket.js"

/** file storage datalake, content-addressed with blake3 hashes. */
export class Mammoth {
	#bucket
	#manifest
	#wholesome = lane(consts.max_jobs)

	constructor(bucket: Bucket = new MemoryBucket(), kv = new Kv()) {
		this.#bucket = bucket
		this.#manifest = new Manifest(kv)
	}

	async has(hash: Hash) {
		return this.#manifest.hasHash(hash)
	}

	async info(hash: Hash) {
		return this.#manifest.needInfo(hash)
	}

	async read(hash: Hash) {
		const {id} = await this.#manifest.needInfo(hash)
		return this.#bucket.read(id)
	}

	async delete(hash: Hash) {
		await this.#wholesome(async() => {
			const info = await this.#manifest.getInfo(hash)
			if (info) {
				await this.#manifest.deleteInfo(hash)
				await this.#bucket.delete(info.id)
				await this.#manifest.statsRemoveFile(info.size)
			}
		})
	}

	async write(readable: ReadableStream<Uint8Array>): Promise<Hash> {
		const id = randomId()

		await this.#manifest.addWip(id)
		const {hash, size} = await save(this.#bucket, id, readable)

		await this.#wholesome(async() => {
			if (await this.#manifest.hasHash(hash)) {
				await this.#bucket.delete(id) // forget this new file (we already have it)
			}
			else {
				await this.#manifest.saveInfo(hash, {id, size, added: Date.now()})
				await this.#manifest.statsAddFile(size)
			}
		})

		await this.#manifest.deleteWip(id)
		void this.#selfClean().catch(() => {})
		return hash
	}

	async* hashes() {
		yield* this.#manifest.hashes()
	}

	async stats() {
		return this.#manifest.getStats()
	}

	#selfClean = queue(async() => {
		const expiredIds = await this.#manifest.getExpiredIds()
		await Promise.all(expiredIds.map(id => this.#bucket.delete(id)))
		await this.#manifest.deleteWip(...expiredIds)
	}, consts.max_jobs)
}

