
import {Kv} from "@e280/kv"
import {got, hex, queue} from "@e280/stz"
import {blake3} from "@noble/hashes/blake3.js"

import {randomId} from "./utils/random-id.js"
import {Hash, Bucket, Id} from "./types.js"
import {MemoryBucket} from "./memory-bucket.js"

/** file storage datalake, content-addressed with blake3 hashes. */
export class Mammoth {
	#ids
	#stats
	#bucket

	constructor(

			/** key-value metadata manifest. */
			kv = new Kv(),

			/** dumb raw file blob storage. */
			bucket: Bucket = new MemoryBucket(),
		) {
		this.#ids = kv.scope<string>("ids")
		this.#stats = kv.store<{size: number}>("stats")
		this.#bucket = bucket
	}

	async has(hash: Hash) {
		return this.#ids.has(hash)
	}

	async size(hash: Hash) {
		const id = await this.#needId(hash)
		return this.#bucket.size(id)
	}

	async read(hash: Hash) {
		const id = await this.#needId(hash)
		return this.#bucket.read(id)
	}

	async delete(hash: Hash) {
		const id = await this.#getId(hash)
		if (id) {
			const size = await this.#bucket.size(id)
			await this.#ids.del(hash)
			await this.#bucket.delete(id)
			await this.#addSize(-size)
		}
	}

	async write(readable: ReadableStream<Uint8Array>): Promise<Hash> {
		const id = randomId()
		const pipe = new TransformStream()
		const done = this.#bucket.write(id, pipe.readable)
		const writer = pipe.writable.getWriter()
		const hasher = blake3.create()

		let size = 0

		for await (const chunk of readable) {
			await writer.write(chunk as Uint8Array<ArrayBuffer>)
			hasher.update(chunk)
			size += chunk.byteLength
		}

		await writer.close()
		await done
		const hash = hex.fromBytes(hasher.digest())
		await this.#finalizeWrite(hash, id, size)
		return hash
	}

	async* keys() {
		yield* this.#ids.keys()
	}

	async stats() {
		return (await this.#stats.get()) ?? {size: 0}
	}

	async #getId(hash: Hash): Promise<Id | undefined> {
		return this.#ids.get<string>(hash)
	}

	async #needId(hash: Hash): Promise<Id> {
		return got(await this.#getId(hash), `file not found by hash "${hash}"`)
	}

	#finalizeWrite = queue(async(hash: Hash, id: Id, size: number) => {
		const existingId = await this.#getId(hash)

		if (existingId) {
			await this.#bucket.delete(id)
		}
		else {
			await this.#ids.set(hash, id)
			await this.#addSize(size)
		}
	})

	#addSize = queue(async(sizeChange: number) => {
		const oldStats = await this.stats()
		await this.#stats.set({...oldStats, size: oldStats.size + sizeChange})
	})
}

