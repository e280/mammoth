
import {Kv} from "@e280/kv"
import {lane, queue} from "@e280/stz"

import {consts} from "./consts.js"
import {save} from "./utils/save.js"
import {Manifest} from "./utils/manifest.js"
import {randomId} from "./utils/random-id.js"
import {MemoryBucket} from "./memory-bucket.js"
import {Hash, Bucket, Analysis} from "./types.js"

/** file storage datalake, content-addressed with blake3 hashes. */
export class Mammoth {
	#bucket
	#manifest
	#wholesome = lane(consts.max_jobs)

	constructor(bucket: Bucket = new MemoryBucket(), kv = new Kv()) {
		this.#bucket = bucket
		this.#manifest = new Manifest(kv)
	}

	async* hashes() {
		yield* this.#manifest.hashes()
	}

	async has(hash: Hash) {
		return this.#manifest.hasHash(hash)
	}

	async info(hash: Hash) {
		return this.#manifest.needInfo(hash)
	}

	async stats() {
		return this.#manifest.getStats()
	}

	async read(hash: Hash) {
		const {id} = await this.#manifest.needInfo(hash)
		return this.#bucket.read(id)
	}

	async delete(hash: Hash) {
		await this.#wholesome(async() => {
			const info = await this.#manifest.getInfo(hash)
			if (info)
				await this.#manifest.scheduleDeletion(hash, info)
		})
		await this.#cleanup()
	}

	async write(readable: ReadableStream<Uint8Array>): Promise<Hash> {
		const id = randomId()
		await this.#manifest.addWip(id)
		try {
			const analysis = await save(this.#bucket, id, readable)
			const {hash, size} = analysis
			const info = {id, size, added: Date.now()}
			await this.#wholesome(() => this.#manifest.commit(hash, info))
			return analysis.hash
		}
		catch (error) {
			await this.#manifest.moveWipToTrash(id)
			throw error
		}
		finally {
			void this.#cleanup().catch(e => console.error("cleanup failed", e))
		}
	}

	#cleanup = queue(async() => {
		for await (const id of this.#manifest.getExpiredWipIds())
			await this.#manifest.moveWipToTrash(id)

		for await (const id of this.#manifest.listTrashIds()) {
			await this.#bucket.delete(id)
			await this.#manifest.dropTrashRecord(id)
		}
	}, consts.max_jobs)
}

